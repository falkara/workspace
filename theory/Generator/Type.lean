/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.ExportTypeScript
public import Lean.Meta.AppBuilder
public import Lean.Structure
public import Generator.Import
public import Generator.Name

/-!
# Type

The module defines the type of TypeScript that a type of the theory takes: `Rational.Rational`
for a rational number, `string` for a string, `boolean` for a boolean, `Option.Option` for an
option, `ReadonlyArray` for an array or a list, a function type for a function type of the theory,
the name of a type parameter for the parameter, and the name of a declaration marked
`export_typescript` for the type that the declaration defines, with its arguments where it takes
type parameters, such as `MachineOutcome<State, Output>`. The module defines as well the schema of
Effect that a type of data takes: `Schema.Rational` for a rational number, `Schema.String` for a
string, `Schema.Boolean` for a boolean, `Schema.Option` for an option, `Schema.Array` for an array
or a list, the name of a structure marked `export_typescript` for the schema that the structure
defines, where every field of the structure takes a schema and the structure takes no type
parameters, and the name of a refinement marked `export_typescript` for the schema that the
refinement defines. A refinement is a subtype of a type by a condition marked `export_typescript`
that gives a boolean, such as `{ name : String // isSegment name = true }`. Every other type has no
type of TypeScript, a function type and a type parameter have no schema, and the generator refuses
both. The module defines as well the variance of every type parameter of a declaration, the
polarities at which the parameter occurs in the fields or the value of the declaration.

## Main Definitions

- `typeParameterCount`: gives the number of type parameters of a declaration, the leading binders
  of its type over a type.
- `refinementOf`: gives the type and the condition of a refinement, a type of the theory whose
  value is a subtype `{ value : T // condition value = true }` of a type `T` by a function
  `condition` marked `export_typescript`, where the declaration is one.
- `fieldTypesOf`: gives the type of every field of a structure, with the type parameters given in
  place of those of the structure, or fails with the reason where the type of a field depends on
  the structure.
- `normalizedOf`: gives a type of the theory as TypeScript reads it: a morphism `X ⟶ Y` of the
  category of types as the function type `(value : X) → Y`, and an object `F.obj X` of a functor `F`
  as the type it reduces to, such as `X` for the identity functor.
- `bundledOf`: gives the structure that a type of the theory applies, where the type is a bundled
  structure, one with a field whose value is a type, such as `Endofunctor.Coalgebra (𝟭 (Type u))`
  with its state space `V`.
- `bundledFieldsOf`: runs a computation on the fields of a bundled structure that a type of the
  theory applies, with a type parameter in place of every field whose value is a type and the type
  of every other field, with every such type parameter in place of the projection of its field, as
  `normalizedOf` reads it, or fails with the reason where the type of a field depends on another
  field.
- `typeOf`: gives the type of TypeScript that a type of the theory takes, with every declaration
  named without the namespace of its package, or fails with the reason where the type has none.
- `signatureOf`: gives the parameters and the result of TypeScript that a function type of the
  theory takes, with the parameters already written before the rest of the type.
- `isDataType`: tells whether a type of the theory is a type of data: a rational number, a string, a
  boolean, an option, an array, or a list of data, a structure of data marked `export_typescript`,
  or a refinement marked `export_typescript`.
- `isData`: tells whether a structure is a structure of data, one without type parameters whose
  every field takes a type of data.
- `annotationOf`: gives a type parameter as TypeScript annotates it with its variance, `in` where it
  occurs negatively, `out` where it occurs positively, both where it occurs at both polarities, and
  neither where it does not occur.
- `DeclarationKind`: a kind of declaration of the theory, which the generator writes in a form of
  its own.
- `kindOf`: gives the kind of a declaration of the theory.
- `schemaOf`: gives the schema of Effect that a type of data of the theory takes, with every
  structure named without the namespace of its package, or fails with the reason where the type
  has none.
- `polaritiesOf`: gives the polarities at which a type parameter occurs in a type, `true` for a
  positive occurrence and `false` for a negative one, given the polarity of the type.
