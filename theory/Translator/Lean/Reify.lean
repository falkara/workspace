/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Translation
public import Lean.Meta.AppBuilder
public import Lean.Structure
public import Translator.Lean.Source
public import Translator.Lean.Tree

import Lean.Meta.WHNF

/-!
# Reify

The module defines the reading of a type of the theory into its tree, the one part of the
translator that elaborates expressions of Lean: the reference to a declaration in the environment
of the reading, the shapes of the types that a declaration binds, the objects of functors and type
constructors that are parameters, the fields of structures, the types of data, the objects of
functors whose declarations name their fields, the normal form of a type, and its tree.

## Implementation Notes

The reading names no constant of Lean that the theory builds on, such as the functors of Mathlib,
but takes them by the structural parts and the formers that the rules of the translator give them,
so the rules of `Falkara.Translation.Rules`, which resolve every constant when the theory compiles,
are the one list of the constants that the translator knows. The reading takes the rules as an
argument, as it reads them from the environment once rather than at every node.

An object of a functor reduces until it is an object of a functor that is a parameter, such as
`G.obj (F.obj X)` of a composite `F ⋙ G`, or of another functor that the theory gives a
counterpart, which reduces on its own, as a further step takes the object apart into the fields of
the functor. An object of a functor whose declaration names the fields of the structure it reduces
to, such as the product that the functor of binary products gives, stays an object, so the
declaration that names the fields stays with it, and a morphism `X ⟶ Y` of the category of types
stays a morphism rather than a function type, so the reading tells both apart from a product and a
function of any other kind.

Every reading takes fuel, a step for every node and every unfolding, the depth of the expression
and a fixed number of unfoldings, and refuses where it runs out, so it ends on every expression.
-/

public section

namespace Translator.Lean

open Falkara

/-- The number of unfoldings that a reading takes beyond the depth of its expression. -/
def unfoldingDepth : Nat := 256

/-- Gives the fuel of a reading of an expression: a step for every level of its depth and the
unfoldings of `unfoldingDepth`. -/
def fuelOf (expression : Lean.Expr) : Nat :=
  expression.approxDepth.toNat + unfoldingDepth

/-- Gives the reference to a declaration of the theory in the environment of the reading, as the
records of the theory give it. -/
def declarationReferenceOf (packageNamespace name : Lean.Name) : Lean.MetaM Core.Reference := do
  return Source.referenceOf (← Lean.getEnv) packageNamespace name

/-- Gives the rules of the translator that the environment of the reading records. -/
def rulesOf : Lean.MetaM (List Translation.Rule) := do
  return Translation.rulesOf (← Lean.getEnv)

/-- Gives the constant that the rules give a structural part, or refuses where they give none. -/
def structuralConstantOf (rules : List Translation.Rule) (part : Translation.Structural) :
    Lean.MetaM Lean.Name := do
  let some constant := (Translation.constantsOf rules (.structural part)).head?
    | Lean.throwError (Refusal.render (.missingRule part.word))
  return constant

/-- Tells whether an expression is an application of a constant that the rules give a structural
part. -/
def isApplicationOf (rules : List Translation.Rule) (part : Translation.Structural)
    (expression : Lean.Expr) : Bool :=
  match expression.getAppFn with
  | .const name _ => Translation.isStructural rules part name
  | _ => false

/-- Tells whether a type of the theory is the type of a functor on types, such as
`Type u ⥤ Type u`. -/
def isFunctorType (rules : List Translation.Rule) (type : Lean.Expr) : Bool :=
  match type.getAppFn, type.getAppArgs with
  | .const name _, #[.sort _, _, .sort _, _] => Translation.isStructural rules .functor name
  | _, _ => false

/-- Tells whether a type of the theory is the type of a type constructor, a function from types to
types, such as `Type u → Type u` of a monad. -/
def isTypeConstructorType (type : Lean.Expr) : Bool :=
  match type.cleanupAnnotations with
  | .forallE _ (.sort _) (.sort _) _ => true
  | _ => false

/-- Tells whether a binder of the theory binds a type parameter: a binder over a type, over a
functor on types, or over a type constructor, with or without a default value. -/
def isParameterType (rules : List Translation.Rule) (type : Lean.Expr) : Bool :=
  let type := type.cleanupAnnotations
  type.isSort || isFunctorType rules type || isTypeConstructorType type

