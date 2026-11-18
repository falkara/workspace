/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

import Lean.Meta.InferType
import Generator.Comment
public import Generator.Import
import Generator.Path
import Generator.Type

/-!
# Theorem

The module defines the test of TypeScript that a theorem of the theory marked `export_typescript`
takes, so that the module of the package that implements the functions of the theory is bounded by
the theorems as well as by the types. A theorem that holds for every value of its variables takes
a property test of `@effect/vitest`, which draws the variables from their schemas, and a theorem
with no variable takes a test of its values. A hypothesis of the form $a = b$ or $a \neq b$ skips
the values that break it, and the conclusion $l = r$ takes `expect(actual).toEqual(expected)` with
`actual` the value of $l$ and `expected` that of $r$.

The expressions of a theorem take the functions, the constructors, and the fields of the module of
the package, imported under the name of its module of the theory, such as
`Tristimulus.tristimulusAdd(first, second)`, and rational literals, $+$, $-$, $\cdot$, and options
from Effect. Every other expression has no form in TypeScript, and the generator refuses it.

## Main Definitions

- `moduleAliasOf`: gives the name under which a test imports the module of the package that holds
  a declaration, the last word of the name of its module of the theory.
- `expressionOf`: gives the expression of TypeScript that an expression of a theorem takes, with
  the declarations of the theory whose modules of the package it names, or fails with the reason
  where the expression has none.
- `arbitraryOf`: gives the schema from which a property test draws a variable of a type, with the
  declarations of the theory whose modules of the package it names, or fails with the reason where
  the type has none.
- `testOf`: gives the test of TypeScript that a theorem of the theory marked `export_typescript`
  takes, with the declarations of the theory whose modules of the package it names, or fails with
  the reason where the theorem has none.
- `testFileOf`: gives the file of tests of TypeScript that holds the tests of the theorems of a
  module of the theory of a package, which imports the modules of the package that the tests name.

## Implementation Notes

A test calls the module of the package rather than the generated module, so that the test bounds
the implementation, which is the only code a theorem of the theory has not proved.

A quotient has no form in a test, as `Rational.divide` of Effect gives an option where the division
of Lean gives 0.

A test takes a line of its own for every comment and every statement, and oxfmt formats the rest of
the generated file after the generator writes it.
-/

public section

namespace Generator

open Falkara

/-- Gives the name under which a test imports the module of the package that holds a declaration,
the last word of the name of its module of the theory. -/
def moduleAliasOf (name : Lean.Name) : Lean.MetaM String := do
  let environment ← Lean.getEnv
  let some index := environment.getModuleIdxFor? name
    | Lean.throwError m!"`{name}` lies in no module of the theory that a test can import."
  match environment.header.moduleNames[index.toNat]? with
  | some (.str _ last) => return last
  | _ => Lean.throwError m!"`{name}` lies in no module of the theory that a test can import."

