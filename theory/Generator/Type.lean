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
option, `ReadonlyArray` for an array or a list, a read-only tuple `readonly [X, Y]` for a product
`X × Y`, a function type for a function type of the theory, `HKT.Kind<F, never, never, never, X>`
for an object `F.obj X` of a functor `F` that is a parameter, the name of a type parameter for the
parameter, and the name of a declaration marked
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

- `isFunctorType`: tells whether a type of the theory is the type of a functor on types, such as
  `Type u ⥤ Type u`.
- `typeParameterCount`: gives the number of type parameters of a declaration, the leading binders
  of its type over a type or over a functor on types.
- `parametersOf`: runs a computation on the type parameters of a declaration, with the rest of its
  type and its value applied to the parameters, and with every category that is a parameter taken
  as the category of types, the one category of TypeScript.
- `parameterObjectOf`: gives the functor and the object of an object `F.obj X` of a functor `F`
  that is a parameter, which no reduction resolves, where the type is one.
- `refinementOf`: gives the type and the condition of a refinement, a type of the theory whose
  value is a subtype `{ value : T // condition value = true }` of a type `T` by a function
  `condition` marked `export_typescript`, where the declaration is one.
- `fieldTypesOf`: gives the type of every field of a structure, with the type parameters given in
  place of those of the structure, or fails with the reason where the type of a field depends on
  the structure.
- `normalizedOf`: gives a type of the theory as TypeScript reads it: a morphism `X ⟶ Y` of the
  category of types as the function type `(value : X) → Y`, an object `F.obj X` of a functor `F`
  as the type it reduces to, such as `X` for the identity functor, and an object of a functor that
  is a parameter as it stands, with its object as TypeScript reads it.
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
- `genericOf`: gives a type parameter as TypeScript declares it, constrained to a type lambda of
  Effect, `HKT.TypeLambda`, where the parameter is a functor on types, so that `HKT.Kind` applies
  it.
- `lambdaObjectOf`: runs a computation on the object of a functor on types at the object of a type
  lambda of Effect, `this['Target']`, as `normalizedOf` reads the object, given the type of the
  functor.
- `curriedTargetOf?`: gives the type of the functors on types that a curried functor gives, a
  functor from types into the functors on types, such as `Type u ⥤ Type u ⥤ Type u`, where the
  type is the type of one.
- `curriedObjectOf`: runs a computation on the object of a curried functor at a type parameter, the
  functor on types that the curried functor gives, with the parameter named as the definition of
  the curried functor names its object, given the type of the curried functor.
- `DeclarationKind`: a kind of declaration of the theory, which the generator writes in a form of
  its own.
- `kindOf`: gives the kind of a declaration of the theory.
- `schemaOf`: gives the schema of Effect that a type of data of the theory takes, with every
  structure named without the namespace of its package, or fails with the reason where the type
  has none.
- `polaritiesOf`: gives the polarities at which a type parameter occurs in a type, `true` for a
  positive occurrence and `false` for a negative one, given the polarity of the type.
- `variancesOf`: gives the polarities at which every type parameter of a declaration occurs in the
  fields of the declaration where it is a structure, in the fields of the bundled structure that
  its value applies where its value is one, in the object of its type lambda where it is a functor,
  and in its value otherwise.

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

A product takes a tuple rather than an interface with the fields `fst` and `snd`, as Effect gives
a pair as a read-only tuple, such as the value and the next state that `Stream.unfold` takes.

A functor on types takes a type lambda of Effect, as the module `HKT` of Effect writes a type that
takes a type, which TypeScript has no syntax for, so a coalgebra of any functor takes one interface,
as `CategoryTheory.Endofunctor.Coalgebra` is one structure for every functor. The object of the
lambda is a local whose name is the text TypeScript writes for it, `this['Target']`, so the type of
the lambda is written as every other type.

A curried functor takes a type lambda with a type parameter for the type it maps, as a type lambda
of Effect gives a type and never another type lambda, so the theory names a curried functor of
Mathlib, such as `CategoryTheory.Limits.Types.binaryProductFunctor`, as it stands. The parameter
takes the name that the definition of the curried functor gives the type it maps, such as `X`, as
the declaration of the theory binds no such parameter of its own.