/-- Gives the number of type parameters of a declaration, the leading binders of its type over a
type, over a functor on types, or over a type constructor. -/
def typeParameterCount (rules : List Translation.Rule) : Lean.Expr → Nat
  | .forallE _ domain body _ =>
    if isParameterType rules domain then typeParameterCount rules body + 1 else 0
  | _ => 0

/-- Gives the functor and the object of an object `F.obj X` of a functor `F` that is a parameter,
which no reduction resolves, or of an application `m X` of a type constructor `m` that is a
parameter, where the type is one. -/
def parameterObjectOf (rules : List Translation.Rule) (type : Lean.Expr) :
    Lean.MetaM (Option (Lean.Expr × Lean.Expr)) := do
  if let #[_, _, _, _, .fvar functor, object] := type.getAppArgs then
    if isApplicationOf rules .functorObject type then return some (.fvar functor, object)
  -- A parameter applied to a type is an object only where the parameter is a type constructor, as
  -- a function that a binder holds applies to values.
  if let .app (.fvar constructor) object := type then
    if isTypeConstructorType (← constructor.getType) then return some (.fvar constructor, object)
  return none

/-- Gives the type and the condition of a refinement, a type of the theory whose value is a subtype
`{ value : T // condition value = true }` of a type `T` by a function `condition` that the theory
gives a counterpart, where the declaration is one. -/
def refinementOf (name : Lean.Name) : Lean.MetaM (Option (Lean.Expr × Lean.Name)) := do
  let some value := (← Lean.getConstInfo name).value? | return none
  let .app (.app (.const ``Subtype _) base) (.lam _ _ body _) := value | return none
  let .app (.app (.app (.const ``Eq _) (.const ``Bool _)) (.app (.const condition _) (.bvar 0)))
      (.const ``Bool.true _) := body
    | return none
  unless ExportTypeScript.isExported (← Lean.getEnv) condition do return none
  return some (base, condition)

/-- Gives the type of every field of a structure, with the type parameters given in place of those
of the structure, or refuses where the type of a field depends on the structure. -/
def fieldTypesOf (name : Lean.Name) (parameters : Array Lean.Expr) :
    Lean.MetaM (List (Lean.Name × Lean.Expr)) := do
  (Lean.getStructureFields (← Lean.getEnv) name).toList.mapM fun field ↦ do
    match ← Lean.Meta.instantiateForall (← Lean.getConstInfo (name ++ field)).type
        parameters with
    | .forallE _ _ fieldType _ =>
      if fieldType.hasLooseBVars then
        Lean.throwError (Refusal.render (.dependentField (name ++ field)))
      return (field, fieldType)
    | _ => Lean.throwError (Refusal.render (.noField (name ++ field)))

mutual

/-- Tells whether a type of the theory is a type of data: a rational number, a string, a boolean, an
option or an array of data, a structure of data that the theory gives a counterpart, or a
refinement that the theory gives a counterpart, or refuses where the fuel runs out. -/
def isDataType (rules : List Translation.Rule) : Nat → Lean.Expr → Lean.MetaM Bool
  | 0, type => Lean.throwError (Refusal.render (.fuel type))
  | fuel + 1, type => do
    match type with
    | .app (.const name _) element =>
      match Translation.formerOf? rules name with
      | some .option | some .array => isDataType rules fuel element
      | _ => return false
    | .const name _ =>
      match Translation.formerOf? rules name with
      | some .rational | some .string | some .boolean => return true
      | _ =>
        unless ExportTypeScript.isExported (← Lean.getEnv) name do return false
        if Lean.isStructure (← Lean.getEnv) name then isData rules fuel name
        else return (← refinementOf name).isSome
    | _ => return false

/-- Tells whether a structure is a structure of data, one without type parameters whose every field
takes a type of data, or refuses where the fuel runs out. -/
def isData (rules : List Translation.Rule) : Nat → Lean.Name → Lean.MetaM Bool
  | 0, name => Lean.throwError (Refusal.render (.fuel (Lean.mkConst name)))
  | fuel + 1, name => do
    if typeParameterCount rules (← Lean.getConstInfo name).type > 0 then return false
    -- A structure whose field depends on the structure has no fields that a type of data
    -- describes.
    let fields ← try fieldTypesOf name #[] catch _ => return false
    fields.allM fun (_, fieldType) ↦ isDataType rules fuel fieldType

end