/-- Gives the expression of TypeScript that an expression of a theorem takes, with the declarations
of the theory whose modules of the package it names, or fails with the reason where the expression
has none. -/
partial def expressionOf (packageNamespace : Lean.Name) (expression : Lean.Expr) :
    TypeScriptM (String × List Lean.Name) := do
  let environment ← Lean.getEnv
  if let .fvar binder := expression then
    return ((← binder.getUserName).toString, [])
  -- Only the operands that take a form of their own are written, so a type or an instance among
  -- the arguments is never written.
  let call := fun (function : String) (operands : List Lean.Expr) (named : List Lean.Name) ↦ do
    let written ← operands.mapM (expressionOf packageNamespace)
    return (s!"{function}({", ".intercalate (written.map Prod.fst)})",
      named ++ written.flatMap Prod.snd)
  let callEffect := fun (module function : String) (operands : List Lean.Expr) ↦ do
    call (← effectNameOf module function .value) operands []
  match expression.getAppFn, expression.getAppArgs.toList with
  | .const ``OfNat.ofNat _, [.const ``Rat _, .lit (.natVal value), _] =>
    return (s!"{← effectNameOf "Rational" "fromBigInt" .value}({value}n)", [])
  | .const ``Neg.neg _, [.const ``Rat _, _, value] => callEffect "Rational" "negate" [value]
  | .const ``HAdd.hAdd _, [.const ``Rat _, _, _, _, augend, addend] =>
    callEffect "Rational" "sum" [augend, addend]
  | .const ``HSub.hSub _, [.const ``Rat _, _, _, _, minuend, subtrahend] =>
    callEffect "Rational" "subtract" [minuend, subtrahend]
  | .const ``HMul.hMul _, [.const ``Rat _, _, _, _, multiplicand, multiplier] =>
    callEffect "Rational" "multiply" [multiplicand, multiplier]
  | .const ``Option.some _, [_, value] => callEffect "Option" "some" [value]
  | .const ``Option.none _, [_] => callEffect "Option" "none" []
  | .const name _, arguments =>
    let valueName := fun (declaration : Lean.Name) ↦
      camelCaseOf (wordsOf packageNamespace declaration)
    if let some projection := environment.getProjectionFnInfo? name then
      if ExportTypeScript.tagAttribute.hasTag environment name.getPrefix then
        if let (.str _ field, some value) := (name, arguments[projection.numParams]?) then
          let (script, named) ← expressionOf packageNamespace value
          return (s!"{script}.{field}", named)
    if let some (.ctorInfo constructor) := environment.find? name then
      if ExportTypeScript.tagAttribute.hasTag environment constructor.induct then
        let written ←
          (arguments.drop constructor.numParams).mapM (expressionOf packageNamespace)
        let fields :=
          (Lean.getStructureFields environment constructor.induct).toList.map (·.toString)
        let values := (fields.zip (written.map Prod.fst)).map fun (field, value) ↦
          s!"{field}: {value}"
        return (s!"{← moduleAliasOf constructor.induct}.\
            {valueName constructor.induct}(\{ {", ".intercalate values} })",
          constructor.induct :: written.flatMap Prod.snd)
    if ExportTypeScript.tagAttribute.hasTag environment name &&
        !(environment.find? name matches some (.thmInfo _)) && arguments.length > 0 then
      if (← kindOf name) matches .function then
        return ← call s!"{← moduleAliasOf name}.{valueName name}" arguments [name]
    Lean.throwError m!"`{expression}` has no expression in a test of TypeScript."
  | _, _ => Lean.throwError m!"`{expression}` has no expression in a test of TypeScript."

/-- Gives the schema from which a property test draws a variable of a type, with the declarations of
the theory whose modules of the package it names, or fails with the reason where the type has
none. -/
partial def arbitraryOf (packageNamespace : Lean.Name) (type : Lean.Expr) :
    TypeScriptM (String × List Lean.Name) := do
  match type with
  | .const ``Rat _ => return (← effectNameOf "Schema" "Rational" .value, [])
  | .app (.const ``Option _) element =>
    let (script, named) ← arbitraryOf packageNamespace element
    return (s!"{← effectNameOf "Schema" "Option" .value}({script})", named)
  | .const name _ =>
    unless ExportTypeScript.tagAttribute.hasTag (← Lean.getEnv) name &&
        (← kindOf name) matches .dataStructure do
      Lean.throwError m!"`{name}` has no schema that a test can draw from."
    return (s!"{← moduleAliasOf name}.{pascalCaseOf (wordsOf packageNamespace name)}", [name])
  | _ => Lean.throwError m!"`{type}` has no schema that a test can draw from."

