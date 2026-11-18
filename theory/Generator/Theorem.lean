/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Generator.Script
public import Lean.Meta.Basic
import Lean.Meta.InferType
import Lean.Structure
import Falkara.ExportTypeScript
import Generator.Comment
import Generator.Path

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
  takes, indented in a block of tests, with the declarations of the theory whose modules of the
  package it names, or fails with the reason where the theorem has none.
- `testFileOf`: gives the file of tests of TypeScript that holds the tests of the theorems of a
  module of the theory of a package, which imports the modules of the package that the tests name.

## Implementation Notes

A test calls the module of the package rather than the generated module, so that the test bounds
the implementation, which is the only code a theorem of the theory has not proved.

A quotient has no form in a test, as `Rational.divide` of Effect gives an option where the division
of Lean gives 0.

A test takes the form that oxfmt gives it, so the generated file passes the check of formatting of
the repository unchanged, with every expression laid out by the module `Script`. The two sides of
the conclusion take constants of their own, so the line of the check stays short.
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
    Lean.MetaM (Script × List Lean.Name) := do
  let environment ← Lean.getEnv
  if let .fvar binder := expression then
    return (.atom (← binder.getUserName).toString, [])
  -- Only the operands that take a form of their own are written, so a type or an instance among
  -- the arguments is never written.
  let call := fun (function : String) (operands : List Lean.Expr) (named : List Lean.Name) ↦ do
    let written ← operands.mapM (expressionOf packageNamespace)
    return (Script.call function (written.map Prod.fst), named ++ written.flatMap Prod.snd)
  match expression.getAppFn, expression.getAppArgs.toList with
  | .const ``OfNat.ofNat _, [.const ``Rat _, .lit (.natVal value), _] =>
    return (.call "Rational.fromBigInt" [.atom s!"{value}n"], [])
  | .const ``Neg.neg _, [.const ``Rat _, _, value] => call "Rational.negate" [value] []
  | .const ``HAdd.hAdd _, [.const ``Rat _, _, _, _, augend, addend] =>
    call "Rational.sum" [augend, addend] []
  | .const ``HSub.hSub _, [.const ``Rat _, _, _, _, minuend, subtrahend] =>
    call "Rational.subtract" [minuend, subtrahend] []
  | .const ``HMul.hMul _, [.const ``Rat _, _, _, _, multiplicand, multiplier] =>
    call "Rational.multiply" [multiplicand, multiplier] []
  | .const ``Option.some _, [_, value] => call "Option.some" [value] []
  | .const ``Option.none _, [_] => return (.call "Option.none" [], [])
  | .const name _, arguments =>
    let typeName := fun (declaration : Lean.Name) ↦ String.join
      ((declaration.replacePrefix packageNamespace .anonymous).components.map fun component ↦
        component.toString.capitalize)
    if let some projection := environment.getProjectionFnInfo? name then
      if ExportTypeScript.tagAttribute.hasTag environment name.getPrefix then
        if let (.str _ field, some value) := (name, arguments[projection.numParams]?) then
          let (script, named) ← expressionOf packageNamespace value
          return (.atom s!"{script.flat}.{field}", named)
    if let some (.ctorInfo constructor) := environment.find? name then
      if ExportTypeScript.tagAttribute.hasTag environment constructor.induct then
        let written ←
          (arguments.drop constructor.numParams).mapM (expressionOf packageNamespace)
        let fields :=
          (Lean.getStructureFields environment constructor.induct).toList.map (·.toString)
        return (.call
          s!"{← moduleAliasOf constructor.induct}.{(typeName constructor.induct).decapitalize}"
          [.object (fields.zip (written.map Prod.fst))],
          constructor.induct :: written.flatMap Prod.snd)
    if ExportTypeScript.tagAttribute.hasTag environment name &&
        !Lean.isStructure environment name &&
        !(environment.find? name matches some (.thmInfo _)) && arguments.length > 0 then
      return ← call s!"{← moduleAliasOf name}.{(typeName name).decapitalize}" arguments [name]
    Lean.throwError m!"`{expression}` has no expression in a test of TypeScript."
  | _, _ => Lean.throwError m!"`{expression}` has no expression in a test of TypeScript."