/-- Gives the declaration that the theory gives a counterpart of the functor whose object a type
is, through the functors that a curried functor gives, such as `binaryProductFunctor` for
`(binaryProductFunctor.obj B).obj X`, or for the functor of Mathlib that the declaration labels,
where the theory gives one a counterpart. -/
def functorDeclarationOf? (environment : Lean.Environment) (rules : List Translation.Rule)
    (type : Lean.Expr) : Option Lean.Name :=
  loop (type.approxDepth.toNat + 1) type
where
  /-- Takes the functor of the object one step at a time, each a strict part of the last, so the
  depth of the type bounds the steps. -/
  loop : Nat → Lean.Expr → Option Lean.Name
    | 0, _ => none
    | fuel + 1, type =>
      match type.getAppFn, type.getAppArgs[4]? with
      | .const name _, some functor =>
        if Translation.isStructural rules .prefunctorObject name ||
            Translation.isStructural rules .functorObject name ||
            Translation.isStructural rules .toPrefunctor name then
          loop fuel functor
        else labelled name
      | .const name _, none => labelled name
      | _, _ => none
  /-- Gives the declaration that labels a constant, where the theory gives one a counterpart. -/
  labelled (name : Lean.Name) : Option Lean.Name :=
    (ExportTypeScript.exportsOf environment).findSome? fun declared ↦
      if ExportTypeScript.labels environment declared.declaration name then
        some declared.declaration
      else none

/-- Gives an object of a functor reduced until it is an object of a functor that is a parameter or
of another functor that the theory gives a counterpart. -/
def reducedOf (rules : List Translation.Rule) (type : Lean.Expr) : Lean.MetaM Lean.Expr := do
  let environment ← Lean.getEnv
  Lean.Meta.whnfHeadPred type fun part ↦
    return (← parameterObjectOf rules part).isNone &&
      (part == type || (functorDeclarationOf? environment rules part).isNone)

/-- The object of a functor whose declaration names the fields of the structure it reduces to. -/
structure Record where
  /-- The declaration of the functor, which names the fields. -/
  declaration : Lean.Name
  /-- The structure that the object reduces to. -/
  structureName : Lean.Name
  /-- The arguments of the structure. -/
  arguments : Array Lean.Expr
  /-- Every field of the structure, by its name in the structure, the name that the declaration
  gives it or else its name, and its type. -/
  fields : List (Lean.Name × String × Lean.Expr)

/-- Gives the record of an object of a functor whose declaration names the fields of the structure
it reduces to, such as the product that the functor of binary products gives, where the type is
one. -/
def recordOf? (rules : List Translation.Rule) (type : Lean.Expr) :
    Lean.MetaM (Option Record) := do
  unless isApplicationOf rules .prefunctorObject type ||
      isApplicationOf rules .functorObject type || isApplicationOf rules .fromOpposite type do
    return none
  let environment ← Lean.getEnv
  let some declaration := functorDeclarationOf? environment rules type | return none
  let reduced ← reducedOf rules type
  let .const structureName _ := reduced.getAppFn | return none
  unless reduced != type && Lean.isStructure environment structureName &&
      (Lean.getStructureFields environment structureName).any fun field ↦
        (ExportTypeScript.nameOf? environment declaration field).isSome do
    return none
  let fields ← fieldTypesOf structureName reduced.getAppArgs
  return some {
    declaration
    structureName
    arguments := reduced.getAppArgs
    fields := fields.map fun (field, fieldType) ↦
      (field, (ExportTypeScript.nameOf? environment declaration field).getD field.toString,
        fieldType) }

/-- Gives a type of the theory in normal form: every object of a functor reduced, but the object of
a functor whose declaration names its fields and the morphism of the category of types, whose parts
alone take the normal form, or refuses where the fuel runs out. -/
def normalizedOf (rules : List Translation.Rule) (type : Lean.Expr) : Lean.MetaM Lean.Expr :=
  loop (fuelOf type) type