- `variancesOf`: gives the polarities at which every type parameter of a declaration occurs in the
  fields of the declaration where it is a structure and in its value otherwise.

## Implementation Notes

The types and the schemas of TypeScript name the modules `Rational`, `Option`, and `Schema` of
Effect, as the packages of the repository compute with Effect, and record each module they name by
the module `Import`.

A type of data and the kind of a declaration are told apart from the theory alone, so every
module of the generator writes a declaration by the same kind, and a type of data takes a schema
because it is data.

A declaration takes the name that the module `Name` gives it in Pascal case, such as
`MachineOutcome` for `Machine.Outcome`, as a type of TypeScript is named in Pascal case and the
namespace has no counterpart in a module of TypeScript.

A function type takes every parameter by its name in the theory, as TypeScript names every
parameter of a function type, so the generator refuses a parameter that the theory leaves unnamed,
such as the parameter of `Rat → Rat`.

A type parameter is a leading binder over a type, which the generator binds as a free variable, so
a type of the theory names the parameter by the name the theory gives it.

A type parameter occurs at a positive polarity in what a type gives and at a negative polarity in
what a function takes, and an occurrence in an argument of a declaration takes the polarity of the
parameter of the declaration that the argument fills, reversed where the occurrence is negative.
-/

public section

namespace Generator

open Falkara

/-- Gives the number of type parameters of a declaration, the leading binders of its type over a
type. -/
def typeParameterCount : Lean.Expr → Nat
  | .forallE _ (.sort _) body _ => typeParameterCount body + 1
  | _ => 0

/-- Gives the type and the condition of a refinement, a type of the theory whose value is a subtype
`{ value : T // condition value = true }` of a type `T` by a function `condition` marked
`export_typescript`, where the declaration is one. -/
def refinementOf (name : Lean.Name) : Lean.MetaM (Option (Lean.Expr × Lean.Name)) := do
  let some value := (← Lean.getConstInfo name).value? | return none
  let .app (.app (.const ``Subtype _) base) (.lam _ _ body _) := value | return none
  let .app (.app (.app (.const ``Eq _) (.const ``Bool _)) (.app (.const condition _) (.bvar 0)))
      (.const ``Bool.true _) := body
    | return none
  unless ExportTypeScript.tagAttribute.hasTag (← Lean.getEnv) condition do return none
  return some (base, condition)

/-- Gives the type of every field of a structure, with the type parameters given in place of those
of the structure, or fails with the reason where the type of a field depends on the structure. -/
def fieldTypesOf (name : Lean.Name) (parameters : Array Lean.Expr) :
    Lean.MetaM (List (Lean.Name × Lean.Expr)) := do
  (Lean.getStructureFields (← Lean.getEnv) name).toList.mapM fun field ↦ do
    match ← Lean.Meta.instantiateForall (← Lean.getConstInfo (name ++ field)).type
        parameters with
    | .forallE _ _ fieldType _ =>
      if fieldType.hasLooseBVars then
        Lean.throwError m!"`{name ++ field}` has no field in TypeScript, as its type depends on \
          the structure."
      return (field, fieldType)
    | _ => Lean.throwError m!"`{name ++ field}` is no field of a structure."

/-- Gives a type of the theory as TypeScript reads it: a morphism `X ⟶ Y` of the category of types
as the function type `(value : X) → Y`, and an object `F.obj X` of a functor `F` as the type it
reduces to, such as `X` for the identity functor. -/
partial def normalizedOf (type : Lean.Expr) : Lean.MetaM Lean.Expr := do
  match type with
  | .forallE name domain body info =>
    return .forallE name (← normalizedOf domain) (← normalizedOf body) info
  | _ =>
    match type.getAppFn, type.getAppArgs with
    -- The generator imports no Mathlib, so the names of Mathlib are written as names alone.
    | .const `Quiver.Hom _, #[.sort _, _, source, target] =>
      return .forallE `value (← normalizedOf source) (← normalizedOf target) .default
    | .const `Prefunctor.obj _, _ | .const `CategoryTheory.Functor.obj _, _ =>
      let reduced ← Lean.Meta.whnfD type
      if reduced == type then return type
      normalizedOf reduced
    | function, arguments =>
      if arguments.isEmpty then return type
      return Lean.mkAppN function (← arguments.mapM normalizedOf)

