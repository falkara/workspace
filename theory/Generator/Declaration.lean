/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

import Generator.Comment
import Generator.Type
public import Lean.Meta.Basic

/-!
# Declaration

The module defines the declaration of TypeScript that a declaration of the theory marked
`export_typescript` takes. A structure takes a schema of Effect branded by its name, with a field
for every field of the structure, as
`Schema.Struct({ X: Schema.Rational, … }).pipe(Schema.brand('Tristimulus'))`, and a type of the
same name for what the schema decodes, and a constructor named in camel case, such as
`tristimulus`, which brands a value as a caller writes it. A structure that takes type parameters,
or whose field takes no schema, such as a function, takes an interface in place of the schema, with
a field for every field of the structure and a type parameter for every type parameter, annotated
with its variance, such as `interface Machine<in out State, in Input, out Output>`, and a
constructor that gives a value as a caller writes it. A refinement takes the schema of its type with
a filter that calls its condition and the brand of its name, as
`Schema.String.pipe(Schema.check(Schema.makeFilter(isSegment)), Schema.brand('Segment'))`, and a
type of the same name for what the schema decodes. A type takes a type alias with a type parameter
for every type parameter of the type, annotated with its variance. A function takes a type of its
signature, with a type parameter for every implicit type parameter of the function. A value takes a
constant of its type that holds the value as the kernel of Lean reduces it, a rational number as
`Rational.fromBigInt(1n)` or `Rational.makeUnsafe(1n, 2n)` and a structure of its module as its
constructor with a value for every field, such as `tristimulus({ X: …, Y: …, Z: … })`. Every
declaration and every field takes the documentation comment that the module `Comment` gives it, the
schema of a structure opening with "A schema of", its constructor with "Brands without a check",
and the constructor of an interface with "Creates". Every other declaration has no declaration of
TypeScript, and the generator refuses it.

## Main Definitions

- `naturalOf`: gives the natural number that the kernel of Lean reduces an expression to, or fails
  with the reason where it reduces to none.
- `integerOf`: gives the integer that the kernel of Lean reduces an expression to, or fails with
  the reason where it reduces to none.
- `valueOf`: gives the expression of TypeScript that writes the value of an expression of a type of
  the theory, as the kernel of Lean reduces it, for a declaration of a module of the theory, or
  fails with the reason where the type has no value in TypeScript.
- `declarationOf`: gives the declaration of TypeScript that a declaration of the theory marked
  `export_typescript` takes, named without the namespace of its module, or fails with the reason
  where the declaration has none.

## Implementation Notes

A structure takes a schema in place of a type alone, so a value from outside the package takes the
brand of the structure only by decoding, which checks every field.

The constructor of a structure brands a value by `Brand.nominal` of Effect, which checks nothing, as
the schemas the generator writes hold no checks, and constructing a value with a schema of Effect
either fails by throwing or gives an option. A structure whose schema holds a check takes a
constructor that checks the value.

A structure takes the brand of Effect, as two structures with the same fields, such as a color and
a change of a color, stay apart in TypeScript only by their brands.

A refinement takes no constructor, as its value takes the brand only through the filter, which the
schema runs on decoding.

A structure that takes an interface takes no brand, as a schema of Effect describes data alone, and
a type parameter or a function has no schema whose decoding could give the brand.

A declaration takes the words of its name after the namespace of its module, each capitalized and
joined, such as `ChromaticityOf` for `chromaticityOf` and `ChromaticityZ` for `Chromaticity.z`, as
the module `Type` names every declaration.

A value is reduced by the kernel of Lean rather than computed by the compiler, so the file holds the
value that the kernel checks every theorem of the value against.

A rational number takes `Rational.makeUnsafe` of Effect, which throws only on a denominator of 0, as
a rational number of Lean has a positive denominator.

A value takes a structure of its own module alone, as a file imports the declarations of another
module as types and schemas and never their constructors.

A declaration takes a line of its own for every comment and every field, and oxfmt formats the rest
of the generated file after the generator writes it.
-/

public section

namespace Generator

open Falkara

/-- Gives the natural number that the kernel of Lean reduces an expression to, or fails with the
reason where it reduces to none. -/
partial def naturalOf (expression : Lean.Expr) : Lean.MetaM Nat := do
  match ← Lean.ofExceptKernelException (Lean.Kernel.whnf (← Lean.getEnv) {} expression) with
  | .lit (.natVal value) => return value
  | .const ``Nat.zero _ => return 0
  | .app (.const ``Nat.succ _) predecessor => return (← naturalOf predecessor) + 1
  | reduced =>
    Lean.throwError m!"`{expression}` reduces to `{reduced}`, which is no natural number."

/-- Gives the integer that the kernel of Lean reduces an expression to, or fails with the reason
where it reduces to none. -/
def integerOf (expression : Lean.Expr) : Lean.MetaM Int := do
  match ← Lean.ofExceptKernelException (Lean.Kernel.whnf (← Lean.getEnv) {} expression) with
  | .app (.const ``Int.ofNat _) value => return (← naturalOf value)
  | .app (.const ``Int.negSucc _) value => return -((← naturalOf value) : Int) - 1
  | reduced => Lean.throwError m!"`{expression}` reduces to `{reduced}`, which is no integer."