where
  /-- Takes the type apart one node at a time, with a step of the fuel for every node and every
  reduction. -/
  loop : Nat → Lean.Expr → Lean.MetaM Lean.Expr
    | 0, type => Lean.throwError (Refusal.render (.fuel type))
    | fuel + 1, type => do
      match type with
      | .forallE name domain body info =>
        return .forallE name (← loop fuel domain) (← loop fuel body) info
      | _ =>
        if let some (_, object) ← parameterObjectOf rules type then
          return Lean.mkAppN type.getAppFn (type.getAppArgs.pop.push (← loop fuel object))
        match type.getAppArgs with
        | #[category, quiver, domain, codomain] =>
          if isApplicationOf rules .hom type then
            return Lean.mkAppN type.getAppFn
              #[category, quiver, ← loop fuel domain, ← loop fuel codomain]
        | #[domain, codomain] =>
          if isApplicationOf rules .typeHom type then
            return Lean.mkAppN type.getAppFn #[← loop fuel domain, ← loop fuel codomain]
        | _ => pure ()
        if isApplicationOf rules .prefunctorObject type ||
            isApplicationOf rules .functorObject type || isApplicationOf rules .fromOpposite type
        then
          if (← recordOf? rules type).isSome then return type
          let reduced ← reducedOf rules type
          if reduced == type then return type
          return ← loop fuel reduced
        let arguments := type.getAppArgs
        if arguments.isEmpty then return type
        return Lean.mkAppN type.getAppFn (← arguments.mapM (loop fuel))

/-- Gives every argument that a declaration of the theory takes in a target, leaving out every
instance of a class, such as `Monad m`, each with whether its parameter is a type constructor and
its role: an argument without a default value, one with a default value at that value or not, and
one past the binders of the declaration, such as the state space of a kind of system, and its
position among all the arguments of the application. -/
def declaredArgumentsOf (name : Lean.Name) (arguments : List Lean.Expr) :
    Lean.MetaM (List (Lean.Expr × Bool × Role × Nat)) := do
  let information ← Lean.getConstInfo name
  let levels ← information.levelParams.mapM fun _ ↦ Lean.Meta.mkFreshLevelMVar
  loop (information.instantiateTypeLevelParams levels) arguments.zipIdx
where
  /-- Takes the binders of the type of the declaration and the arguments one at a time. -/
  loop (type : Lean.Expr) :
      List (Lean.Expr × Nat) → Lean.MetaM (List (Lean.Expr × Bool × Role × Nat))
    | [] => return []
    | (argument, index) :: rest => do
      let .forallE _ domain body binderInfo := type
        | return ((argument, index) :: rest).map fun (argument, index) ↦
            (argument, false, .extra, index)
      let next := body.instantiate1 argument
      if binderInfo == .instImplicit then return ← loop next rest
      let role ← match domain.getOptParamDefault? with
        | some default => pure (.defaulted (← Lean.Meta.isDefEq argument default))
        | none => pure .required
      return (argument, isTypeConstructorType domain, role, index) :: (← loop next rest)