/-- Gives the structure that a type of the theory applies, where the type is a bundled structure,
one with a field whose value is a type, such as `Endofunctor.Coalgebra (𝟭 (Type u))` with its state
space `V`. -/
def bundledOf (type : Lean.Expr) : Lean.MetaM (Option Lean.Name) := do
  let .const structureName _ := type.getAppFn | return none
  unless Lean.isStructure (← Lean.getEnv) structureName do return none
  Lean.Meta.withLocalDeclD `self type fun self ↦ do
    let bundled ← (Lean.getStructureFields (← Lean.getEnv) structureName).anyM fun field ↦ do
      let fieldType ← Lean.Meta.inferType (← Lean.Meta.mkProjection self field)
      return (← Lean.Meta.whnfR fieldType).isSort
    return if bundled then some structureName else none

/-- Runs a computation on the fields of a bundled structure that a type of the theory applies, with
a type parameter in place of every field whose value is a type and the type of every other field,
with every such type parameter in place of the projection of its field, as `normalizedOf` reads it,
or fails with the reason where the type of a field depends on another field. -/
def bundledFieldsOf {m : Type → Type} [Monad m] [MonadControlT Lean.MetaM m]
    [MonadLiftT Lean.MetaM m] {α : Type} (type : Lean.Expr)
    (computation : List Lean.Expr → List (Lean.Name × Lean.Expr) → m α) : m α := do
  let .const structureName _ := type.getAppFn
    | monadLift (Lean.throwError m!"`{type}` applies no structure." : Lean.MetaM α)
  Lean.Meta.withLocalDeclD `self type fun self ↦ do
    let fields := (Lean.getStructureFields (← (Lean.getEnv : Lean.MetaM _)) structureName).toList
    loop structureName self fields [] [] []
where
  /-- Takes the fields of the structure one at a time, the type parameters and the other fields in
  order. -/
  loop (structureName : Lean.Name) (self : Lean.Expr) (remaining : List Lean.Name)
      (parameters : List Lean.Expr)
      (others : List (Lean.Name × Lean.Expr)) (replacements : List (Lean.Expr × Lean.Expr)) :
      m α := do
    match remaining with
    | [] => computation parameters others
    | field :: rest =>
      let projection ← Lean.Meta.mkProjection self field
      let fieldType ← Lean.Meta.inferType projection
      if (← Lean.Meta.whnfR fieldType).isSort then
        Lean.Meta.withLocalDeclD field fieldType fun parameter ↦
          loop structureName self rest (parameters ++ [parameter]) others
            ((projection, parameter) :: replacements)
      else
        let replaced := fieldType.replace fun part ↦
          (replacements.find? fun (projected, _) ↦ projected == part).map Prod.snd
        if replaced.containsFVar self.fvarId! then
          monadLift (Lean.throwError m!"`{structureName ++ field}` has no field in TypeScript, as \
            its type depends on a field whose value is no type." : Lean.MetaM α)
        else
          loop structureName self rest parameters (others ++ [(field, ← normalizedOf replaced)])
            replacements

mutual