/-- Gives the schema from which a property test draws a variable of a type, with the declarations of
the theory whose modules of the package it names, or fails with the reason where the type has
none. -/
partial def arbitraryOf (packageNamespace : Lean.Name) (type : Lean.Expr) :
    Lean.MetaM (Script × List Lean.Name) := do
  match type with
  | .const ``Rat _ => return (.atom "Schema.Rational", [])
  | .app (.const ``Option _) element =>
    let (script, named) ← arbitraryOf packageNamespace element
    return (.call "Schema.Option" [script], named)
  | .const name _ =>
    unless ExportTypeScript.tagAttribute.hasTag (← Lean.getEnv) name &&
        Lean.isStructure (← Lean.getEnv) name do
      Lean.throwError m!"`{name}` has no schema that a test can draw from."
    let typeName := String.join
      ((name.replacePrefix packageNamespace .anonymous).components.map fun component ↦
        component.toString.capitalize)
    return (.atom s!"{← moduleAliasOf name}.{typeName}", [name])
  | _ => Lean.throwError m!"`{type}` has no schema that a test can draw from."

/-- Gives the test of TypeScript that a theorem of the theory marked `export_typescript` takes,
indented in a block of tests, with the declarations of the theory whose modules of the package it
names, or fails with the reason where the theorem has none. -/
def testOf (packageNamespace name : Lean.Name) : Lean.MetaM (String × List Lean.Name) := do
  Lean.Meta.forallTelescope (← Lean.getConstInfo name).type fun variables conclusion ↦ do
    let mut arbitraries : List (String × Script) := []
    let mut conditions : List Script := []
    let mut named : List Lean.Name := []
    for binder in variables do
      let type ← Lean.Meta.inferType binder
      if ← Lean.Meta.isProp type then
        match type.getAppFn, type.getAppArgs.toList with
        | .const ``Ne _, [_, left, right] =>
          let (leftScript, leftNamed) ← expressionOf packageNamespace left
          let (rightScript, rightNamed) ← expressionOf packageNamespace right
          conditions := conditions ++ [.call "Equal.equals" [leftScript, rightScript]]
          named := named ++ leftNamed ++ rightNamed
        | .const ``Eq _, [_, left, right] =>
          let (leftScript, leftNamed) ← expressionOf packageNamespace left
          let (rightScript, rightNamed) ← expressionOf packageNamespace right
          conditions := conditions ++ [.call "!Equal.equals" [leftScript, rightScript]]
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
    let spaces := fun (count : Nat) ↦ String.ofList (List.replicate count ' ')
    let bodyAt := fun (indentation : Nat) ↦
      String.join (conditions.map fun condition ↦
        s!"{spaces indentation}if ({condition.render indentation (indentation + 4) 3}) \{\n" ++
          s!"{spaces (indentation + 2)}return;\n{spaces indentation}}\n") ++
      s!"{spaces indentation}const actual = \
        {leftScript.render indentation (indentation + 15) 1};\n" ++
      s!"{spaces indentation}const expected = \
        {rightScript.render indentation (indentation + 17) 1};\n" ++
      s!"{spaces indentation}expect(actual).toEqual(expected);\n"
    let testName := (name.replacePrefix packageNamespace .anonymous).toString
    let (function, arguments, parameters) :=
      if arbitraries.isEmpty then ("it", [s!"'{testName}'"], "()") else
        ("it.prop", [s!"'{testName}'", (Script.object arbitraries).flat],
          s!"(\{ {", ".intercalate (arbitraries.map Prod.fst)} })")
    let opening := s!"  {function}({", ".intercalate arguments}, {parameters} => \{"
    -- Oxfmt keeps the arguments on the line of the call while the line holds at most 100 columns,
    -- and otherwise takes every argument on a line of its own.
    let test := if opening.length ≤ 100 then s!"{opening}\n{bodyAt 4}  });\n" else
      let laidOut := if arbitraries.isEmpty then [s!"'{testName}'"] else
        [s!"'{testName}'", (Script.object arbitraries).render 4 4 1]
      s!"  {function}(\n{String.join (laidOut.map (s!"    {·},\n"))}    {parameters} => \
        \{\n{bodyAt 6}    },\n  );\n"
    return (s!"{← commentOf name "  "}{test}", named ++ leftNamed ++ rightNamed)

/-- Gives the file of tests of TypeScript that holds the tests of the theorems of a module of the
theory of a package, which imports the modules of the package that the tests name. -/
def testFileOf (theory module : Lean.Name) (packageNamespace : Lean.Name)
    (theorems : List Lean.Name) : Lean.MetaM String := do
  let environment ← Lean.getEnv
  let tests ← theorems.mapM (testOf packageNamespace)
  let body := "\n".intercalate (tests.map Prod.fst)
  let named := (tests.flatMap Prod.snd).filterMap fun name ↦
    (environment.getModuleIdxFor? name).map (·.toNat)
  let modules := (named.eraseDups.mergeSort (· ≤ ·)).filterMap fun index ↦
    environment.header.moduleNames[index]?
  let effectModules := ["Equal", "Option", "Rational", "Schema"].filter fun effectModule ↦
    (body.splitOn s!"{effectModule}.").length > 1
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
