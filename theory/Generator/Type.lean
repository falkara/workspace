/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.ExportTypeScript
public import Generator.Import
public import Lean.Meta.AppBuilder
public import Lean.Meta.WHNF

import Generator.Name

/-!
# Type

The module defines the type of TypeScript that a type of the theory takes: `Rational.Rational`
for a rational number, `string` for a string, `boolean` for a boolean, `Option.Option` for an
option, `ReadonlyArray` for an array or a list, a read-only tuple `readonly [X, Y]` for a product
`X × Y`, a record for an object of a functor that is a structure whose fields the declaration of
the functor names, such as `{ readonly output: Output; readonly next: State }` for the product that
the functor of binary products gives, a function type for a function type of the theory, a
generic function type for a function type whose leading parameters are implicit types,
`HKT.Kind<F, never, never, never, X>`
for an object `F.obj X` of a functor `F` that is a parameter, the name of a type parameter for the
parameter, and the name of a declaration that the theory gives a counterpart in TypeScript, for the
type that the declaration defines, with its arguments where it takes type parameters, such as
`MachineOutcome<State, Output>`. The module defines as well the schema of Effect that a type of
data takes: `Schema.Rational` for a rational number, `Schema.String` for a string,
`Schema.Boolean` for a boolean, `Schema.Option` for an option, `Schema.Array` for an array or a
list, the name of a structure that the theory gives a counterpart in TypeScript, for the schema
that the structure defines, where every field of the structure takes a schema and the structure
takes no type parameters, and the name of a refinement that the theory gives a counterpart in
TypeScript, for the schema that the refinement defines. A refinement is a subtype of a type by a
condition that the theory gives a counterpart in TypeScript and that gives a boolean, such as
`{ name : String // isSegment name = true }`. Every other type has no type of TypeScript, a
function type and a type parameter have no schema, and the generator refuses both. The module
defines as well the variance of every type parameter of a declaration, the polarities at which the
parameter occurs in the fields or the value of the declaration.

## Main Definitions

- `isFunctorType`: tells whether a type of the theory is the type of a functor on types, such as
  `Type u ⥤ Type u`.
- `isTypeConstructorType`: tells whether a type of the theory is the type of a type constructor, a
  function from types to types, such as `Type u → Type u` of a monad.
- `isParameterType`: tells whether a binder of the theory is a type parameter in TypeScript, a
  binder over a type, over a functor on types, or over a type constructor.
- `typeParameterCount`: gives the number of type parameters of a declaration, the leading binders
  of its type over a type, over a functor on types, or over a type constructor.
- `parametersOf`: runs a computation on the type parameters of a declaration, with the rest of its
  type and its value applied to the parameters, with every category that is a parameter taken as
  the category of types, the one category of TypeScript, and with every instance of a class on a
  parameter, such as `Monad m`, left out of the parameters.
- `identityLabelOf?`: gives the declaration that labels the identity functor of Mathlib, the functor
  of the identity monad `Id`, where the theory gives one a counterpart in TypeScript.
- `binderNameOf`: gives the name of a binder that a telescope opens as a free variable.
- `defaultOf?`: gives the default value of a type parameter, such as `Id` for
  `(m : Type u → Type u := Id)`, where the parameter takes one.
- `parameterObjectOf`: gives the functor and the object of an object `F.obj X` of a functor `F`
  that is a parameter, which no reduction resolves, or of an application `m X` of a type
  constructor `m` that is a parameter, where the type is one.
- `refinementOf`: gives the type and the condition of a refinement, a type of the theory whose
  value is a subtype `{ value : T // condition value = true }` of a type `T` by a function
  `condition` that the theory gives a counterpart in TypeScript, where the declaration is one.
- `fieldNameOf`: gives the name that a field of a structure takes in TypeScript, as the attribute
  `counterpart` names it or else as the structure names it.
- `fieldTypesOf`: gives the type of every field of a structure, with the type parameters given in
  place of those of the structure, or fails with the reason where the type of a field depends on
  the structure.
- `normalizedOf`: gives a type of the theory as TypeScript reads it: a morphism `X ⟶ Y` of the
  category of types as the function type `(value : X) → Y`, an object `F.obj X` of a functor `F`
  and a type taken out of the opposite of the types as the type it reduces to, such as `X` for the
  identity functor, and an object of a functor that is a parameter as it stands, with its object as
  TypeScript reads it.
- `bundledOf`: gives the structure that a type of the theory applies, where the type is a bundled
  structure, one with a field whose value is a type, such as `Endofunctor.Coalgebra (𝟭 (Type u))`
  with its state space `V`.
- `bundledFieldsOf`: runs a computation on the fields of a bundled structure that a type of the
  theory applies, with a type parameter in place of every field whose value is a type, named as the
  attribute `counterpart` names it or else as the field, and the type of every other field, with
  every such type parameter in place of the projection of its field, as `normalizedOf` reads it, or
  fails with the reason where the type of a field depends on another field.
- `unbundledOf`: runs a computation on a function type of the theory whose parameters include
  bundled structures, with a type parameter in place of every field whose value is a type, named
  after its parameter as well where several parameters bundle types, such as `FirstState`, and with
  a result that is a bundled structure applied to the types that the definition gives its fields.
- `moduleOf`: gives the module of the theory that declares a declaration.
- `typeNameOf`, `valueNameOf`, `constructorNameOf`, `axiomsNameOf`: give the name that a declaration
  of the theory takes in TypeScript as a type, as a value, as the constructor of a structure, and as
  the axioms of a class of functors, after the name of its module, such as `make` for the
  constructor of `StreamCoalgebra` in the module `StreamCoalgebra`.
- `displayNameOf`: gives the name of a declaration of the theory as a comment names it, such as
  `Functor.Comp` for `Functor.comp`.
- `referenceOf`: gives the name under which a file of TypeScript refers to a declaration of the
  theory, after the namespace of its module where the declaration lies in another module, such as
  `Functor.Functor` in the module `ExponentFunctor`.
- `typeOf`: gives the type of TypeScript that a type of the theory takes, with every declaration
  named without the namespace of its package and the value of a morphism named after its type where
  its type is a type parameter, or fails with the reason where the type has none.
- `argumentsOf`: gives the type arguments of TypeScript that an application of a declaration takes,
  without the instances of classes, every argument without a default value first, then the
  arguments past the binders of the declaration, and then the arguments with a default value up to
  the last one that differs from its default.
- `typeConstructorOf`: gives the type lambda of Effect that a type constructor of the theory takes,
  a parameter by its name, the identity monad `Id` as the type lambda of the identity functor, the
  options as `Option.OptionTypeLambda`, and a type constructor that the theory gives a counterpart
  in TypeScript by its name.
- `genericFunctionOf`: gives the generic function type of TypeScript that a function type of the
  theory takes whose leading parameters are implicit types, with the type parameters already
  written before the rest of the type.
- `signatureOf`: gives the parameters and the result of TypeScript that a function type of the
  theory takes, with the parameters already written before the rest of the type.
- `isDataType`: tells whether a type of the theory is a type of data: a rational number, a string, a
  boolean, an option, an array, or a list of data, a structure of data that the theory gives a
  counterpart in TypeScript, or a refinement that the theory gives a counterpart in TypeScript.