/-- Gives the type of TypeScript that a type of the theory takes, with every declaration named
without the namespace of its package, or fails with the reason where the type has none. -/
partial def typeOf (packageNamespace : Lean.Name) (type : Lean.Expr) : TypeScriptM String := do
  match type with
  | .forallE .. =>
    let (parameters, result) ← signatureOf packageNamespace [] type
    return s!"({", ".intercalate parameters}) => {result}"
  | .fvar parameter => return (← parameter.getUserName).toString
  | .const ``Rat _ => effectNameOf "Rational" "Rational" .type
  | .const ``String _ => return "string"
  | .const ``Bool _ => return "boolean"
  | .app (.const ``Option _) element =>
    return s!"{← effectNameOf "Option" "Option" .type}<{← typeOf packageNamespace element}>"
  | .app (.const ``Array _) element =>
    return s!"ReadonlyArray<{← typeOf packageNamespace element}>"
  | .app (.const ``List _) element =>
    return s!"ReadonlyArray<{← typeOf packageNamespace element}>"
  | .const .. | .app .. =>
    let .const name _ := type.getAppFn | Lean.throwError m!"`{type}` has no type in TypeScript."
    unless ExportTypeScript.tagAttribute.hasTag (← Lean.getEnv) name do
      Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory never marks it \
        `export_typescript`."
    let typeName := pascalCaseOf (wordsOf packageNamespace name)
    let arguments ← type.getAppArgs.toList.mapM (typeOf packageNamespace)
    if arguments.isEmpty then return typeName
    return s!"{typeName}<{", ".intercalate arguments}>"
  | _ => Lean.throwError m!"`{type}` has no type in TypeScript."

/-- Gives the parameters and the result of TypeScript that a function type of the theory takes,
with the parameters already written before the rest of the type. -/
partial def signatureOf (packageNamespace : Lean.Name) (parameters : List String)
    (type : Lean.Expr) : TypeScriptM (List String × String) := do
  match type with
  | .forallE name domain body .default =>
    if body.hasLooseBVars then
      Lean.throwError m!"`{type}` has no type in TypeScript, as its result depends on its \
        parameter `{name}`."
    if name.isAnonymous || name.hasMacroScopes then
      Lean.throwError m!"`{type}` has no type in TypeScript, as TypeScript names every parameter \
        and the theory names none."
    signatureOf packageNamespace
      (parameters ++ [s!"{name}: {← typeOf packageNamespace domain}"]) body
  | .forallE name .. =>
    Lean.throwError
      m!"`{type}` has no type in TypeScript, as its parameter `{name}` is not explicit."
  | _ => return (parameters, ← typeOf packageNamespace type)

end

mutual

/-- Tells whether a type of the theory is a type of data: a rational number, a string, a boolean, an
option, an array, or a list of data, a structure of data marked `export_typescript`, or a refinement
marked `export_typescript`. -/
partial def isDataType (type : Lean.Expr) : Lean.MetaM Bool := do
  match type with
  | .const ``Rat _ | .const ``String _ | .const ``Bool _ => return true
  | .app (.const ``Option _) element | .app (.const ``Array _) element
  | .app (.const ``List _) element => isDataType element
  | .const name _ =>
    unless ExportTypeScript.tagAttribute.hasTag (← Lean.getEnv) name do return false
    if Lean.isStructure (← Lean.getEnv) name then isData name
    else return (← refinementOf name).isSome
  | _ => return false

/-- Tells whether a structure is a structure of data, one without type parameters whose every field
takes a type of data. -/
partial def isData (name : Lean.Name) : Lean.MetaM Bool := do
  if typeParameterCount (← Lean.getConstInfo name).type > 0 then return false
  -- A structure whose field depends on the structure has no fields that a type of data describes.
  let fields ← try fieldTypesOf name #[] catch _ => return false
  fields.allM fun (_, fieldType) ↦ isDataType fieldType

end

/-- Gives a type parameter as TypeScript annotates it with its variance, `in` where it occurs
negatively, `out` where it occurs positively, both where it occurs at both polarities, and neither
where it does not occur. -/
def annotationOf (parameter : String) (polarities : List Bool) : String :=
  match polarities.contains false, polarities.contains true with
  | true, true => s!"in out {parameter}"
  | true, false => s!"in {parameter}"
  | false, true => s!"out {parameter}"
  | false, false => parameter

/-- A kind of declaration of the theory, which the generator writes in a form of its own. -/
inductive DeclarationKind where
  /-- A structure of data. -/
  | dataStructure
  /-- A structure that takes type parameters or a field of a type other than data. -/
  | structure
  /-- A refinement of a type by a condition. -/
  | refinement (base : Lean.Expr) (condition : Lean.Name)
  /-- A bundled structure, a type whose value applies a structure with a field whose value is a
  type, such as `Endofunctor.Coalgebra (𝟭 (Type u))`. -/
  | bundled
  /-- A type, a declaration whose value is a type. -/
  | type
  /-- A function, a declaration that takes parameters beyond its type parameters. -/
  | function
  /-- A value, a declaration that takes no parameters beyond its type parameters. -/
  | value

