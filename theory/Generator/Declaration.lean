/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

import Generator.Comment
public import Generator.Import
import Generator.Type

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
constructor that gives a value as a caller writes it. A bundled structure, a type that applies a
structure of Mathlib with a field whose value is a type, such as
`Endofunctor.Coalgebra F`, takes the same interface and constructor, with a type parameter in
place of every field whose value is a type, and a functor that is a parameter constrained to a type
lambda of Effect, such as `interface Coalgebra<in out F extends HKT.TypeLambda, in out V>` with
`readonly str: (value: V) => HKT.Kind<F, never, never, never, V>`. A functor on types takes an
interface that extends the type lambda of Effect, with the object of the functor at the object of
the lambda as its type, and a curried functor, a functor from types into the functors on types,
takes the same interface with a type parameter for the type it maps, named as its definition names
it, such as `interface BinaryProductFunctor<out X> extends HKT.TypeLambda` with
`readonly type: readonly [X, this['Target']]`. The type of the functors on types takes an interface
that extends the type class of Effect with a type parameter `F` for the functor, a field for every
field that is no proof, and a constructor, such as
`interface Functor<in out F extends HKT.TypeLambda> extends HKT.TypeClass<F>` with its field `map`.
A refinement takes the schema of its type with a
filter that calls its condition and the brand of its name, as
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
- `Value`: a value of the theory as the kernel of Lean reduces it.
- `valueOf`: gives the value of an expression of a type of the theory, as the kernel of Lean
  reduces it, for a declaration of the theory, or fails with the reason where the type has no
  value.
- `initializerOf`: gives the expression of TypeScript that writes a value for a declaration of a
  module of the theory, or fails with the reason where the value takes a structure of another
  module.
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

A declaration takes the name that the module `Name` gives it, such as `ChromaticityOf` for
`chromaticityOf` and `ChromaticityZ` for `Chromaticity.z`, as every module of the generator names
the declaration.

A value is reduced by the kernel of Lean rather than computed by the compiler, so the file holds the
value that the kernel checks every theorem of the value against. The value is reduced apart from
the expression of TypeScript that writes it, so the reduction holds for a language other than
TypeScript as well.

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

/-- A value of the theory as the kernel of Lean reduces it. -/
inductive Value where
  /-- A rational number by its numerator and its positive denominator. -/
  | rational (numerator : Int) (denominator : Nat)
  /-- A structure marked `export_typescript` by its name and the value of every field. -/
  | structure (name : Lean.Name) (fields : List (Lean.Name × Value))

/-- Gives the value of an expression of a type of the theory, as the kernel of Lean reduces it, for
a declaration of the theory, or fails with the reason where the type has no value. -/
partial def valueOf (name : Lean.Name) (type expression : Lean.Expr) : Lean.MetaM Value := do
  let environment ← Lean.getEnv
  match type with
  | .const ``Rat _ =>
    return .rational (← integerOf (Lean.mkApp (Lean.mkConst ``Rat.num) expression))
      (← naturalOf (Lean.mkApp (Lean.mkConst ``Rat.den) expression))
  | .const structureName _ =>
    unless ExportTypeScript.tagAttribute.hasTag environment structureName &&
        Lean.isStructure environment structureName do
      Lean.throwError m!"`{name}` has no value in TypeScript, as `{structureName}` is no \
        structure marked `export_typescript`."
    let fields ← (Lean.getStructureFields environment structureName).toList.mapM fun field ↦ do
      let .forallE _ _ fieldType _ := (← Lean.getConstInfo (structureName ++ field)).type
        | Lean.throwError
            m!"`{structureName}` has no value in TypeScript, as it takes parameters."
      return (field,
        ← valueOf name fieldType (Lean.mkApp (Lean.mkConst (structureName ++ field)) expression))
    return .structure structureName fields
  | _ => Lean.throwError m!"`{name}` has no value in TypeScript, as `{type}` has none."