/-- Runs a computation on the type parameters of a declaration, the leading binders of its type over
a type, over a functor on types, or over a type constructor, named as the attribute `counterpart`
names them or else as their binders, leaving out every instance of a class on a parameter, such as
`Monad m`, which constrains the parameter and is no parameter of its own, with the rest of its type
and its value applied to the parameters, where it has a value, and with every category that is a
parameter, a binder over a type followed by an instance of the class of the categories on it, taken
as the category of types, the one category of a target, or refuses where the category of types
does not fit. -/
def parametersOf {m : Type → Type} [Monad m] [MonadControlT Lean.MetaM m]
    [MonadLiftT Lean.MetaM m] {α : Type} (rules : List Translation.Rule)
    (information : Lean.ConstantInfo)
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
    if let .forallE _ categoryClass@(.app (.const categoryName _) (.bvar 0)) rest
        .instImplicit := body then
      if domain.isSort && Translation.isStructural rules .category categoryName then
        -- The category of types takes its instance of Mathlib, whose type the instance of the
        -- declaration unifies with.
        let (category, types) ← monadLift (do
          let level ← Lean.Meta.mkFreshLevelMVar
          let category := Lean.mkSort (.succ level)
          let types := Lean.mkConst (← structuralConstantOf rules .types) [level]
          unless ← Lean.Meta.isDefEq (← Lean.Meta.inferType types)
              (categoryClass.instantiate1 category) do
            Lean.throwError (Refusal.render (.foreignCategory type))
          return (category, types) : Lean.MetaM (Lean.Expr × Lean.Expr))
        return ← loop declaration remaining (rest.instantiateRev #[category, types])
          (value.map (Lean.mkApp2 · category types)) parameters
    -- An instance of a class on a type parameter, such as `Monad m`, constrains the parameter and
    -- is no parameter of its own, as a target takes the class by its instances.
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
    if isParameterType rules domain then
      let environment ← monadLift (Lean.getEnv : Lean.MetaM Lean.Environment)
      let parameterName := match ExportTypeScript.nameOf? environment declaration name with
        | some parameterName => .mkSimple parameterName
        | none => name
      -- The parameter keeps the default value that its type annotates, which a target gives the
      -- parameter as well.
      Lean.Meta.withLocalDecl parameterName binderInfo domain fun parameter ↦
        loop declaration remaining (body.instantiate1 parameter)
          (value.map (Lean.mkApp · parameter)) (parameters.push parameter)
    else finish

/-- Gives the declaration that labels the identity functor of Mathlib, the functor of the identity
monad `Id`, where the theory gives one a counterpart. -/
def identityLabelOf? (environment : Lean.Environment) (rules : List Translation.Rule) :
    Option Lean.Name :=
  (Translation.constantsOf rules (.structural .identityFunctor)).head?.bind fun identity ↦
    (ExportTypeScript.exportsOf environment).findSome? fun declared ↦
      if ExportTypeScript.labels environment declared.declaration identity then
        some declared.declaration
      else none

/-- Gives the name of a binder that a telescope opens as a free variable, or refuses where the
expression is no free variable. -/
def binderNameOf (binder : Lean.Expr) : Lean.MetaM String := do
  let .fvar binderId := binder | Lean.throwError (Refusal.render (.noBinder binder))
  return (← binderId.getUserName).toString

/-- Gives the default value of a type parameter, which the type of its binder annotates, such as
`Id` for `(m : Type u → Type u := Id)`, where the parameter takes one. -/
def defaultOf? (parameter : Lean.Expr) : Lean.MetaM (Option Lean.Expr) := do
  return (← Lean.Meta.inferType parameter).getOptParamDefault?

/-- Gives the name that a field of a structure takes in a target, as the clause of the attribute
`counterpart` on the declaration that labels the structure names it or else as the structure names
it. -/
def fieldNameOf {m : Type → Type} [Monad m] [Lean.MonadEnv m] (structureName field : Lean.Name) :
    m String := do
  return Source.fieldNameOf (← Lean.getEnv) structureName field

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
type parameter in place of the projection of its field, as `normalizedOf` reads it, or refuses
where the type of a field depends on another field. -/
def bundledFieldsOf {m : Type → Type} [Monad m] [MonadControlT Lean.MetaM m]
    [MonadLiftT Lean.MetaM m] {α : Type} (rules : List Translation.Rule) (type : Lean.Expr)
    (computation : List Lean.Expr → List (Lean.Name × Lean.Expr) → m α) : m α := do
  let .const structureName _ := type.getAppFn
    | monadLift (Lean.throwError (Refusal.render (.typeAppliesNoStructure type)) : Lean.MetaM α)
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
          monadLift (Lean.throwError
            (Refusal.render (.fieldDependsOnField (structureName ++ field))) : Lean.MetaM α)
        else
          loop structureName self rest parameters
            (others ++ [(field, ← normalizedOf rules replaced)]) replacements

/-- Runs a computation on the local that stands for the object of a type lambda and the object of a
functor on types at it, as `normalizedOf` reads the object, given the type of the functor, or
refuses where the type is no type of a functor. -/
def lambdaObjectOf {m : Type → Type} [Monad m] [MonadControlT Lean.MetaM m]
    [MonadLiftT Lean.MetaM m] {α : Type} (rules : List Translation.Rule)
    (functor functorType : Lean.Expr) (computation : Lean.Expr → Lean.Expr → m α) : m α := do
  -- The object takes the categories and the universes of the type of the functor as they stand,
  -- as the object of a functor takes them in the order the type of the functors does.
  let (.const _ levels, some source) := (functorType.getAppFn, functorType.getAppArgs[0]?)
    | monadLift (Lean.throwError (Refusal.render (.noFunctorType functorType)) : Lean.MetaM α)
  let objectConstant ← monadLift (structuralConstantOf rules .functorObject)
  Lean.Meta.withLocalDeclD `target source fun target ↦ do
    computation target (← (normalizedOf rules (Lean.mkAppN (.const objectConstant levels)
      (functorType.getAppArgs ++ #[functor, target])) : Lean.MetaM Lean.Expr))

/-- Gives the polarities of the type parameters of a constant whose former takes every argument at
a positive polarity: the options, the arrays, and the binary sums. -/
def covariancesOf (rules : List Translation.Rule) (name : Lean.Name) :
    Option (List (List Bool)) :=
  match Translation.formerOf? rules name with
  | some .option | some .array => some [[true]]
  | some .sum => some [[true], [true]]
  | _ => none

mutual

/-- Gives the polarities at which a type parameter occurs in a type, `true` for a positive
occurrence and `false` for a negative one, given the polarity of the type, or refuses where the
fuel runs out. -/
def polaritiesOf (rules : List Translation.Rule) :
    Nat → Lean.Expr → Bool → Lean.Expr → Lean.MetaM (List Bool)
  | 0, _, _, type => Lean.throwError (Refusal.render (.fuel type))
  | fuel + 1, parameter, positive, type => do
    match type with
    | .fvar _ => return if type == parameter then [positive] else []
    | .mdata _ inner => polaritiesOf rules fuel parameter positive inner
    | .forallE _ domain body _ =>
      return (← polaritiesOf rules fuel parameter (!positive) domain) ++
        (← polaritiesOf rules fuel parameter positive body)
    | _ =>
      -- A morphism takes its domain and gives its codomain, as a function type does.
      let morphism := match type.getAppArgs with
        | #[_, _, domain, codomain] =>
          if isApplicationOf rules .hom type then some (domain, codomain) else none
        | #[domain, codomain] =>
          if isApplicationOf rules .typeHom type then some (domain, codomain) else none
        | _ => none
      if let some (domain, codomain) := morphism then
        return (← polaritiesOf rules fuel parameter (!positive) domain) ++
          (← polaritiesOf rules fuel parameter positive codomain)
      -- An object of a functor whose declaration names its fields varies with every field alike.
      if let some record ← recordOf? rules type then
        return ← record.fields.flatMapM fun (_, _, fieldType) ↦ do
          polaritiesOf rules fuel parameter positive (← normalizedOf rules fieldType)
      -- An object of a functor that is a parameter varies with the functor in the direction of the
      -- natural transformation, so the functor occurs at the polarity of the object, while a
      -- target sees no variance of the type lambda, so every parameter in the object occurs at
      -- both polarities.
      if let some (functor, object) ← parameterObjectOf rules type then
        return (if functor == parameter then [positive] else []) ++
          (← polaritiesOf rules fuel parameter positive object) ++
          (← polaritiesOf rules fuel parameter (!positive) object)
      -- A computation varies with its value, its failure, and its requirements alike, as Effect
      -- declares `Effect.Effect`, whereas the requirements of the theory are read.
      if let .app (.app (.app (.const reader _) requirements) (.app (.const except _) failure))
          success := type then
        if Translation.formerOf? rules reader == some .reader &&
            Translation.formerOf? rules except == some .except then
          return (← polaritiesOf rules fuel parameter positive success) ++
            (← polaritiesOf rules fuel parameter positive failure) ++
            (← polaritiesOf rules fuel parameter positive requirements)
      let .const name _ := type.getAppFn | return []
      let variances ← match covariancesOf rules name with
        | some variances => pure variances
        | none => variancesOf rules fuel name
      (type.getAppArgs.toList.zip variances).flatMapM fun (argument, polarities) ↦
        polarities.flatMapM fun polarity ↦
          polaritiesOf rules fuel parameter (positive == polarity) argument

/-- Gives the polarities at which every type parameter of a declaration occurs in the fields of the
declaration where it is a structure, in the fields of the bundled structure that its value applies
where its value is one, in the object of its type lambda where it is a functor, and in its value
otherwise, or refuses where the fuel runs out. -/
def variancesOf (rules : List Translation.Rule) : Nat → Lean.Name → Lean.MetaM (List (List Bool))
  | 0, name => Lean.throwError (Refusal.render (.fuel (Lean.mkConst name)))
  | fuel + 1, name => do
    parametersOf rules (← Lean.getConstInfo name) fun parameters rest value ↦ do
      let polaritiesIn := fun (types : List Lean.Expr) ↦
        parameters.toList.mapM fun parameter ↦
          types.flatMapM (polaritiesOf rules fuel parameter true)
      if Lean.isStructure (← Lean.getEnv) name then
        return ← polaritiesIn ((← fieldTypesOf name parameters).map Prod.snd)
      let some value := value | polaritiesIn []
      if isFunctorType rules rest then
        return ← lambdaObjectOf rules value rest fun _ object ↦ polaritiesIn [object]
      if let .forallE _ domain _ _ := rest then
        if isTypeConstructorType rest then
          return ← Lean.Meta.withLocalDeclD `target domain fun target ↦
            polaritiesIn [Lean.mkApp value target]
      -- The fields of a bundled structure name its type parameters, which exist only while the
      -- fields are read, so the polarities are taken there.
      if (← bundledOf value).isSome then
        bundledFieldsOf rules value fun _ fields ↦ polaritiesIn (fields.map Prod.snd)
      else polaritiesIn [value]

end

/-- What a reading of a type knows beyond the type: the rules of the translator, the namespace of
the package, after which the names of its declarations take their words, and the local that stands
for the object of a type lambda, where the type is one. -/
structure Reify.Context where
  /-- The rules of the translator. -/
  rules : List Translation.Rule
  /-- The namespace of the package. -/
  packageNamespace : Lean.Name
  /-- The local that stands for the object of a type lambda. -/
  target : Option Lean.FVarId

/-- Gives the tree of a type of the theory, in normal form, or refuses where the fuel runs out. -/
def reify (context : Reify.Context) : Nat → Lean.Expr → Lean.MetaM Tree
  | 0, type => Lean.throwError (Refusal.render (.fuel type))
  | fuel + 1, type => do
    let rules := context.rules
    match type with
    | .mdata _ inner => reify context fuel inner
    | .fvar identifier =>
      if context.target == some identifier then return .target type
      -- A parameter keeps its name as it stands, which a name of Lean would escape.
      return .parameter ((← identifier.getUserName).toString (escape := false)) type
    | .forallE name (.sort level) body .implicit =>
      Lean.Meta.withLocalDecl name .implicit (.sort level) fun parameter ↦ do
        return .generic name (← reify context fuel (body.instantiate1 parameter)) type
    | .forallE name domain body .default =>
      if body.hasLooseBVars then return .dependent name type
      let parameter := FunctionParameter.mk name (← reify context fuel domain) type
      -- A function type takes every parameter of the function types that it gives in one list.
      match ← reify context fuel body with
      | .function parameters result _ => return .function (parameter :: parameters) result type
      | result => return .function [parameter] result type
    | .forallE name .. => return .implicit name type
    | _ =>
      if let some (functor, object) ← parameterObjectOf rules type then
        return .object (← reify context fuel functor) (← reify context fuel object) type
      let environment ← Lean.getEnv
      let constant := fun (name : Lean.Name) (arguments : Array Lean.Expr) ↦ do
        unless ExportTypeScript.isExported environment name do
          return Tree.constant name (← arguments.toList.mapM (reify context fuel)) type
        -- A declaration without arguments is the one form a schema takes, so it alone tells
        -- whether it is a type of data.
        let data ← if arguments.isEmpty then isDataType rules unfoldingDepth type else pure false
        -- Every argument takes the polarities of the parameter at its position, as the
        -- declaration takes it.
        let variances ← variancesOf rules unfoldingDepth name
        return .declared (← declarationReferenceOf context.packageNamespace name) data
          (← (← declaredArgumentsOf name arguments.toList).mapM
            fun (argument, isConstructor, role, index) ↦
              return .mk (← reify context fuel argument) isConstructor role
                (variances[index]?.getD []))
          type
      match type.getAppArgs with
      | #[.sort _, _, domain, codomain] =>
        if isApplicationOf rules .hom type then
          return .morphism (← reify context fuel domain) (← reify context fuel codomain) type
      | #[domain, codomain] =>
        if isApplicationOf rules .typeHom type then
          return .morphism (← reify context fuel domain) (← reify context fuel codomain) type
      | _ => pure ()
      let .const name _ := type.getAppFn | return .other type
      if isApplicationOf rules .prefunctorObject type ||
          isApplicationOf rules .functorObject type || isApplicationOf rules .fromOpposite type
      then
        if let some record ← recordOf? rules type then
          return .record (← declarationReferenceOf context.packageNamespace record.declaration)
            (← record.fields.mapM fun (_, name, fieldType) ↦
              return .mk name (← reify context fuel fieldType))
            type
        let reduced ← reducedOf rules type
        if reduced == type then return ← constant name type.getAppArgs
        return ← reify context fuel reduced
      constant name type.getAppArgs

end Translator.Lean