/-- Gives the kind of a declaration of the theory. -/
def kindOf (name : Lean.Name) : Lean.MetaM DeclarationKind := do
  if Lean.isStructure (← Lean.getEnv) name then
    return if ← isData name then .dataStructure else .structure
  if let some (base, condition) ← refinementOf name then return .refinement base condition
  let information ← Lean.getConstInfo name
  Lean.Meta.forallBoundedTelescope information.type (some (typeParameterCount information.type))
    fun parameters rest ↦ do
      match rest with
      | .sort _ =>
        if let some value := information.value? then
          if (← bundledOf (value.beta parameters)).isSome then return .bundled
        return .type
      | .forallE .. => return .function
      | _ => return .value

/-- Gives the schema of Effect that a type of data of the theory takes, with every structure named
without the namespace of its package, or fails with the reason where the type has none. -/
partial def schemaOf (packageNamespace : Lean.Name) (type : Lean.Expr) : TypeScriptM String := do
  match type with
  | .forallE .. => Lean.throwError m!"`{type}` has no schema in TypeScript, as a schema describes \
      data and the type is a function."
  | .const ``Rat _ => effectNameOf "Schema" "Rational" .value
  | .const ``String _ => effectNameOf "Schema" "String" .value
  | .const ``Bool _ => effectNameOf "Schema" "Boolean" .value
  | .app (.const ``Option _) element =>
    return s!"{← effectNameOf "Schema" "Option" .value}({← schemaOf packageNamespace element})"
  | .app (.const ``Array _) element | .app (.const ``List _) element =>
    return s!"{← effectNameOf "Schema" "Array" .value}({← schemaOf packageNamespace element})"
  | .const name _ =>
    unless ExportTypeScript.tagAttribute.hasTag (← Lean.getEnv) name do
      Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory never marks it \
        `export_typescript`."
    unless ← isDataType type do
      Lean.throwError m!"`{name}` has no schema in TypeScript, as it is neither a structure whose \
        every field takes a schema nor a refinement."
    return pascalCaseOf (wordsOf packageNamespace name)
  | _ => Lean.throwError m!"`{type}` has no schema in TypeScript."

mutual

/-- Gives the polarities at which a type parameter occurs in a type, `true` for a positive
occurrence and `false` for a negative one, given the polarity of the type. -/
partial def polaritiesOf (parameter : Lean.Expr) (positive : Bool) (type : Lean.Expr) :
    Lean.MetaM (List Bool) := do
  match type with
  | .fvar _ => return if type == parameter then [positive] else []
  | .forallE _ domain body _ =>
    return (← polaritiesOf parameter (!positive) domain) ++
      (← polaritiesOf parameter positive body)
  | _ =>
    let .const name _ := type.getAppFn | return []
    let variances ← if [``Option, ``Array, ``List].contains name then pure [[true]]
      else variancesOf name
    (type.getAppArgs.toList.zip variances).flatMapM fun (argument, polarities) ↦
      polarities.flatMapM fun polarity ↦ polaritiesOf parameter (positive == polarity) argument

/-- Gives the polarities at which every type parameter of a declaration occurs in the fields of the
declaration where it is a structure and in its value otherwise. -/
partial def variancesOf (name : Lean.Name) : Lean.MetaM (List (List Bool)) := do
  let information ← Lean.getConstInfo name
  Lean.Meta.forallBoundedTelescope information.type (some (typeParameterCount information.type))
      fun parameters _ ↦ do
    let types : List Lean.Expr ← if Lean.isStructure (← Lean.getEnv) name then
        pure ((← fieldTypesOf name parameters).map Prod.snd)
      else pure ((information.value?.map fun value ↦ [value.beta parameters]).getD [])
    parameters.toList.mapM fun parameter ↦ types.flatMapM (polaritiesOf parameter true)

end

end Generator