/-- Gives the expression of TypeScript that writes a value for a declaration of a module of the
theory, or fails with the reason where the value takes a structure of another module. -/
partial def initializerOf (moduleNamespace name : Lean.Name) : Value → TypeScriptM String
  | .rational numerator 1 => do
    return s!"{← effectNameOf "Rational" "fromBigInt" .value}({numerator}n)"
  | .rational numerator denominator => do
    return s!"{← effectNameOf "Rational" "makeUnsafe" .value}({numerator}n, {denominator}n)"
  | .structure structureName fields => do
    let environment ← Lean.getEnv
    unless (environment.getModuleIdxFor? structureName).map (·.toNat) ==
        (environment.getModuleIdxFor? name).map (·.toNat) do
      Lean.throwError m!"`{name}` has no value in TypeScript, as `{structureName}` lies in \
        another module, whose constructor the file never imports."
    let written ← fields.mapM fun (field, value) ↦ do
      return s!"{field}: {← initializerOf moduleNamespace name value}"
    return s!"{camelCaseOf (wordsOf moduleNamespace structureName)}\
      (\{ {", ".intercalate written} })"

/-- Gives the declaration of TypeScript that a declaration of the theory marked `export_typescript`
takes, named without the namespace of its module, or fails with the reason where the declaration
has none. -/
def declarationOf (moduleNamespace name : Lean.Name) : TypeScriptM String := do
  let environment ← Lean.getEnv
  unless ExportTypeScript.tagAttribute.hasTag environment name do
    Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory never marks it \
      `export_typescript`."
  let typeName := pascalCaseOf (wordsOf moduleNamespace name)
  let valueName := camelCaseOf (wordsOf moduleNamespace name)
  parametersOf (← Lean.getConstInfo name) fun parameters rest value? ↦ do
    let names ← parameters.toList.mapM fun parameter ↦
      return (← parameter.fvarId!.getUserName).toString
    let arguments := if names.isEmpty then "" else s!"<{", ".intercalate names}>"
    let variances ← variancesOf name
    let annotated ← ((parameters.toList.zip names).zip variances).mapM
      fun ((parameter, parameterName), polarities) ↦
        genericOf parameter (annotationOf parameterName polarities)
    let generics := if names.isEmpty then "" else s!"<{", ".intercalate annotated}>"
    match ← kindOf name with
    | .dataStructure =>
      let fields ← (← fieldTypesOf name parameters).mapM fun (field, fieldType) ↦ do
        return s!"{← commentOf (name ++ field)}{field}: {← schemaOf moduleNamespace fieldType},\n"
      return s!"{← commentOf name (some "A schema of")}export const {typeName} = \
          {← effectNameOf "Schema" "Struct" .value}(\{\n{String.join fields}}).pipe(\
          {← effectNameOf "Schema" "brand" .value}('{typeName}'));\n\n" ++
        s!"{← commentOf name}export type {typeName} = typeof {typeName}.Type;\n\n" ++
        s!"{← commentOf name (some "Brands without a check")}export const \
          {valueName} = {← effectNameOf "Brand" "nominal" .value}<{typeName}>();\n"
    | .structure =>
      let fields ← (← fieldTypesOf name parameters).mapM fun (field, fieldType) ↦ do
        return s!"{← commentOf (name ++ field)}readonly {field}: \
          {← typeOf moduleNamespace fieldType};\n"
      return s!"{← commentOf name}export interface {typeName}{generics} \
          \{\n{String.join fields}}\n\n" ++
        s!"{← commentOf name (some "Creates")}export const {valueName} = \
          {arguments}(fields: {typeName}{arguments}): {typeName}{arguments} => fields;\n"
    | .refinement base condition =>
      return s!"{← commentOf name (some "A schema of")}export const {typeName} = \
          {← schemaOf moduleNamespace base}.pipe({← effectNameOf "Schema" "check" .value}(\
          {← effectNameOf "Schema" "makeFilter" .value}(\
          {camelCaseOf (wordsOf moduleNamespace condition)})), \
          {← effectNameOf "Schema" "brand" .value}('{typeName}'));\n\n" ++
        s!"{← commentOf name}export type {typeName} = typeof {typeName}.Type;\n"
    | .bundled =>
      let some value := value?
        | Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory gives the \
            type no value."
      let .const structureName _ := value.getAppFn
        | Lean.throwError m!"`{name}` applies no structure."
      bundledFieldsOf value fun bundledParameters fields ↦ do
        let allParameters := parameters.toList ++ bundledParameters
        let allNames ← allParameters.mapM fun parameter ↦
          return (← parameter.fvarId!.getUserName).toString
        let allArguments := if allNames.isEmpty then "" else s!"<{", ".intercalate allNames}>"
        let annotations ← (allParameters.zip allNames).mapM fun (parameter, parameterName) ↦ do
          genericOf parameter (annotationOf parameterName
            (← fields.flatMapM fun (_, fieldType) ↦ polaritiesOf parameter true fieldType))
        let allGenerics := if allNames.isEmpty then "" else s!"<{", ".intercalate annotations}>"
        -- The constructor declares the parameters with their constraints and applies the
        -- interface to them by their names alone.
        let constrained ← (allParameters.zip allNames).mapM fun (parameter, parameterName) ↦
          genericOf parameter parameterName
        let declared := if allNames.isEmpty then "" else s!"<{", ".intercalate constrained}>"
        let fieldLines ← fields.mapM fun (field, fieldType) ↦ do
          return s!"{← commentOf (structureName ++ field)}readonly {field}: \
            {← typeOf moduleNamespace fieldType};\n"
        return s!"{← commentOf name}export interface {typeName}{allGenerics} \
            \{\n{String.join fieldLines}}\n\n" ++
          s!"{← commentOf name (some "Creates")}export const {valueName} = \
            {declared}(fields: {typeName}{allArguments}): {typeName}{allArguments} => fields;\n"
    | .functor =>
      let some value := value?
        | Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory gives the \
            functor no value."
      lambdaObjectOf value rest fun object ↦ do
        return s!"{← commentOf name}export interface {typeName}{generics} extends \
          {← effectNameOf "HKT" "TypeLambda" .type} \{\n\
          readonly type: {← typeOf moduleNamespace object};\n}\n"
    | .functorClass =>
      let some value := value?
        | Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory gives the \
            type no value."
      let .const structureName _ := value.getAppFn
        | Lean.throwError m!"`{name}` applies no structure."
      functorFieldsOf value fun functor fields ↦ do
        let generic ← genericOf functor (annotationOf "F"
          (← fields.flatMapM fun (_, fieldType) ↦ polaritiesOf functor true fieldType))
        let fieldLines ← fields.mapM fun (field, fieldType) ↦ do
          return s!"{← commentOf (structureName ++ field)}readonly {field}: \
            {← typeOf moduleNamespace fieldType};\n"
        return s!"{← commentOf name}export interface {typeName}<{generic}> extends \
            {← effectNameOf "HKT" "TypeClass" .type}<F> \{\n{String.join fieldLines}}\n\n" ++
          s!"{← commentOf name (some "Creates")}export const {valueName} = \
            <{← genericOf functor "F"}>(fields: {typeName}<F>): {typeName}<F> => fields;\n"
    | .curriedFunctor =>
      let some value := value?
        | Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory gives the \
            functor no value."
      let some targetType := curriedTargetOf? rest
        | Lean.throwError m!"`{name}` is no curried functor."
      -- The object of the curried functor takes a type parameter after those of the declaration.
      curriedObjectOf value rest fun parameter functor ↦
        lambdaObjectOf functor targetType fun object ↦ do
          let parameterName := (← parameter.fvarId!.getUserName).toString
          let objectGeneric := annotationOf parameterName (← polaritiesOf parameter true object)
          return s!"{← commentOf name}export interface {typeName}\
            <{", ".intercalate (annotated ++ [objectGeneric])}> extends \
            {← effectNameOf "HKT" "TypeLambda" .type} \{\n\
            readonly type: {← typeOf moduleNamespace object};\n}\n"
    | .type =>
      let some value := value?
        | Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory gives the \
            type no value."
      return s!"{← commentOf name}export type {typeName}{generics} = \
        {← typeOf moduleNamespace value};\n"
    | .function =>
      let (signature, result) ← signatureOf moduleNamespace [] rest
      return s!"{← commentOf name}export type {typeName} = \
        {arguments}({", ".intercalate signature}) => {result};\n"
    | .value =>
      unless names.isEmpty do
        Lean.throwError m!"`{name}` has no value in TypeScript, as it takes type parameters."
      return s!"{← commentOf name}export const {valueName}: \
        {← typeOf moduleNamespace rest} = \
        {← initializerOf moduleNamespace name (← valueOf name rest (Lean.mkConst name))};\n"

end Generator