A category that is a parameter, such as the category of `CategoryTheory.Endofunctor.Coalgebra`,
takes the category of types, as TypeScript has no category but its types and its functions, so the
theory names a declaration of Mathlib as it stands and the translation to TypeScript fixes the
category. The category takes the instance of Mathlib for the types, `CategoryTheory.types`, by
unification, so Lean checks that the category of types fits and fixes the universes of the
declaration.

An object of a functor that is a parameter varies with the functor in a way that the type of the
parameter does not tell, so the functor and every type parameter in the object take both
polarities, which TypeScript accepts for every functor.
-/

public section

namespace Generator

open Falkara

/-- Tells whether a type of the theory is the type of a functor on types, such as
`Type u ⥤ Type u`. -/
def isFunctorType (type : Lean.Expr) : Bool :=
  -- The generator imports no Mathlib, so the names of Mathlib are written as names alone.
  type.isAppOfArity `CategoryTheory.Functor 4 && (type.getArg! 0).isSort && (type.getArg! 2).isSort

/-- Gives the number of type parameters of a declaration, the leading binders of its type over a
type or over a functor on types. -/
def typeParameterCount : Lean.Expr → Nat
  | .forallE _ domain body _ =>
    if domain.isSort || isFunctorType domain then typeParameterCount body + 1 else 0
  | _ => 0

/-- Runs a computation on the type parameters of a declaration, the leading binders of its type over
a type or over a functor on types, with the rest of its type and its value applied to the
parameters, where it has a value, and with every category that is a parameter, a binder over a type
followed by an instance of `CategoryTheory.Category` on it, taken as the category of types, the one
category of TypeScript, or fails with the reason where the category of types does not fit. -/
def parametersOf {m : Type → Type} [Monad m] [MonadControlT Lean.MetaM m]
    [MonadLiftT Lean.MetaM m] {α : Type} (information : Lean.ConstantInfo)
    (computation : Array Lean.Expr → Lean.Expr → Option Lean.Expr → m α) : m α := do
  -- The universes of the declaration stay open, so that the category of types fixes them.
  let levels ← monadLift (information.levelParams.mapM fun _ ↦ Lean.Meta.mkFreshLevelMVar :
    Lean.MetaM (List Lean.Level))
  loop information.type.getForallArity (information.instantiateTypeLevelParams levels)
    (information.value?.map (·.instantiateLevelParams information.levelParams levels)) #[]
where
  /-- Takes the leading binders of the type one at a time, a category and its instance together,
  with at most as many steps as the type has binders. -/
  loop (remaining : Nat) (type : Lean.Expr) (value : Option Lean.Expr)
      (parameters : Array Lean.Expr) : m α := do
    let finish : m α := do
      computation parameters (← monadLift (Lean.instantiateMVars type : Lean.MetaM Lean.Expr))
        (← monadLift (value.mapM fun value ↦ Lean.instantiateMVars value.headBeta :
          Lean.MetaM (Option Lean.Expr)))
    let remaining + 1 := remaining | finish
    let .forallE name domain body binderInfo := type | finish
    if let .forallE _ categoryClass rest .instImplicit := body then
      if domain.isSort && categoryClass.isAppOfArity `CategoryTheory.Category 1 &&
          categoryClass.appArg! == .bvar 0 then
        -- The category of types takes its instance of Mathlib, `CategoryTheory.types`, whose
        -- type the instance of the declaration unifies with.
        let (category, types) ← monadLift (do
          let level ← Lean.Meta.mkFreshLevelMVar
          let category := Lean.mkSort (.succ level)
          let types := Lean.mkConst `CategoryTheory.types [level]
          unless ← Lean.Meta.isDefEq (← Lean.Meta.inferType types)
              (categoryClass.instantiate1 category) do
            Lean.throwError m!"`{type}` takes a category that is not the category of types, the \
              one category of TypeScript."
          return (category, types) : Lean.MetaM (Lean.Expr × Lean.Expr))
        return ← loop remaining (rest.instantiateRev #[category, types])
          (value.map (Lean.mkApp2 · category types)) parameters
    if domain.isSort || isFunctorType domain then
      Lean.Meta.withLocalDecl name binderInfo domain fun parameter ↦
        loop remaining (body.instantiate1 parameter) (value.map (Lean.mkApp · parameter))
          (parameters.push parameter)
    else finish

/-- Gives the functor and the object of an object `F.obj X` of a functor `F` that is a parameter,
which no reduction resolves, where the type is one. -/
def parameterObjectOf (type : Lean.Expr) : Option (Lean.Expr × Lean.Expr) :=
  if type.isAppOfArity `CategoryTheory.Functor.obj 6 && (type.getArg! 4).isFVar then
    some (type.getArg! 4, type.getArg! 5)
  else none

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
as the function type `(value : X) → Y`, an object `F.obj X` of a functor `F` as the type it reduces
to, such as `X` for the identity functor, and an object of a functor that is a parameter as it
stands, with its object as TypeScript reads it. -/
partial def normalizedOf (type : Lean.Expr) : Lean.MetaM Lean.Expr := do
  match type with
  | .forallE name domain body info =>
    return .forallE name (← normalizedOf domain) (← normalizedOf body) info
  | _ =>
    if let some (_, object) := parameterObjectOf type then
      return Lean.mkAppN type.getAppFn (type.getAppArgs.set! 5 (← normalizedOf object))
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
  -- A parameter keeps its name as TypeScript writes it, such as `this['Target']` for the object of
  -- a type lambda, which a name of Lean would escape.
  | .fvar parameter => return (← parameter.getUserName).toString (escape := false)
  | .const ``Rat _ => effectNameOf "Rational" "Rational" .type
  | .const ``String _ => return "string"
  | .const ``Bool _ => return "boolean"
  | .app (.const ``Option _) element =>
    return s!"{← effectNameOf "Option" "Option" .type}<{← typeOf packageNamespace element}>"
  | .app (.const ``Array _) element =>
    return s!"ReadonlyArray<{← typeOf packageNamespace element}>"
  | .app (.const ``List _) element =>
    return s!"ReadonlyArray<{← typeOf packageNamespace element}>"
  | .app (.app (.const ``Prod _) first) second =>
    return s!"readonly [{← typeOf packageNamespace first}, {← typeOf packageNamespace second}]"
  | .const .. | .app .. =>
    if let some (functor, object) := parameterObjectOf type then
      return s!"{← effectNameOf "HKT" "Kind" .type}<{← typeOf packageNamespace functor}, never, \
        never, never, {← typeOf packageNamespace object}>"
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

/-- Gives a type parameter as TypeScript declares it, constrained to a type lambda of Effect,
`HKT.TypeLambda`, where the parameter is a functor on types, so that `HKT.Kind` applies it. -/
def genericOf (parameter : Lean.Expr) (declared : String) : TypeScriptM String := do
  if isFunctorType (← parameter.fvarId!.getType) then
    return s!"{declared} extends {← effectNameOf "HKT" "TypeLambda" .type}"
  return declared

/-- Runs a computation on the object of a functor on types at the object of a type lambda of
Effect, `this['Target']`, as `normalizedOf` reads the object, given the type of the functor. -/
def lambdaObjectOf {m : Type → Type} [Monad m] [MonadControlT Lean.MetaM m]
    [MonadLiftT Lean.MetaM m] {α : Type} (functor functorType : Lean.Expr)
    (computation : Lean.Expr → m α) : m α :=
  Lean.Meta.withLocalDeclD (.mkSimple "this['Target']") (functorType.getArg! 0) fun target ↦ do
    -- The object takes the categories and the universes of the type of the functor as they stand,
    -- as `CategoryTheory.Functor.obj` takes them in the order `CategoryTheory.Functor` does.
    let .const _ levels := functorType.getAppFn
      | monadLift (Lean.throwError m!"`{functorType}` is no type of a functor." : Lean.MetaM α)
    computation (← (normalizedOf (Lean.mkAppN (.const `CategoryTheory.Functor.obj levels)
      (functorType.getAppArgs ++ #[functor, target])) : Lean.MetaM Lean.Expr))

/-- Gives the type of the functors on types that a curried functor gives, a functor from types into
the functors on types, such as `Type u ⥤ Type u ⥤ Type u`, where the type is the type of one. -/
def curriedTargetOf? (type : Lean.Expr) : Option Lean.Expr :=
  if type.isAppOfArity `CategoryTheory.Functor 4 && (type.getArg! 0).isSort &&
      isFunctorType (type.getArg! 2) then some (type.getArg! 2)
  else none

/-- Runs a computation on the object of a curried functor at a type parameter, the functor on types
that the curried functor gives, with the parameter named as the definition of the curried functor
names its object, given the type of the curried functor, or fails with the reason where the
definition names no object. -/
def curriedObjectOf {m : Type → Type} [Monad m] [MonadControlT Lean.MetaM m]
    [MonadLiftT Lean.MetaM m] {α : Type} (functor functorType : Lean.Expr)
    (computation : Lean.Expr → Lean.Expr → m α) : m α := do
  let .const _ levels := functorType.getAppFn
    | monadLift (Lean.throwError m!"`{functorType}` is no type of a functor." : Lean.MetaM α)
  let object := Lean.mkAppN (.const `CategoryTheory.Functor.obj levels)
    (functorType.getAppArgs ++ #[functor])
  -- The definition gives the object as a function, whose binder names the object.
  let .lam name .. ← monadLift (Lean.Meta.whnfD object : Lean.MetaM Lean.Expr)
    | monadLift (Lean.throwError m!"`{functor}` has no type in TypeScript, as its definition \
        names no object." : Lean.MetaM α)
  Lean.Meta.withLocalDeclD name (functorType.getArg! 0) fun parameter ↦
    computation parameter (Lean.mkApp object parameter)

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
  /-- A functor on types, such as `Limits.Types.binaryProductFunctor.obj B`. -/
  | functor
  /-- A curried functor, a functor from types into the functors on types, such as
  `Limits.Types.binaryProductFunctor`. -/
  | curriedFunctor
  /-- A function, a declaration that takes parameters beyond its type parameters. -/
  | function
  /-- A value, a declaration that takes no parameters beyond its type parameters. -/
  | value

/-- Gives the kind of a declaration of the theory. -/
def kindOf (name : Lean.Name) : Lean.MetaM DeclarationKind := do
  if Lean.isStructure (← Lean.getEnv) name then
    return if ← isData name then .dataStructure else .structure
  if let some (base, condition) ← refinementOf name then return .refinement base condition
  parametersOf (← Lean.getConstInfo name) fun _ rest value ↦ do
      match rest with
      | .sort _ =>
        if let some value := value then
          if (← bundledOf value).isSome then return .bundled
        return .type
      | .forallE .. => return .function
      | _ =>
        if isFunctorType rest then return .functor
        return if (curriedTargetOf? rest).isSome then .curriedFunctor else .value

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
    -- An object of a functor that is a parameter varies with the functor in a way that TypeScript
    -- cannot see, so the functor and every parameter in the object occur at both polarities.
    if let some (functor, object) := parameterObjectOf type then
      return (if functor == parameter then [true, false] else []) ++
        (← polaritiesOf parameter positive object) ++ (← polaritiesOf parameter (!positive) object)
    let .const name _ := type.getAppFn | return []
    let variances ← if [``Option, ``Array, ``List].contains name then pure [[true]]
      else variancesOf name
    (type.getAppArgs.toList.zip variances).flatMapM fun (argument, polarities) ↦
      polarities.flatMapM fun polarity ↦ polaritiesOf parameter (positive == polarity) argument

/-- Gives the polarities at which every type parameter of a declaration occurs in the fields of the
declaration where it is a structure, in the fields of the bundled structure that its value applies
where its value is one, in the object of its type lambda where it is a functor, and in its value
otherwise. -/
partial def variancesOf (name : Lean.Name) : Lean.MetaM (List (List Bool)) := do
  parametersOf (← Lean.getConstInfo name) fun parameters rest value ↦ do
    let polaritiesIn := fun (types : List Lean.Expr) ↦
      parameters.toList.mapM fun parameter ↦ types.flatMapM (polaritiesOf parameter true)
    if Lean.isStructure (← Lean.getEnv) name then
      return ← polaritiesIn ((← fieldTypesOf name parameters).map Prod.snd)
    let some value := value | polaritiesIn []
    if isFunctorType rest then
      return ← lambdaObjectOf value rest fun object ↦ polaritiesIn [object]
    -- The fields of a bundled structure name its type parameters, which exist only while the
    -- fields are read, so the polarities are taken there.
    if (← bundledOf value).isSome then
      bundledFieldsOf value fun _ fields ↦ polaritiesIn (fields.map Prod.snd)
    else polaritiesIn [value]

end

end Generator