/-- Gives the test of TypeScript that a theorem of the theory marked `export_typescript` takes,
with the declarations of the theory whose modules of the package it names, or fails with the reason
where the theorem has none. -/
def testOf (packageNamespace name : Lean.Name) : TypeScriptM (String × List Lean.Name) := do
  Lean.Meta.forallTelescope (← Lean.getConstInfo name).type fun variables conclusion ↦ do
    let mut arbitraries : List (String × String) := []
    let mut conditions : List String := []
    let mut named : List Lean.Name := []
    for binder in variables do
      let type ← Lean.Meta.inferType binder
      if ← Lean.Meta.isProp type then
        match type.getAppFn, type.getAppArgs.toList with
        | .const ``Ne _, [_, left, right] =>
          let (leftScript, leftNamed) ← expressionOf packageNamespace left
          let (rightScript, rightNamed) ← expressionOf packageNamespace right
          conditions := conditions ++
            [s!"{← effectNameOf "Equal" "equals" .value}({leftScript}, {rightScript})"]
          named := named ++ leftNamed ++ rightNamed
        | .const ``Eq _, [_, left, right] =>
          let (leftScript, leftNamed) ← expressionOf packageNamespace left
          let (rightScript, rightNamed) ← expressionOf packageNamespace right
          conditions := conditions ++
            [s!"!{← effectNameOf "Equal" "equals" .value}({leftScript}, {rightScript})"]
          named := named ++ leftNamed ++ rightNamed
        | _, _ =>
          Lean.throwError m!"`{type}` is no hypothesis that a test can skip the values of."
      else
        let binderName := (← binder.fvarId!.getUserName).toString
        if ["actual", "expected"].contains binderName then
          Lean.throwError m!"`{name}` names a variable `{binderName}`, which the test takes for a \
            side of the conclusion."
        let (script, typeNamed) ← arbitraryOf packageNamespace type
        arbitraries := arbitraries ++ [(binderName, script)]
        named := named ++ typeNamed
    let .app (.app (.app (.const ``Eq _) _) left) right := conclusion
      | Lean.throwError m!"`{conclusion}` is no equation that a test can check."
    let (leftScript, leftNamed) ← expressionOf packageNamespace left
    let (rightScript, rightNamed) ← expressionOf packageNamespace right
    let body :=
      String.join (conditions.map fun condition ↦ s!"if ({condition}) \{\nreturn;\n}\n") ++
      s!"const actual = {leftScript};\nconst expected = {rightScript};\n\
        expect(actual).toEqual(expected);\n"
    let testName := (name.replacePrefix packageNamespace .anonymous).toString
    let test := if arbitraries.isEmpty then s!"it('{testName}', () => \{\n{body}});\n" else
      let schemas := arbitraries.map fun (binderName, schema) ↦ s!"{binderName}: {schema}"
      s!"it.prop('{testName}', \{ {", ".intercalate schemas} }, \
        (\{ {", ".intercalate (arbitraries.map Prod.fst)} }) => \{\n{body}});\n"
    return (s!"{← commentOf name}{test}", named ++ leftNamed ++ rightNamed)

/-- Gives the file of tests of TypeScript that holds the tests of the theorems of a module of the
theory of a package, which imports the modules of the package that the tests name. -/
def testFileOf (theory module : Lean.Name) (packageNamespace : Lean.Name)
    (theorems : List Lean.Name) : Lean.MetaM String := do
  let environment ← Lean.getEnv
  let (tests, records) ← (theorems.mapM (testOf packageNamespace)).run []
  let body := "\n".intercalate (tests.map Prod.fst)
  let named := (tests.flatMap Prod.snd).filterMap fun name ↦
    (environment.getModuleIdxFor? name).map (·.toNat)
  let modules := (named.eraseDups.mergeSort (· ≤ ·)).filterMap fun index ↦
    environment.header.moduleNames[index]?
  -- A test names every module of Effect as a value, so the file imports each of them as a value.
  let effectModules := (effectImportsOf records).map Prod.fst
  let effectImport := if effectModules.isEmpty then "" else
    s!"import \{ {", ".intercalate effectModules} } from 'effect';\n"
  let packageImports := String.join (← modules.mapM fun named ↦ do
    let path := pathOf theory named
    let .str _ last := named
      | Lean.throwError m!"`{named}` has no name that a test can import it under."
    return s!"import * as {last} from '#src/{path}';\n")
  let modulePath := pathOf theory module
  return s!"// Written by the generator of the theory from `{module}`, so every change by hand is \
      lost when the generator runs.\n\n" ++
    s!"import \{ describe, expect, it } from '@effect/vitest';\n\
      {effectImport}\n{packageImports}\n" ++
    s!"describe('{modulePath}', () => \{\n{body}});\n"

end Generator