/-- Gives the expression of TypeScript that writes the value of an expression of a type of the
theory, as the kernel of Lean reduces it, for a declaration of a module of the theory, or fails with
the reason where the type has no value in TypeScript. -/
partial def valueOf (moduleNamespace name : Lean.Name) (type expression : Lean.Expr) :
    Lean.MetaM String := do
  let environment ← Lean.getEnv
  match type with
  | .const ``Rat _ =>
    let numerator ← integerOf (Lean.mkApp (Lean.mkConst ``Rat.num) expression)
    let denominator ← naturalOf (Lean.mkApp (Lean.mkConst ``Rat.den) expression)
    if denominator == 1 then return s!"Rational.fromBigInt({numerator}n)"
    return s!"Rational.makeUnsafe({numerator}n, {denominator}n)"
  | .const structureName _ =>
    unless ExportTypeScript.tagAttribute.hasTag environment structureName &&
        Lean.isStructure environment structureName do
      Lean.throwError m!"`{name}` has no value in TypeScript, as `{structureName}` is no \
        structure marked `export_typescript`."
    unless (environment.getModuleIdxFor? structureName).map (·.toNat) ==
        (environment.getModuleIdxFor? name).map (·.toNat) do
      Lean.throwError m!"`{name}` has no value in TypeScript, as `{structureName}` lies in \
        another module, whose constructor the file never imports."
    let fields ← (Lean.getStructureFields environment structureName).toList.mapM fun field ↦ do
      let .forallE _ _ fieldType _ := (← Lean.getConstInfo (structureName ++ field)).type
        | Lean.throwError
            m!"`{structureName}` has no value in TypeScript, as it takes parameters."
      return s!"{field}: {← valueOf moduleNamespace name fieldType
        (Lean.mkApp (Lean.mkConst (structureName ++ field)) expression)}"
    let constructorName :=
      (String.join ((structureName.replacePrefix moduleNamespace .anonymous).components.map
        fun component ↦ component.toString.capitalize)).decapitalize
    return s!"{constructorName}(\{ {", ".intercalate fields} })"
  | _ => Lean.throwError m!"`{name}` has no value in TypeScript, as `{type}` has none."

/-- Gives the declaration of TypeScript that a declaration of the theory marked `export_typescript`
takes, named without the namespace of its module, or fails with the reason where the declaration
has none. -/
def declarationOf (moduleNamespace name : Lean.Name) : Lean.MetaM String := do
  let environment ← Lean.getEnv
  unless ExportTypeScript.tagAttribute.hasTag environment name do
    Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory never marks it \
      `export_typescript`."
  let typeName := String.join ((name.replacePrefix moduleNamespace .anonymous).components.map
    fun component ↦ component.toString.capitalize)
  let information ← Lean.getConstInfo name
  Lean.Meta.forallBoundedTelescope information.type (some (typeParameterCount information.type))
      fun parameters rest ↦ do
    let names ← parameters.toList.mapM fun parameter ↦
      return (← parameter.fvarId!.getUserName).toString
    let arguments := if names.isEmpty then "" else s!"<{", ".intercalate names}>"
    let variances ← variancesOf name
    let generics := if names.isEmpty then "" else
      s!"<{", ".intercalate ((names.zip variances).map fun (parameter, polarities) ↦
      match polarities.contains false, polarities.contains true with
      | true, true => s!"in out {parameter}"
      | true, false => s!"in {parameter}"
      | false, true => s!"out {parameter}"
      | false, false => parameter)}>"
    match ← kindOf name with
    | .dataStructure =>
      let fields ← (← fieldTypesOf name parameters).mapM fun (field, fieldType) ↦ do
        return s!"{← commentOf (name ++ field)}{field}: {← schemaOf moduleNamespace fieldType},\n"
      return s!"{← commentOf name (some "A schema of")}export const {typeName} = \
          Schema.Struct(\{\n{String.join fields}}).pipe(Schema.brand('{typeName}'));\n\n" ++
        s!"{← commentOf name}export type {typeName} = typeof {typeName}.Type;\n\n" ++
        s!"{← commentOf name (some "Brands without a check")}export const \
          {typeName.decapitalize} = Brand.nominal<{typeName}>();\n"
    | .structure =>
      let fields ← (← fieldTypesOf name parameters).mapM fun (field, fieldType) ↦ do
        return s!"{← commentOf (name ++ field)}readonly {field}: \
          {← typeOf moduleNamespace fieldType};\n"
      return s!"{← commentOf name}export interface {typeName}{generics} \
          \{\n{String.join fields}}\n\n" ++
        s!"{← commentOf name (some "Creates")}export const {typeName.decapitalize} = \
          {arguments}(fields: {typeName}{arguments}): {typeName}{arguments} => fields;\n"
    | .refinement base condition =>
      let conditionName :=
        (String.join ((condition.replacePrefix moduleNamespace .anonymous).components.map
          fun component ↦ component.toString.capitalize)).decapitalize
      return s!"{← commentOf name (some "A schema of")}export const {typeName} = \
          {← schemaOf moduleNamespace base}.pipe(Schema.check(Schema.makeFilter(\
          {conditionName})), Schema.brand('{typeName}'));\n\n" ++
        s!"{← commentOf name}export type {typeName} = typeof {typeName}.Type;\n"
    | .type =>
      let some value := information.value?
        | Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory gives the \
            type no value."
      return s!"{← commentOf name}export type {typeName}{generics} = \
        {← typeOf moduleNamespace (value.beta parameters)};\n"
    | .function =>
      let (signature, result) ← signatureOf moduleNamespace [] rest
      return s!"{← commentOf name}export type {typeName} = \
        {arguments}({", ".intercalate signature}) => {result};\n"
    | .value =>
      unless names.isEmpty do
        Lean.throwError m!"`{name}` has no value in TypeScript, as it takes type parameters."
      return s!"{← commentOf name}export const {typeName.decapitalize}: \
        {← typeOf moduleNamespace rest} = \
        {← valueOf moduleNamespace name rest (Lean.mkConst name)};\n"

end Generator