- `isData`: tells whether a structure is a structure of data, one without type parameters whose
  every field takes a type of data.
- `annotationOf`: gives a type parameter as TypeScript annotates it with its variance, `in` where it
  occurs negatively, `out` where it occurs positively, both where it occurs at both polarities, and
  neither where it does not occur.
- `genericOf`: gives a type parameter as TypeScript declares it, constrained to a type lambda of
  Effect, `HKT.TypeLambda`, where the parameter is a functor on types or a type constructor, so that
  `HKT.Kind` applies it, and with its default value where it takes one.
- `orderedOf`: gives the type parameters of a declaration in the order TypeScript takes them, every
  parameter with a default value after every other one.
- `lambdaObjectOf`: runs a computation on the object of a functor on types at the object of a type
  lambda of Effect, `this['Target']`, as `normalizedOf` reads the object, given the type of the
  functor.
- `curriedTargetOf?`: gives the type of the functors on types that a curried functor gives, a
  functor from types or from their opposite into the functors on types, such as
  `Type u ⥤ Type u ⥤ Type u`, where the type is the type of one.
- `curriedObjectOf`: runs a computation on the object of a curried functor at a type parameter, the
  functor on types that the curried functor gives, with the parameter named as the attribute
  `counterpart` of the declaration names it or else as the definition of the curried functor names
  its object, and taken by `Opposite.op` where the curried functor maps the opposite of the types,
  given the type of the curried functor.
- `functorFieldsOf`: runs a computation on the fields of the type of the functors on types, with a
  local functor in place of the action of the functor on types, named as the attribute
  `counterpart` names the field `obj` or else as the field, the type of every other field that is
  no proof, and the statement of every field that is an axiom, given the type of the functors.
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
parameter of a function type, and a parameter that the source leaves unnamed, such as the parameter
of `Rat → Rat` or the morphism of `CategoryTheory.Functor.map`, takes the name that Lean gives it,
`a`, as a declaration of Mathlib names no such parameter that the theory could name instead. Leading
implicit parameters over types, such as `{X Y : Type u}`, take the type parameters of a generic
function type.

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
the declaration of the theory binds no such parameter of its own. A curried functor from the
opposite of the types, such as `CategoryTheory.coyoneda`, takes the same type lambda, as an object
of the opposite of the types is a type that `Opposite.op` wraps, which TypeScript has no counterpart
for.

An object of a functor reduces until it is an object of a functor that is a parameter, such as
`G.obj (F.obj X)` of a composite `F ⋙ G`, as a further step takes the object apart into the
fields of the functor, which TypeScript has no type for.

The type of the functors on types, such as `CategoryTheory.Functor (Type u) (Type u)`, takes a type
class of Effect, `HKT.TypeClass`, whose type lambda stands for the action of a functor on types,
which TypeScript writes as a type and never as a value. The other fields that are no axioms, such
as the action on morphisms, take the fields of the type class, and the axioms, such as `map_id`,
take no field, as a value of TypeScript carries no proof, but a predicate that tells of an instance
whether it keeps the axiom.

A category that is a parameter, such as the category of `CategoryTheory.Endofunctor.Coalgebra`,
takes the category of types, as TypeScript has no category but its types and its functions, so the
theory names a declaration of Mathlib as it stands and the translation to TypeScript fixes the
category. The category takes the instance of Mathlib for the types, `CategoryTheory.types`, by
unification, so Lean checks that the category of types fits and fixes the universes of the
declaration.

An object of a functor that is a parameter, such as `F.obj X`, varies with the functor as a natural
transformation maps it, `α.app X : F.obj X ⟶ G.obj X`, in the direction of the morphism, so the
functor takes the polarity of the object, as
`CategoryTheory.Endofunctor.Coalgebra.functorOfNatTrans` maps a coalgebra of `F` to a coalgebra of
`G`. The object varies with the type `X` in the direction of the morphism as well,
`F.map f : F.obj X ⟶ F.obj Y`, but TypeScript sees no variance of a type lambda that is a parameter
and refuses every annotation but both, so every type parameter in the object takes both
polarities, such as the functor `F` in the object `G.obj (F.obj X)` of a composite.
-/

public section

namespace Generator

open Falkara

/-- Tells whether a type of the theory is the type of a functor on types, such as
`Type u ⥤ Type u`. -/
def isFunctorType (type : Lean.Expr) : Bool :=
  -- The generator imports no Mathlib, so the names of Mathlib are written as names alone.
  type.isAppOfArity `CategoryTheory.Functor 4 && (type.getArg! 0).isSort && (type.getArg! 2).isSort

/-- Tells whether a type of the theory is the type of a type constructor, a function from types to
types, such as `Type u → Type u` of a monad. -/
def isTypeConstructorType (type : Lean.Expr) : Bool :=
  match type.cleanupAnnotations with
  | .forallE _ (.sort _) (.sort _) _ => true
  | _ => false

/-- Tells whether a binder of the theory is a type parameter in TypeScript: a binder over a type,
over a functor on types, or over a type constructor, with or without a default value. -/
def isParameterType (type : Lean.Expr) : Bool :=
  let type := type.cleanupAnnotations
  type.isSort || isFunctorType type || isTypeConstructorType type

/-- Gives the number of type parameters of a declaration, the leading binders of its type over a
type, over a functor on types, or over a type constructor. -/
def typeParameterCount : Lean.Expr → Nat
  | .forallE _ domain body _ =>
    if isParameterType domain then typeParameterCount body + 1 else 0
  | _ => 0

/-- Runs a computation on the type parameters of a declaration, the leading binders of its type over
a type or over a functor on types, named as the attribute `counterpart` names them or else as
their binders, with the rest of its type and its value applied to the parameters, where it has a
value, and with every category that is a parameter, a binder over a type followed by an instance of
`CategoryTheory.Category` on it, taken as the category of types, the one category of TypeScript, or
fails with the reason where the category of types does not fit. -/
def parametersOf {m : Type → Type} [Monad m] [MonadControlT Lean.MetaM m]
    [MonadLiftT Lean.MetaM m] {α : Type} (information : Lean.ConstantInfo)
    (computation : Array Lean.Expr → Lean.Expr → Option Lean.Expr → m α) : m α := do
  -- The universes of the declaration stay open, so that the category of types fixes them.
  let levels ← monadLift (information.levelParams.mapM fun _ ↦ Lean.Meta.mkFreshLevelMVar :
    Lean.MetaM (List Lean.Level))
  loop information.name information.type.getForallArity
    (information.instantiateTypeLevelParams levels)
    (information.value?.map (·.instantiateLevelParams information.levelParams levels)) #[]
where
  /-- Takes the leading binders of the type one at a time, a category and its instance together,
  with at most as many steps as the type has binders. -/
  loop (declaration : Lean.Name) (remaining : Nat) (type : Lean.Expr) (value : Option Lean.Expr)
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
        return ← loop declaration remaining (rest.instantiateRev #[category, types])
          (value.map (Lean.mkApp2 · category types)) parameters
    -- An instance of a class on a type parameter, such as `Monad m`, constrains the parameter and
    -- is no parameter of its own, as TypeScript takes the class by its instances.
    if binderInfo == .instImplicit &&
        parameters.any fun parameter ↦ parameter.occurs domain then
      return ← Lean.Meta.withLocalDecl name binderInfo domain fun constraint ↦
        loop declaration remaining (body.instantiate1 constraint)
          (value.map (Lean.mkApp · constraint)) parameters
    -- A type constructor that the value gives without binding its argument, such as
    -- `ReaderT R (Except E)`, is the value itself, whose argument is no parameter.
    if domain.isSort && isTypeConstructorType type &&
        value.any fun value ↦ !value.headBeta.isLambda then
      return ← finish
    if isParameterType domain then
      let environment ← monadLift (Lean.getEnv : Lean.MetaM Lean.Environment)
      let parameterName := match ExportTypeScript.nameOf? environment declaration name with
        | some parameterName => .mkSimple parameterName
        | none => name
      -- The parameter keeps the default value that its type annotates, which TypeScript gives the
      -- parameter as well.
      Lean.Meta.withLocalDecl parameterName binderInfo domain fun parameter ↦
        loop declaration remaining (body.instantiate1 parameter)
          (value.map (Lean.mkApp · parameter)) (parameters.push parameter)
    else finish

/-- Gives the declaration that labels the identity functor of Mathlib, `CategoryTheory.Functor.id`,
the functor of the identity monad `Id`, where the theory gives one a counterpart in TypeScript. -/
def identityLabelOf? (environment : Lean.Environment) : Option Lean.Name :=
  (ExportTypeScript.exportsOf environment).findSome? fun declared ↦
    if ExportTypeScript.labels environment declared.declaration `CategoryTheory.Functor.id then
      some declared.declaration
    else none

/-- Gives the name of a binder that a telescope opens as a free variable, or fails where the
expression is no free variable. -/
def binderNameOf (binder : Lean.Expr) : Lean.MetaM String := do
  let .fvar binderId := binder | Lean.throwError m!"`{binder}` is no binder."
  return (← binderId.getUserName).toString

/-- Gives the default value of a type parameter, which the type of its binder annotates, such as
`Id` for `(m : Type u → Type u := Id)`, where the parameter takes one. -/
def defaultOf? (parameter : Lean.Expr) : Lean.MetaM (Option Lean.Expr) := do
  return (← Lean.Meta.inferType parameter).getOptParamDefault?

/-- Gives the functor and the object of an object `F.obj X` of a functor `F` that is a parameter,
which no reduction resolves, or of an application `m X` of a type constructor `m` that is a
parameter, where the type is one. -/
def parameterObjectOf (type : Lean.Expr) : Lean.MetaM (Option (Lean.Expr × Lean.Expr)) := do
  if type.isAppOfArity `CategoryTheory.Functor.obj 6 && (type.getArg! 4).isFVar then
    return some (type.getArg! 4, type.getArg! 5)
  -- A parameter applied to a type is an object only where the parameter is a type constructor, as
  -- a function that a binder holds applies to values.
  if let .app (.fvar constructor) object := type then
    if isTypeConstructorType (← constructor.getType) then return some (.fvar constructor, object)
  return none

/-- Gives the type and the condition of a refinement, a type of the theory whose value is a subtype
`{ value : T // condition value = true }` of a type `T` by a function `condition` that the theory
gives a counterpart in TypeScript, where the declaration is one. -/
def refinementOf (name : Lean.Name) : Lean.MetaM (Option (Lean.Expr × Lean.Name)) := do
  let some value := (← Lean.getConstInfo name).value? | return none
  let .app (.app (.const ``Subtype _) base) (.lam _ _ body _) := value | return none
  let .app (.app (.app (.const ``Eq _) (.const ``Bool _)) (.app (.const condition _) (.bvar 0)))
      (.const ``Bool.true _) := body
    | return none
  unless ExportTypeScript.isExported (← Lean.getEnv) condition do return none
  return some (base, condition)

/-- Gives the name that a field of a structure takes in TypeScript, as the clause of the attribute
`counterpart` on the declaration that labels the structure names it or else as the structure names
it. -/
def fieldNameOf {m : Type → Type} [Monad m] [Lean.MonadEnv m] (structureName field : Lean.Name) :
    m String := do
  return ((ExportTypeScript.fieldClauseOf? (← Lean.getEnv) structureName field).map (·.name)).getD
    field.toString

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

/-- Gives the declaration that the theory gives a counterpart in TypeScript of the functor whose
object a type is, through the functors that a curried functor gives, such as `binaryProductFunctor`
for `(binaryProductFunctor.obj B).obj X`, or for the functor of Mathlib that the declaration labels,
where the theory gives one a counterpart in TypeScript. -/
partial def functorDeclarationOf? (environment : Lean.Environment) (type : Lean.Expr) :
    Option Lean.Name :=
  match type.getAppFn with
  | .const `Prefunctor.obj _ | .const `CategoryTheory.Functor.obj _
  | .const `CategoryTheory.Functor.toPrefunctor _ =>
    functorDeclarationOf? environment (type.getArg! 4)
  | .const name _ => (ExportTypeScript.exportsOf environment).findSome? fun declared ↦
    if ExportTypeScript.labels environment declared.declaration name then
      some declared.declaration
    else none
  | _ => none

/-- Gives a type of the theory as TypeScript reads it: a morphism `X ⟶ Y` of the category of types
as the function type `(value : X) → Y`, an object `F.obj X` of a functor `F` and a type taken out of
the opposite of the types as the type it reduces to, such as `X` for the identity functor, an
object of a functor that is a parameter as it stands, with its object as TypeScript reads it, and
an object that is a structure whose fields the declaration of its functor names, such as the
product that the functor of binary products gives, with the declaration in the metadata
`typescriptRecord`. -/
partial def normalizedOf (type : Lean.Expr) : Lean.MetaM Lean.Expr := do
  match type with
  | .forallE name domain body info =>
    return .forallE name (← normalizedOf domain) (← normalizedOf body) info
  | _ =>
    if let some (_, object) ← parameterObjectOf type then
      return Lean.mkAppN type.getAppFn (type.getAppArgs.pop.push (← normalizedOf object))
    match type.getAppFn, type.getAppArgs with
    -- The generator imports no Mathlib, so the names of Mathlib are written as names alone.
    | .const `Quiver.Hom _, #[.sort _, _, source, target]
    | .const `TypeCat.Hom _, #[source, target] =>
      -- The function binds its value, so the target refers to every outer binder one index further,
      -- and the annotation keeps the morphism a value of its own, which no signature takes apart.
      return Lean.mkAnnotation `morphism (.forallE `value (← normalizedOf source)
        ((← normalizedOf target).liftLooseBVars 0 1) .default)
    | .const `Prefunctor.obj _, _ | .const `CategoryTheory.Functor.obj _, _
    | .const `Opposite.unop _, _ =>
      -- The reduction stops at an object of a functor that is a parameter, such as `G.obj X` of a
      -- composite, which a further step would take apart into the fields of the functor.
      -- The reduction stops as well at an object of another functor that the theory gives a
      -- counterpart in TypeScript, which the next step reduces on its own, so that every such
      -- object meets the declaration of its functor, such as the product of a composite.
      let environment ← Lean.getEnv
      let reduced ← Lean.Meta.whnfHeadPred type fun part ↦
        return (← parameterObjectOf part).isNone &&
          (part == type || (functorDeclarationOf? environment part).isNone)
      if reduced == type then return type
      let normalized ← normalizedOf reduced
      -- An object that is a structure whose fields the declaration of its functor names keeps the
      -- declaration, which the reduction takes away.
      if let (some declaration, .const structureName _) :=
          (functorDeclarationOf? environment type, normalized.getAppFn) then
        if Lean.isStructure environment structureName &&
            (Lean.getStructureFields environment structureName).any fun field ↦
              (ExportTypeScript.nameOf? environment declaration field).isSome then
          return Lean.mkMData (Lean.KVMap.empty.insert `typescriptRecord (.ofName declaration))
            normalized
      return normalized
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
a type parameter in place of every field whose value is a type, named as the attribute
`counterpart` names it or else as the field, and the type of every other field, with every such
type parameter in place of the projection of its field, as `normalizedOf` reads it, or fails with
the reason where the type of a field depends on another field. -/
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
        -- The type parameter takes the name that the theory gives it, or else that of its field.
        let name := Lean.Name.mkSimple (← (fieldNameOf structureName field : Lean.MetaM String))
        Lean.Meta.withLocalDeclD name fieldType fun parameter ↦
          loop structureName self rest (parameters ++ [parameter]) others
            ((projection, parameter) :: replacements)
      else
        let replaced := fieldType.replace fun part ↦
          (replacements.find? fun (projected, _) ↦ projected == part).map Prod.snd
        if self.occurs replaced then
          monadLift (Lean.throwError m!"`{structureName ++ field}` has no field in TypeScript, as \
            its type depends on a field whose value is no type." : Lean.MetaM α)
        else
          loop structureName self rest parameters (others ++ [(field, ← normalizedOf replaced)])
            replacements

/-- Runs a computation on a function type of the theory whose parameters include bundled
structures, with a type parameter in place of every field whose value is a type of every such
parameter, named as the attribute `counterpart` names the field, and the function type with the
type of every such parameter applied to its type parameters, as TypeScript writes it, and every
projection of such a field replaced by its type parameter, such as
`(coalgebra : StreamCoalgebra Output) → (state : State) → Stream' Output` with the type parameter
`State` for `(coalgebra : StreamCoalgebra Output) → (state : coalgebra.V) → Stream' Output`. -/
def unbundledOf {m : Type → Type} [Monad m] [MonadControlT Lean.MetaM m]
    [MonadLiftT Lean.MetaM m] {α : Type} (type : Lean.Expr) (value : Option Lean.Expr)
    (computation : List Lean.Expr → Lean.Expr → m α) : m α :=
  Lean.Meta.forallTelescope type fun binders body ↦ do
    let bundled ← monadLift (binders.toList.filterMapM fun binder ↦ do
      -- A kind of system names the structure through its abbreviation, which the check unfolds.
      let some structureName ← bundledOf (← Lean.Meta.whnfR (← Lean.Meta.inferType binder))
        | return none
      let fields ← (Lean.getStructureFields (← Lean.getEnv) structureName).toList.filterM
        fun field ↦ do
          return (← Lean.Meta.whnfR (← Lean.Meta.inferType
            (← Lean.Meta.mkProjection binder field))).isSort
      return some (binder, structureName, fields) :
        Lean.MetaM (List (Lean.Expr × Lean.Name × List Lean.Name)))
    withFields binders body (bundled.length > 1) (bundled.flatMap
      fun (binder, structureName, fields) ↦ fields.map fun field ↦ (binder, structureName, field))
      []
where
  /-- Takes the fields whose values are types one at a time, each with a type parameter, named
  after its binder as well where several parameters bundle types, such as `FirstState` and
  `SecondState`, and then rebuilds the function type with the type parameters in place of their
  projections, and with the result applied to the types that its definition gives its fields whose
  values are types, where the result is a bundled structure, such as `[FirstState, SecondState]` for
  two machines in series. -/
  withFields (binders : Array Lean.Expr) (body : Lean.Expr) (several : Bool) :
      List (Lean.Expr × Lean.Name × Lean.Name) → List (Lean.Expr × Lean.Name × Lean.Expr) → m α
    | [], parameters => do
      let environment ← monadLift (Lean.getEnv : Lean.MetaM Lean.Environment)
      -- A projection takes the form of an application of its function or, once reduced, of a
      -- projection by index.
      let replaced := fun (expression : Lean.Expr) ↦ expression.replace fun part ↦
        parameters.findSome? fun (binder, projection, parameter) ↦
          match part with
          | .proj structureName index projected =>
            if projected == binder &&
                (Lean.getStructureFields environment structureName)[index]?.map
                  (structureName ++ ·) == some projection then some parameter
            else none
          | _ =>
            if part.isAppOf projection && part.getAppArgs.back? == some binder then some parameter
            else none
      -- A result that is a bundled structure takes the types that the definition gives its fields
      -- whose values are types, such as the state space of a machine it maps.
      -- The field is taken out of the structure that the definition builds and reduced no
      -- further, so that a type the definition names, such as a board, keeps its name.
      let carriers ← monadLift (do
        let some value := value | return #[]
        let some structureName ← bundledOf (← Lean.Meta.whnfR body) | return #[]
        let result := Lean.mkAppN value binders
        let fields := Lean.getStructureFields (← Lean.getEnv) structureName
        (fields.zipIdx).filterMapM fun (field, index) ↦ do
          let projection ← Lean.Meta.mkProjection result field
          unless (← Lean.Meta.whnfR (← Lean.Meta.inferType projection)).isSort do return none
          return some (← Lean.Meta.whnfCore (.proj structureName index result.headBeta)) :
          Lean.MetaM (Array Lean.Expr))
      let rebuilt ← monadLift (binders.foldrM
        (init := Lean.mkAppN (replaced body) (carriers.map replaced)) fun binder rest ↦ do
          let .fvar binderId := binder | Lean.throwError m!"`{binder}` is no binder."
          let declaration ← binderId.getDecl
          let applied := (parameters.filter (·.1 == binder)).map (·.2.2)
          return .forallE declaration.userName
            (Lean.mkAppN (replaced declaration.type) applied.toArray) (rest.abstract #[binder])
            declaration.binderInfo : Lean.MetaM Lean.Expr)
      computation (parameters.map (·.2.2)) rebuilt
    | (binder, structureName, field) :: rest, parameters => do
      let fieldName ← monadLift (fieldNameOf structureName field : Lean.MetaM String)
      let binderName ← monadLift (binderNameOf binder)
      let name := Lean.Name.mkSimple
        (if several then s!"{binderName.capitalize}{fieldName}" else fieldName)
      let fieldType ← monadLift (do
        Lean.Meta.inferType (← Lean.Meta.mkProjection binder field) : Lean.MetaM Lean.Expr)
      Lean.Meta.withLocalDeclD name fieldType fun parameter ↦
        withFields binders body several rest
          (parameters ++ [(binder, structureName ++ field, parameter)])

/-- Gives the module of the theory that declares a declaration, or the module being written where
the declaration lies in no imported module. -/
def moduleOf (name : Lean.Name) : Lean.MetaM Lean.Name := do
  let environment ← Lean.getEnv
  return ((environment.getModuleIdxFor? name).bind fun index ↦
    environment.header.moduleNames[index.toNat]?).getD environment.mainModule

/-- Gives the name that a declaration of the theory takes in TypeScript as a type, in Pascal case
after the name of its module, such as `Comp` for `Functor.comp` in the module `Functor`, or the name
of the module where the declaration takes it, such as `StreamCoalgebra`. -/
def typeNameOf (packageNamespace name : Lean.Name) : Lean.MetaM String := do
  return match localWordsOf packageNamespace (← moduleOf name) name with
    | [] => pascalCaseOf (wordsOf packageNamespace name)
    | words => pascalCaseOf words

/-- Gives the name that a declaration of the theory takes in TypeScript as a value or a function, in
camel case after the name of its module, such as `behavior` for `StreamCoalgebra.behavior` in the
module `StreamCoalgebra`. -/
def valueNameOf (packageNamespace name : Lean.Name) : Lean.MetaM String := do
  return match localWordsOf packageNamespace (← moduleOf name) name with
    | [] => camelCaseOf (wordsOf packageNamespace name)
    | words => camelCaseOf words

/-- Gives the name of the constructor of a structure in TypeScript: `make` for the structure that
takes the name of its module, as Effect names a constructor, and its name in camel case
otherwise. -/
def constructorNameOf (packageNamespace structureName : Lean.Name) : Lean.MetaM String := do
  return match localWordsOf packageNamespace (← moduleOf structureName) structureName with
    | [] => "make"
    | words => camelCaseOf words

/-- Gives the name of the axioms of a class of functors in TypeScript: `axioms` for the class that
takes the name of its module, and its name in camel case followed by `Axioms` otherwise. -/
def axiomsNameOf (packageNamespace className : Lean.Name) : Lean.MetaM String := do
  return match localWordsOf packageNamespace (← moduleOf className) className with
    | [] => "axioms"
    | words => s!"{camelCaseOf words}Axioms"

/-- Gives the name of a declaration of the theory as a comment names it, after the name of its
module where the name drops it, such as `Functor.Comp` for `Functor.comp`. -/
def displayNameOf (packageNamespace name : Lean.Name) : Lean.MetaM String := do
  let module ← moduleOf name
  match localWordsOf packageNamespace module name, module with
  | [], _ => return pascalCaseOf (wordsOf packageNamespace name)
  | words, .str _ last =>
    return if words == wordsOf packageNamespace name then pascalCaseOf words
      else s!"{last}.{pascalCaseOf words}"
  | words, _ => return pascalCaseOf words

/-- Gives the name under which a file of TypeScript refers to a name of a declaration of the
theory: the name alone where the declaration lies in the module being written, and the name after
the namespace of its module otherwise, as a file imports every other module as a namespace, such as
`Functor.Comp`. -/
def referenceOf (name : Lean.Name) (written : String) : Lean.MetaM String := do
  let module ← moduleOf name
  if module == (← Lean.getEnv).mainModule then return written
  let .str _ last := module | return written
  return s!"{last}.{written}"

mutual

/-- Gives the type of TypeScript that a type of the theory takes, with every declaration named
without the namespace of its package and the value of a morphism named after its type where its
type is a type parameter, such as `state` for `State`, or fails with the reason where the type has
none. -/
partial def typeOf (packageNamespace : Lean.Name) (type : Lean.Expr) : TypeScriptM String := do
  match type with
  | .forallE _ (.sort _) _ .implicit => genericFunctionOf packageNamespace [] type
  | .forallE .. =>
    let (parameters, result) ← signatureOf packageNamespace [] type
    return s!"({", ".intercalate parameters}) => {result}"
  -- A parameter keeps its name as TypeScript writes it, such as `this['Target']` for the object of
  -- a type lambda, which a name of Lean would escape.
  | .fvar parameter => return (← parameter.getUserName).toString (escape := false)
  | .mdata data inner =>
    -- An object that is a structure whose fields the declaration of its functor names takes a
    -- record with a field of every field of the structure, named as the declaration names it, such
    -- as `{ readonly output: Output; readonly next: State }` for a product.
    if let (some (.ofName declaration), .const structureName _) :=
        (data.find `typescriptRecord, inner.getAppFn) then
      let environment ← Lean.getEnv
      let fields ← (← fieldTypesOf structureName inner.getAppArgs).mapM fun (field, fieldType) ↦ do
        let name := (ExportTypeScript.nameOf? environment declaration field).getD field.toString
        return s!"readonly {name}: {← typeOf packageNamespace fieldType}"
      return s!"\{ {"; ".intercalate fields} }"
    -- A stream of a function that takes a stream carries the failure `E` and the requirements `R`
    -- of the streams the function takes, as `Stream.map` of Effect carries them.
    if let some (.app (.const name _) element) := Lean.annotation? `channels type then
      if name == `Stream' || name == `Stream'.Seq then
        return s!"{← effectNameOf "Stream" "Stream" .type}\
          <{← typeOf packageNamespace element}, E, R>"
    -- The value of a morphism takes the name of its type where its type is a type parameter whose
    -- name TypeScript writes as it stands, and keeps the name `value` otherwise.
    if let (some _, .forallE _ (.fvar parameter) body info) :=
        (Lean.annotation? `morphism type, inner) then
      let parameterName := (← parameter.getUserName).toString
      if parameterName.all Char.isAlphanum then
        return ← typeOf packageNamespace
          (.forallE (.mkSimple parameterName.decapitalize) (.fvar parameter) body info)
    typeOf packageNamespace inner
  | .const ``Rat _ => effectNameOf "Rational" "Rational" .type
  -- An infinite stream and a sequence of Mathlib are a stream of Effect, which pulls its elements
  -- as it needs them and ends where the sequence does.
  | .app (.const `Stream' _) element | .app (.const `Stream'.Seq _) element =>
    return s!"{← effectNameOf "Stream" "Stream" .type}<{← typeOf packageNamespace element}>"
  | .const ``String _ => return "string"
  | .const ``Bool _ => return "boolean"
  -- The type of one value is the type of no value in TypeScript, as a function that takes it takes
  -- nothing of interest.
  | .const ``PUnit _ => return "void"
  | .app (.const ``Option _) element =>
    return s!"{← effectNameOf "Option" "Option" .type}<{← typeOf packageNamespace element}>"
  | .app (.const ``Array _) element =>
    return s!"ReadonlyArray<{← typeOf packageNamespace element}>"
  | .app (.const ``List _) element =>
    return s!"ReadonlyArray<{← typeOf packageNamespace element}>"
  | .app (.app (.const ``Prod _) first) second =>
    return s!"readonly [{← typeOf packageNamespace first}, {← typeOf packageNamespace second}]"
  -- A binary coproduct is a result of Effect, which succeeds with a value of the second summand,
  -- the one a computation goes on with, and fails with a value of the first.
  | .app (.app (.const ``Sum _) first) second =>
    return s!"{← effectNameOf "Result" "Result" .type}<{← typeOf packageNamespace second}, \
      {← typeOf packageNamespace first}>"
  -- A computation that reads requirements and either fails or succeeds is an effect of Effect,
  -- which takes the value, the failure, and the requirements in that order.
  | .app (.app (.app (.const ``ReaderT _) requirements) (.app (.const ``Except _) failure))
      success =>
    return s!"{← effectNameOf "Effect" "Effect" .type}<{← typeOf packageNamespace success}, \
      {← typeOf packageNamespace failure}, {← typeOf packageNamespace requirements}>"
  | .const .. | .app .. =>
    if let some (functor, object) ← parameterObjectOf type then
      return s!"{← effectNameOf "HKT" "Kind" .type}<{← typeOf packageNamespace functor}, never, \
        never, never, {← typeOf packageNamespace object}>"
    let .const name _ := type.getAppFn | Lean.throwError m!"`{type}` has no type in TypeScript."
    unless ExportTypeScript.isExported (← Lean.getEnv) name do
      Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory never gives it a \
        counterpart in TypeScript."
    let typeName ← referenceOf name (← typeNameOf packageNamespace name)
    let arguments ← argumentsOf packageNamespace name type.getAppArgs.toList
    if arguments.isEmpty then return typeName
    return s!"{typeName}<{", ".intercalate arguments}>"
  | _ => Lean.throwError m!"`{type}` has no type in TypeScript."

/-- Gives the type arguments of TypeScript that an application of a declaration of the theory takes,
leaving out every instance of a class, such as `Monad m`: every argument without a default value,
then every argument past the binders of the declaration, such as the state space of a kind of
system, and then every argument with a default value up to the last one that differs from its
default, as TypeScript takes a type parameter with a default value after every other one. -/
partial def argumentsOf (packageNamespace name : Lean.Name) (arguments : List Lean.Expr) :
    TypeScriptM (List String) := do
  let information ← Lean.getConstInfo name
  let levels ← information.levelParams.mapM fun _ ↦ Lean.Meta.mkFreshLevelMVar
  let (required, defaulted, extra) ← loop (information.instantiateTypeLevelParams levels) arguments
    [] []
  -- A trailing argument equal to its default value is left to the default.
  let kept := (defaulted.reverse.dropWhile (·.2)).reverse.map (·.1)
  return required ++ extra ++ kept
where
  /-- Takes the binders of the type of the declaration and the arguments one at a time, giving the
  written arguments without and with a default value, the latter marked where they equal it, and the
  written arguments past the binders. -/
  loop (type : Lean.Expr) :
      List Lean.Expr → List String → List (String × Bool) →
        TypeScriptM (List String × List (String × Bool) × List String)
    | [], required, defaulted => return (required, defaulted, [])
    | argument :: rest, required, defaulted => do
      let .forallE _ domain body binderInfo := type
        | return (required, defaulted,
            ← (argument :: rest).mapM (typeOf packageNamespace))
      let next := body.instantiate1 argument
      if binderInfo == .instImplicit then return ← loop next rest required defaulted
      let written ← if isTypeConstructorType domain then typeConstructorOf packageNamespace argument
        else typeOf packageNamespace argument
      match domain.getOptParamDefault? with
      | some default =>
        loop next rest required (defaulted ++ [(written, ← Lean.Meta.isDefEq argument default)])
      | none => loop next rest (required ++ [written]) defaulted

/-- Gives the type lambda of Effect that a type constructor of the theory takes in TypeScript: a
type constructor that is a parameter by its name, the identity monad `Id` as the type lambda of the
identity functor that the theory labels, the options as `Option.OptionTypeLambda` of Effect, and an
application of a type constructor that the theory gives a counterpart in TypeScript by its name,
such as `EffectFunctor<E, R>`, or fails with the reason where the type constructor has none. -/
partial def typeConstructorOf (packageNamespace : Lean.Name) (constructor : Lean.Expr) :
    TypeScriptM String := do
  let environment ← Lean.getEnv
  match constructor.getAppFn with
  | .fvar _ => typeOf packageNamespace constructor
  | .const ``Option _ => effectNameOf "Option" "OptionTypeLambda" .type
  | .const ``Id _ =>
    -- The functor of the identity monad is the identity functor, whose type lambda the declaration
    -- that labels it gives.
    let some label := identityLabelOf? environment
      | Lean.throwError m!"`{constructor}` has no type lambda in TypeScript, as the theory labels \
          no identity functor."
    referenceOf label (← typeNameOf packageNamespace label)
  | .const name _ =>
    unless ExportTypeScript.isExported environment name do
      Lean.throwError m!"`{constructor}` has no type lambda in TypeScript, as the theory never \
        gives `{name}` a counterpart in TypeScript."
    let typeName ← referenceOf name (← typeNameOf packageNamespace name)
    let arguments ← argumentsOf packageNamespace name constructor.getAppArgs.toList
    if arguments.isEmpty then return typeName
    return s!"{typeName}<{", ".intercalate arguments}>"
  | _ => Lean.throwError m!"`{constructor}` has no type lambda in TypeScript."

/-- Gives the generic function type of TypeScript that a function type of the theory takes whose
leading parameters are implicit types, such as `{X Y : Type u} → (X ⟶ Y) → …`, with the type
parameters already written before the rest of the type. -/
partial def genericFunctionOf (packageNamespace : Lean.Name) (generics : List String)
    (type : Lean.Expr) : TypeScriptM String := do
  match type with
  | .forallE name (.sort level) body .implicit =>
    Lean.Meta.withLocalDecl name .implicit (.sort level) fun parameter ↦
      genericFunctionOf packageNamespace (generics ++ [name.toString])
        (body.instantiate1 parameter)
  | _ => return s!"<{", ".intercalate generics}>{← typeOf packageNamespace type}"

/-- Gives the parameters and the result of TypeScript that a function type of the theory takes,
with the parameters already written before the rest of the type. -/
partial def signatureOf (packageNamespace : Lean.Name) (parameters : List String)
    (type : Lean.Expr) : TypeScriptM (List String × String) := do
  match type with
  | .forallE name domain body .default =>
    if body.hasLooseBVars then
      Lean.throwError m!"`{type}` has no type in TypeScript, as its result depends on its \
        parameter `{name}`."
    if name.isAnonymous then
      Lean.throwError m!"`{type}` has no type in TypeScript, as TypeScript names every parameter \
        and the theory names none."
    -- A parameter that the source leaves unnamed takes `f` where it is a morphism, as Mathlib names
    -- a morphism, and the name Lean gives it otherwise, such as `a`.
    let parameterName :=
      if name.hasMacroScopes && (Lean.annotation? `morphism domain).isSome then `f
      else name.eraseMacroScopes
    signatureOf packageNamespace
      (parameters ++ [s!"{parameterName}: {← typeOf packageNamespace domain}"]) body
  | .forallE name .. =>
    Lean.throwError
      m!"`{type}` has no type in TypeScript, as its parameter `{name}` is not explicit."
  | _ => return (parameters, ← typeOf packageNamespace type)

end

mutual

/-- Tells whether a type of the theory is a type of data: a rational number, a string, a boolean, an
option, an array, or a list of data, a structure of data that the theory gives a counterpart in
TypeScript, or a refinement that the theory gives a counterpart in TypeScript. -/
partial def isDataType (type : Lean.Expr) : Lean.MetaM Bool := do
  match type with
  | .const ``Rat _ | .const ``String _ | .const ``Bool _ => return true
  | .app (.const ``Option _) element | .app (.const ``Array _) element
  | .app (.const ``List _) element => isDataType element
  | .const name _ =>
    unless ExportTypeScript.isExported (← Lean.getEnv) name do return false
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
`HKT.TypeLambda`, where the parameter is a functor on types or a type constructor, so that
`HKT.Kind` applies it, and with its default value where it takes one, such as
`Monad extends HKT.TypeLambda = Functor.Id`. -/
def genericOf (packageNamespace : Lean.Name) (parameter : Lean.Expr) (declared : String) :
    TypeScriptM String := do
  let type ← Lean.Meta.inferType parameter
  let constrained ← if isFunctorType type.cleanupAnnotations || isTypeConstructorType type then
      pure s!"{declared} extends {← effectNameOf "HKT" "TypeLambda" .type}"
    else pure declared
  let some default ← defaultOf? parameter | return constrained
  let written ← if isTypeConstructorType type then typeConstructorOf packageNamespace default
    else typeOf packageNamespace default
  return s!"{constrained} = {written}"

/-- Gives the type parameters of a declaration in the order TypeScript takes them, every parameter
without a default value first, then the parameters that follow them, such as the state space of a
kind of system, and then every parameter with a default value, as TypeScript takes a type parameter
with a default value after every other one. -/
def orderedOf (parameters following : List Lean.Expr) : Lean.MetaM (List Lean.Expr) := do
  let defaulted ← parameters.filterM fun parameter ↦ return (← defaultOf? parameter).isSome
  return parameters.filter (!defaulted.contains ·) ++ following ++ defaulted

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

/-- Gives the type of the functors on types that a curried functor gives, a functor from types or
from their opposite into the functors on types, such as `Type u ⥤ Type u ⥤ Type u`, where the type
is the type of one. -/
def curriedTargetOf? (type : Lean.Expr) : Option Lean.Expr :=
  if type.isAppOfArity `CategoryTheory.Functor 4 && ((type.getArg! 0).isSort ||
      (type.getArg! 0).isAppOfArity `Opposite 1 && (type.getArg! 0).appArg!.isSort) &&
      isFunctorType (type.getArg! 2) then some (type.getArg! 2)
  else none

/-- Runs a computation on the object of a curried functor at a type parameter, the functor on types
that the curried functor gives, with the parameter named as the attribute `counterpart` of the
declaration names it or else as the definition of the curried functor names its object, and with
the parameter taken by `Opposite.op` where the curried functor maps the opposite of the types,
given the declaration and the type of the curried functor, or fails with the reason where the
definition names no object. -/
def curriedObjectOf {m : Type → Type} [Monad m] [MonadControlT Lean.MetaM m]
    [MonadLiftT Lean.MetaM m] {α : Type} (declaration : Lean.Name) (functor functorType : Lean.Expr)
    (computation : Lean.Expr → Lean.Expr → m α) : m α := do
  let .const _ levels := functorType.getAppFn
    | monadLift (Lean.throwError m!"`{functorType}` is no type of a functor." : Lean.MetaM α)
  let object := Lean.mkAppN (.const `CategoryTheory.Functor.obj levels)
    (functorType.getAppArgs ++ #[functor])
  -- The definition gives the object as a function, whose binder names the object.
  let .lam binder .. ← monadLift (Lean.Meta.whnfD object : Lean.MetaM Lean.Expr)
    | monadLift (Lean.throwError m!"`{functor}` has no type in TypeScript, as its definition \
        names no object." : Lean.MetaM α)
  let environment ← monadLift (Lean.getEnv : Lean.MetaM Lean.Environment)
  let name := match ExportTypeScript.nameOf? environment declaration binder with
    | some parameter => .mkSimple parameter
    | none => binder
  -- An object of the opposite of the types is a type, which `Opposite.op` takes into the opposite.
  if let .app (.const `Opposite oppositeLevels) type := functorType.getArg! 0 then
    Lean.Meta.withLocalDeclD name type fun parameter ↦
      computation parameter
        (Lean.mkApp object (Lean.mkApp2 (.const `Opposite.op oppositeLevels) type parameter))
  else
    Lean.Meta.withLocalDeclD name (functorType.getArg! 0) fun parameter ↦
      computation parameter (Lean.mkApp object parameter)

/-- Runs a computation on the fields of the type of the functors on types, with a local functor in
place of the action of the functor on types, named as the attribute `counterpart` names the field
`obj` or else as the field, and the type of every other field that is no proof, as `normalizedOf`
reads it, and the statement of every field that is an axiom, given the type of the functors. -/
def functorFieldsOf {m : Type → Type} [Monad m] [MonadControlT Lean.MetaM m]
    [MonadLiftT Lean.MetaM m] {α : Type} (functorType : Lean.Expr)
    (computation : Lean.Expr → List (Lean.Name × Lean.Expr) → List (Lean.Name × Lean.Expr) →
      m α) : m α := do
  let .const structureName _ := functorType.getAppFn
    | monadLift (Lean.throwError m!"`{functorType}` is no type of a functor." : Lean.MetaM α)
  -- The type lambda stands for the action of the functor on types, the field `obj`.
  let name := Lean.Name.mkSimple (← monadLift (fieldNameOf structureName `obj : Lean.MetaM String))
  Lean.Meta.withLocalDeclD name functorType fun functor ↦ do
    let (fields, axioms) ← monadLift (do
      let names := Lean.getStructureFieldsFlattened (← Lean.getEnv) structureName
        (includeSubobjectFields := false)
      let typed ← names.toList.mapM fun field ↦ do
        return (field, ← Lean.Meta.inferType (← Lean.Meta.mkProjection functor field))
      -- An axiom has no value in TypeScript, and the action on types is the functor itself.
      let axioms ← typed.filterM fun (_, fieldType) ↦ Lean.Meta.isProp fieldType
      let fields ← typed.filterMapM fun (field, fieldType) ↦ do
        if ← Lean.Meta.isProp fieldType then return none
        if let .forallE _ (.sort _) (.sort _) _ := fieldType then return none
        return some (field, ← normalizedOf fieldType)
      return (fields, axioms) :
        Lean.MetaM (List (Lean.Name × Lean.Expr) × List (Lean.Name × Lean.Expr)))
    computation functor fields axioms

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
  /-- A class of functors, a type whose value is the type of the functors on types, such as
  `CategoryTheory.Functor (Type u) (Type u)`. -/
  | functorClass
  /-- A type constructor, a declaration whose value is a function from types to types, such as the
  monad `ReaderT R (Except E)`. -/
  | typeConstructor
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
          if isFunctorType value then return .functorClass
          if (← bundledOf value).isSome then return .bundled
        return .type
      | .forallE .. =>
        return if isTypeConstructorType rest && value.isSome then .typeConstructor else .function
      | _ =>
        if isFunctorType rest then return .functor
        return if (curriedTargetOf? rest).isSome then .curriedFunctor else .value

/-- Gives the declaration that labels a structure, other than a given declaration, where the theory
gives one a counterpart in TypeScript, such as `Coalgebra` for
`CategoryTheory.Endofunctor.Coalgebra`. -/
def labelOf? (name structureName : Lean.Name) : Lean.MetaM (Option Lean.Name) := do
  let environment ← Lean.getEnv
  return ((ExportTypeScript.exportsOf environment).map (·.declaration)).find? fun declaration ↦
    declaration != name && ExportTypeScript.labels environment declaration structureName

/-- Gives the arguments of an application at the type parameters of its function, the binders over
a type or over a functor on types, leaving out every category and its instance, such as `F` and `G`
of `Functor.comp (Type u) _ (Type u) _ (Type u) _ F G`. -/
partial def typeArgumentsOf (function : Lean.Expr) (arguments : List Lean.Expr) :
    Lean.MetaM (List Lean.Expr) := do
  loop (← Lean.Meta.inferType function) arguments
where
  /-- Takes the binders of the type of the function and the arguments one at a time. -/
  loop (type : Lean.Expr) : List Lean.Expr → Lean.MetaM (List Lean.Expr)
    | [] => return []
    | argument :: rest => do
      let .forallE _ domain body binderInfo ← Lean.Meta.whnf type | return []
      let next := body.instantiate1 argument
      -- A category is a binder over a type that the next binder, an instance of
      -- `CategoryTheory.Category`, takes.
      let isCategory := domain.isSort && match next with
        | .forallE _ categoryClass _ .instImplicit =>
          categoryClass.isAppOfArity `CategoryTheory.Category 1 && categoryClass.appArg! == argument
        | _ => false
      let kept ← loop next rest
      return if !isCategory && binderInfo != .instImplicit && isParameterType domain then
          argument :: kept
        else kept

/-- Gives the type lambda of Effect that a functor on types of the theory takes in TypeScript: a
functor that is a parameter by its name, an object of a curried functor that the theory gives a
counterpart in TypeScript, such as `BinaryProductFunctor<Output>` for
`binaryProductFunctor.obj Output`, an application of a functor that the theory gives a counterpart
in TypeScript, such as `Functor.Comp<F, G>` for `Functor.comp F G`, and the functor of the
options, `ofTypeFunctor Option`, as `Option.OptionTypeLambda` of Effect, or fails with the reason
where the functor has none. -/
partial def typeLambdaOf (packageNamespace : Lean.Name) (functor : Lean.Expr) :
    TypeScriptM String := do
  let environment ← Lean.getEnv
  -- The generator imports no Mathlib, so the names of Mathlib are written as names alone.
  match functor.getAppFn, functor.getAppArgs with
  | .fvar _, #[] => typeOf packageNamespace functor
  | .const `CategoryTheory.Functor.obj _, #[_, _, _, _, curried, object] =>
    let .const name _ := curried.getAppFn
      | Lean.throwError m!"`{functor}` has no type lambda in TypeScript."
    unless ExportTypeScript.isExported environment name do
      Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory never gives it a \
        counterpart in TypeScript."
    -- An object of the opposite of the types is a type that `Opposite.op` takes into the opposite.
    let object := if object.isAppOfArity `Opposite.op 2 then object.appArg! else object
    return s!"{← referenceOf name (← typeNameOf packageNamespace name)}\
      <{← typeOf packageNamespace object}>"
  | .const `CategoryTheory.ofTypeFunctor _, arguments =>
    -- The functor of a type constructor takes the type lambda of the type constructor.
    let some constructor := arguments[0]?
      | Lean.throwError m!"`{functor}` has no type lambda in TypeScript."
    typeConstructorOf packageNamespace constructor
  | .const name _, arguments =>
    unless ExportTypeScript.isExported environment name do
      Lean.throwError m!"`{functor}` has no type lambda in TypeScript, as the theory never gives \
        `{name}` a counterpart in TypeScript."
    let written ← (← typeArgumentsOf functor.getAppFn arguments.toList).mapM fun argument ↦ do
      let argumentType ← Lean.Meta.inferType argument
      if isFunctorType argumentType then typeLambdaOf packageNamespace argument
      else if isTypeConstructorType argumentType then typeConstructorOf packageNamespace argument
      else typeOf packageNamespace argument
    let typeArguments := if written.isEmpty then "" else s!"<{", ".intercalate written}>"
    return s!"{← referenceOf name (← typeNameOf packageNamespace name)}{typeArguments}"
  | _, _ => Lean.throwError m!"`{functor}` has no type lambda in TypeScript."

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
    unless ExportTypeScript.isExported (← Lean.getEnv) name do
      Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory never gives it a \
        counterpart in TypeScript."
    unless ← isDataType type do
      Lean.throwError m!"`{name}` has no schema in TypeScript, as it is neither a structure whose \
        every field takes a schema nor a refinement."
    referenceOf name (← typeNameOf packageNamespace name)
  | _ => Lean.throwError m!"`{type}` has no schema in TypeScript."

mutual

/-- Gives the polarities at which a type parameter occurs in a type, `true` for a positive
occurrence and `false` for a negative one, given the polarity of the type. -/
partial def polaritiesOf (parameter : Lean.Expr) (positive : Bool) (type : Lean.Expr) :
    Lean.MetaM (List Bool) := do
  match type with
  | .fvar _ => return if type == parameter then [positive] else []
  | .mdata _ inner => polaritiesOf parameter positive inner
  | .forallE _ domain body _ =>
    return (← polaritiesOf parameter (!positive) domain) ++
      (← polaritiesOf parameter positive body)
  | _ =>
    -- An object of a functor that is a parameter varies with the functor in the direction of the
    -- natural transformation, so the functor occurs at the polarity of the object, while
    -- TypeScript sees no variance of the type lambda, so every parameter in the object occurs at
    -- both polarities.
    if let some (functor, object) ← parameterObjectOf type then
      return (if functor == parameter then [positive] else []) ++
        (← polaritiesOf parameter positive object) ++ (← polaritiesOf parameter (!positive) object)
    -- An effect of Effect varies with its value, its failure, and its requirements alike, as
    -- TypeScript declares `Effect.Effect`, whereas the requirements of the theory are read.
    if let .app (.app (.app (.const ``ReaderT _) requirements) (.app (.const ``Except _) failure))
        success := type then
      return (← polaritiesOf parameter positive success) ++
        (← polaritiesOf parameter positive failure) ++
        (← polaritiesOf parameter positive requirements)
    let .const name _ := type.getAppFn | return []
    let variances ← if [``Option, ``Array, ``List].contains name then pure [[true]]
      else if name == ``Sum then pure [[true], [true]]
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
    if let .forallE _ domain _ _ := rest then
      if isTypeConstructorType rest then
        return ← Lean.Meta.withLocalDeclD `target domain fun target ↦
          polaritiesIn [Lean.mkApp value target]
    -- The fields of a bundled structure name its type parameters, which exist only while the
    -- fields are read, so the polarities are taken there.
    if (← bundledOf value).isSome then
      bundledFieldsOf value fun _ fields ↦ polaritiesIn (fields.map Prod.snd)
    else polaritiesIn [value]

end

end Generator
