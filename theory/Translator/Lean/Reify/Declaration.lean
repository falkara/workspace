/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Lean.Meta.WHNF
public import Translator.Lean.Reify

import Translator.Lean.Evaluate

/-!
# Declaration

The module defines the reading of a declaration of the theory into a declaration of the core whose
types are trees: the kind of the declaration, its type parameters with their defaults, the fields of
its structure or of the structure that its value bundles, the object of its type lambda, the
structure that the object of a curried functor gives, the laws of a class of functors, the
signature of a function, the value of a value as the module `Evaluate` gives it, and the instance of
the class of functors that a functor takes, with the documentation that the records of the theory
give each of them.

## Implementation Notes

A category that is a parameter takes the category of types, as a target has no category but its
types and its functions, so the theory names a declaration of Mathlib as it stands and the reading
fixes the category.

A bundled structure that applies a structure that the theory labels extends the label at its
functors where every functor has a type lambda, so the reading of the extension is an attempt,
which a failure leaves out rather than refuses.

A value is reduced by the kernel of Lean rather than computed by the compiler, so the reading holds
the value that the kernel checks every theorem of the value against.
-/

public section

namespace Translator.Lean

open Falkara

/-- Gives the type of the functors on types that a curried functor gives, a functor from types or
from their opposite into the functors on types, such as `Type u ⥤ Type u ⥤ Type u`, where the type
is the type of one. -/
def curriedTargetOf? (rules : List Translation.Rule) (type : Lean.Expr) : Option Lean.Expr :=
  match type.getAppArgs with
  | #[source, _, target, _] =>
    let fromTypes := match source with
      | .sort _ => true
      | .app (.const opposite _) (.sort _) => Translation.isStructural rules .opposite opposite
      | _ => false
    if isApplicationOf rules .functor type && fromTypes && isFunctorType rules target then
      some target
    else none
  | _ => none

/-- Runs a computation on the object of a curried functor at a type parameter, the functor on types
that the curried functor gives, with the parameter named as the attribute `counterpart` of the
declaration names it or else as the definition of the curried functor names its object, and with
the parameter taken by `Opposite.op` where the curried functor maps the opposite of the types,
given the declaration and the type of the curried functor, or refuses where the definition names no
object. -/
def curriedObjectOf {m : Type → Type} [Monad m] [MonadControlT Lean.MetaM m]
    [MonadLiftT Lean.MetaM m] {α : Type} (rules : List Translation.Rule) (declaration : Lean.Name)
    (functor functorType : Lean.Expr) (computation : Lean.Expr → Lean.Expr → m α) : m α := do
  let (.const _ levels, some source) := (functorType.getAppFn, functorType.getAppArgs[0]?)
    | monadLift (Lean.throwError (Refusal.render (.noFunctorType functorType)) : Lean.MetaM α)
  let objectConstant ← monadLift (structuralConstantOf rules .functorObject)
  let object := Lean.mkAppN (.const objectConstant levels) (functorType.getAppArgs ++ #[functor])
  -- The definition gives the object as a function, whose binder names the object.
  let .lam binder .. ← monadLift (Lean.Meta.whnfD object : Lean.MetaM Lean.Expr)
    | monadLift (Lean.throwError (Refusal.render (.noObject functor)) : Lean.MetaM α)
  let environment ← monadLift (Lean.getEnv : Lean.MetaM Lean.Environment)
  let name := match ExportTypeScript.nameOf? environment declaration binder with
    | some parameter => .mkSimple parameter
    | none => binder
  -- An object of the opposite of the types is a type, which the object of the opposite that it
  -- gives takes into the opposite.
  match source with
  | .app (.const opposite oppositeLevels) type =>
    if Translation.isStructural rules .opposite opposite then
      let toOpposite ← monadLift (structuralConstantOf rules .toOpposite)
      Lean.Meta.withLocalDeclD name type fun parameter ↦
        computation parameter
          (Lean.mkApp object (Lean.mkApp2 (.const toOpposite oppositeLevels) type parameter))
    else
      Lean.Meta.withLocalDeclD name source fun parameter ↦
        computation parameter (Lean.mkApp object parameter)
  | _ =>
    Lean.Meta.withLocalDeclD name source fun parameter ↦
      computation parameter (Lean.mkApp object parameter)

/-- Runs a computation on the fields of the type of the functors on types, with a local functor in
place of the action of the functor on types, named as the attribute `counterpart` names the field
`obj` or else as the field, and the type of every other field that is no proof, as `normalizedOf`
reads it, and the statement of every field that is an axiom, given the type of the functors. -/
def functorFieldsOf {m : Type → Type} [Monad m] [MonadControlT Lean.MetaM m]
    [MonadLiftT Lean.MetaM m] {α : Type} (rules : List Translation.Rule) (functorType : Lean.Expr)
    (computation : Lean.Expr → List (Lean.Name × Lean.Expr) → List (Lean.Name × Lean.Expr) →
      m α) : m α := do
  let .const structureName _ := functorType.getAppFn
    | monadLift (Lean.throwError (Refusal.render (.noFunctorType functorType)) : Lean.MetaM α)
  -- The type lambda stands for the action of the functor on types, the field `obj`.
  let name := Lean.Name.mkSimple (← monadLift (fieldNameOf structureName `obj : Lean.MetaM String))
  Lean.Meta.withLocalDeclD name functorType fun functor ↦ do
    let (fields, axioms) ← monadLift (do
      let names := Lean.getStructureFieldsFlattened (← Lean.getEnv) structureName
        (includeSubobjectFields := false)
      let typed ← names.toList.mapM fun field ↦ do
        return (field, ← Lean.Meta.inferType (← Lean.Meta.mkProjection functor field))
      -- An axiom has no value in a target, and the action on types is the functor itself.
      let axioms ← typed.filterM fun (_, fieldType) ↦ Lean.Meta.isProp fieldType
      let fields ← typed.filterMapM fun (field, fieldType) ↦ do
        if ← Lean.Meta.isProp fieldType then return none
        if let .forallE _ (.sort _) (.sort _) _ := fieldType then return none
        return some (field, ← normalizedOf rules fieldType)
      return (fields, axioms) :
        Lean.MetaM (List (Lean.Name × Lean.Expr) × List (Lean.Name × Lean.Expr)))
    computation functor fields axioms

/-- A kind of declaration of the theory, which a target writes in a form of its own. -/
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
  let rules ← rulesOf
  if Lean.isStructure (← Lean.getEnv) name then
    return if ← isData rules unfoldingDepth name then .dataStructure else .structure
  if let some (base, condition) ← refinementOf name then return .refinement base condition
  parametersOf rules (← Lean.getConstInfo name) fun _ rest value ↦ do
      match rest with
      | .sort _ =>
        if let some value := value then
          if isFunctorType rules value then return .functorClass
          if (← bundledOf value).isSome then return .bundled
        return .type
      | .forallE .. =>
        return if isTypeConstructorType rest && value.isSome then .typeConstructor else .function
      | _ =>
        if isFunctorType rules rest then return .functor
        return if (curriedTargetOf? rules rest).isSome then .curriedFunctor else .value

/-- Gives the declaration that labels a structure, other than a given declaration, where the theory
gives one a counterpart, such as `Coalgebra` for `CategoryTheory.Endofunctor.Coalgebra`. -/
def labelOf? (name structureName : Lean.Name) : Lean.MetaM (Option Lean.Name) := do
  let environment ← Lean.getEnv
  return ((ExportTypeScript.exportsOf environment).map (·.declaration)).find? fun declaration ↦
    declaration != name && ExportTypeScript.labels environment declaration structureName

/-- Gives the class of functors, the declaration whose value is the type of the functors on types,
where the theory gives one a counterpart. -/
def functorClassOf : Lean.MetaM (Option Lean.Name) := do
  let declarations := (ExportTypeScript.exportsOf (← Lean.getEnv)).map (·.declaration)
  declarations.findM? fun name ↦ return (← kindOf name) matches .functorClass

/-- Gives the arguments of an application at the type parameters of its function, the binders over
a type or over a functor on types, leaving out every category and its instance, such as `F` and `G`
of `Functor.comp (Type u) _ (Type u) _ (Type u) _ F G`. -/
def typeArgumentsOf (rules : List Translation.Rule) (function : Lean.Expr)
    (arguments : List Lean.Expr) : Lean.MetaM (List Lean.Expr) := do
  loop (← Lean.Meta.inferType function) arguments
where
  /-- Takes the binders of the type of the function and the arguments one at a time. -/
  loop (type : Lean.Expr) : List Lean.Expr → Lean.MetaM (List Lean.Expr)
    | [] => return []
    | argument :: rest => do
      let .forallE _ domain body binderInfo ← Lean.Meta.whnf type | return []
      let next := body.instantiate1 argument
      -- A category is a binder over a type that the next binder, an instance of the class of the
      -- categories, takes.
      let isCategory := domain.isSort && match next with
        | .forallE _ (.app (.const categoryClass _) category) _ .instImplicit =>
          Translation.isStructural rules .category categoryClass && category == argument
        | _ => false
      let kept ← loop next rest
      return if !isCategory && binderInfo != .instImplicit && isParameterType rules domain then
          argument :: kept
        else kept

/-- Runs a computation on a function type of the theory whose parameters include bundled
structures, with a type parameter in place of every field whose value is a type of every such
parameter, named as the attribute `counterpart` names the field, and after its binder as well
where several parameters bundle types, such as `FirstState`, and the function type with the
type of every such parameter applied to its type parameters, as a target writes it, and every
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
          let .fvar binderId := binder | Lean.throwError (Refusal.render (.noBinder binder))
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

/-- Gives the type parameters of a declaration in the order a target takes them, every parameter
without a default value first, then the parameters that follow them, such as the state space of a
kind of system, and then every parameter with a default value, as a target takes a type parameter
with a default value after every other one. -/
def orderedOf (parameters following : List Lean.Expr) : Lean.MetaM (List Lean.Expr) := do
  let defaulted ← parameters.filterM fun parameter ↦ return (← defaultOf? parameter).isSome
  return parameters.filter (!defaulted.contains ·) ++ following ++ defaulted

/-- Gives the tree of the type parameter that a binder binds, by its name, its kind, and the tree of
its default value, where it takes one. -/
def typeParameterOf (context : Reify.Context) (parameter : Lean.Expr) :
    Lean.MetaM (Core.TypeParameter Tree) := do
  let type ← Lean.Meta.inferType parameter
  let default ← (← defaultOf? parameter).mapM fun default ↦ reify context (fuelOf default) default
  return {
    name := ← binderNameOf parameter
    kind := if isFunctorType context.rules type.cleanupAnnotations then .functor
      else if isTypeConstructorType type then .constructor
      else .type
    default }

/-- Gives the tree of a functor on types at the position of a type lambda: a functor that is a
parameter, an object of a curried functor that the theory gives a counterpart, the functor of a type
constructor as the type constructor, and an application of a functor that the theory gives a
counterpart to its type arguments, or refuses where the fuel runs out. -/
def reifyFunctor (context : Reify.Context) : Nat → Lean.Expr → Lean.MetaM Tree
  | 0, functor => Lean.throwError (Refusal.render (.fuel functor))
  | fuel + 1, functor => do
    let environment ← Lean.getEnv
    let rules := context.rules
    match functor.getAppFn, functor.getAppArgs with
    | .fvar _, #[] => reify context fuel functor
    | .const name _, arguments =>
      if let #[_, _, _, _, curried, object] := arguments then
        if Translation.isStructural rules .functorObject name then
          let .const curriedName _ := curried.getAppFn | return .other functor
          unless ExportTypeScript.isExported environment curriedName do
            return .constant curriedName [] functor
          -- An object of the opposite of the types is a type that the object of the opposite
          -- takes into the opposite.
          let object := match object with
            | .app (.app (.const toOpposite _) _) inner =>
              if Translation.isStructural rules .toOpposite toOpposite then inner else object
            | object => object
          return .declared (← declarationReferenceOf context.packageNamespace curriedName) false
            [.mk (← reify context fuel object) false .required []] functor
      if Translation.isStructural rules .typeFunctor name then
        -- The functor of a type constructor takes the type lambda of the type constructor.
        let some constructor := arguments[0]? | return .other functor
        return ← reify context fuel constructor
      unless ExportTypeScript.isExported environment name do
        return .constant name [] functor
      let typed ← (← typeArgumentsOf rules functor.getAppFn arguments.toList).mapM
        fun argument ↦ do
          let argumentType ← Lean.Meta.inferType argument
          if isFunctorType rules argumentType then
            return DeclaredArgument.mk (← reifyFunctor context fuel argument) true .required []
          return .mk (← reify context fuel argument) (isTypeConstructorType argumentType)
            .required []
      return .declared (← declarationReferenceOf context.packageNamespace name) false typed functor
    | _, _ => return .other functor

/-- Gives the tree of a morphism of an axiom of a functor: a variable by its name, an identity, a
composite, and the action of the functor on a morphism, or refuses with the reason where the
morphism has none or the fuel runs out. -/
def morphismOf (context : Reify.Context) (functor : Lean.Expr) :
    Nat → Lean.Expr → Lean.MetaM (Core.Morphism Tree)
  | 0, morphism => Lean.throwError (Refusal.render (.fuel morphism))
  | fuel + 1, morphism => do
    let rules := context.rules
    match morphism.getAppFn, morphism.getAppArgs with
    | .fvar parameter, #[] => return .parameter (← parameter.getUserName).toString
    | .const name _, #[_, _, object] =>
      unless Translation.isStructural rules .identityMorphism name do
        Lean.throwError (Refusal.render (.noMorphism morphism))
      return .identity (← reify context (fuelOf object) (← normalizedOf rules object))
    | .const name _, #[_, _, _, _, _, first, second] =>
      unless Translation.isStructural rules .composition name do
        Lean.throwError (Refusal.render (.noMorphism morphism))
      return .compose (← morphismOf context functor fuel first)
        (← morphismOf context functor fuel second)
    | .const name _, #[_, _, _, _, mapped, domain, codomain, inner] =>
      unless Translation.isStructural rules .functorMap name && mapped == functor do
        Lean.throwError (Refusal.render (.noMorphism morphism))
      return .map (← reify context (fuelOf domain) domain)
        (← reify context (fuelOf codomain) codomain) (← morphismOf context functor fuel inner)
    | _, _ => Lean.throwError (Refusal.render (.noMorphism morphism))

/-- Gives the tree of a law of a class of functors from the statement of an axiom, an equality of
two morphisms under its variables, the types as type variables and every other variable as a
parameter, with the object of the functor at which the law compares two values, or refuses with
the reason where the statement is no such equality. -/
def lawOf (context : Reify.Context) (structureName : Lean.Name) (functor : Lean.Expr)
    (field : Lean.Name) (statement : Lean.Expr) : Lean.MetaM (Core.Law Tree) := do
  let environment ← Lean.getEnv
  let documentation ← match Source.fieldCommentOf environment structureName field with
    | .ok documentation => pure documentation
    | .error refusal => Lean.throwError refusal.render
  let name ← fieldNameOf structureName field
  loop documentation name statement.getForallArity statement [] []
where
  /-- Takes the variables of the axiom one at a time, with at most as many steps as the axiom has
  variables. -/
  loop (documentation : Core.Documentation) (name : String) (remaining : Nat)
      (statement : Lean.Expr) (typeParameters : List String)
      (parameters : List (String × Tree)) : Lean.MetaM (Core.Law Tree) := do
    match remaining, statement with
    | remaining + 1, .forallE binder domain body binderInfo =>
      Lean.Meta.withLocalDecl binder binderInfo domain fun bound ↦ do
        if domain.isSort then
          loop documentation name remaining (body.instantiate1 bound)
            (typeParameters ++ [binder.toString]) parameters
        else
          let normalized ← normalizedOf context.rules domain
          loop documentation name remaining (body.instantiate1 bound) typeParameters
            (parameters ++ [(binder.toString, ← reify context (fuelOf normalized) normalized)])
    | _, _ =>
      let .app (.app (.app (.const ``Eq _) morphismType) left) right := statement
        | Lean.throwError (Refusal.render (.noEquality statement))
      let #[_, _, source, target] := morphismType.getAppArgs
        | Lean.throwError (Refusal.render (.noMorphismEquality statement))
      -- Two morphisms are equal where they give one value at every value of their source.
      let equivalence ←
        match ← parameterObjectOf context.rules (← normalizedOf context.rules target) with
        | some (_, object) => some <$> reify context (fuelOf object) object
        | none => pure none
      let normalizedSource ← normalizedOf context.rules source
      return {
        name
        documentation
        typeParameters
        parameters
        domain := ← reify context (fuelOf normalizedSource) normalizedSource
        equivalence
        left := ← morphismOf context functor unfoldingDepth left
        right := ← morphismOf context functor unfoldingDepth right }

/-- Gives the documentation that a reading of the records gives, or refuses with its reason. -/
def documentationOf (reading : Except Refusal Core.Documentation) :
    Lean.MetaM Core.Documentation := do
  match reading with
  | .ok documentation => return documentation
  | .error refusal => Lean.throwError refusal.render

/-- Gives the record of the structure that the object of a curried functor gives, where the
declaration of the functor names its fields and the attribute `counterpart` gives the structure a
clause, with the name of the clause, its documentation, a type parameter for every argument of the
structure, named after the field whose type it is, its fields, and the trees of its arguments, or
refuses with the reason where a field takes no argument of the structure as its type or a comment
is missing. -/
def curriedRecordOf (context : Reify.Context) (name : Lean.Name) (object : Lean.Expr) :
    Lean.MetaM (Option (Core.Record Tree)) := do
  let environment ← Lean.getEnv
  let some record ← recordOf? context.rules object | return none
  let structureName := record.structureName
  let declaration := record.declaration
  let some clause := ExportTypeScript.clauseOf? environment declaration structureName
    | return none
  -- Every argument of the structure takes the name of the field whose type it is.
  let parameterNames := record.arguments.toList.map fun argument ↦
    (record.fields.find? (·.2.2 == argument)).map (·.2.1.capitalize)
  unless parameterNames.all Option.isSome do
    Lean.throwError (Refusal.render (.unnamedFieldType name structureName))
  let fields ← record.fields.mapM fun (field, fieldName, fieldType) ↦ do
    let some comment := (ExportTypeScript.clauseOf? environment declaration field).bind (·.comment)
      | Lean.throwError (Refusal.render (.noClauseFieldComment field structureName declaration))
    let documentation ← documentationOf (Source.documentationOf environment comment
      (Citation.citationOf? environment (structureName ++ field)).toList)
    let parameter := (record.arguments.toList.zip parameterNames).findSome? fun
      (argument, parameterName) ↦ if argument == fieldType then parameterName else none
    return (fieldName, documentation, parameter.getD "")
  let some comment := clause.comment
    | Lean.throwError (Refusal.render (.noClauseComment structureName declaration))
  let documentation ← documentationOf (Source.documentationOf environment comment
    (Citation.citationOf? environment structureName).toList)
  let arguments ← record.arguments.toList.mapM fun argument ↦
    reify context (fuelOf argument) argument
  return some {
    name := clause.name
    documentation
    parameters := parameterNames.filterMap id
    fields
    arguments }

/-- Gives the trees of the declarations of the core that a declaration of the theory takes, where
the theory gives it a counterpart: the declaration, and the instance of the class of functors that
a functor, a curried functor, or a type constructor takes, or refuses with the reason where the
declaration has none. -/
def reifyDeclaration (packageNamespace name : Lean.Name) :
    Lean.MetaM (List (Core.Declaration Tree Tree Tree)) := do
  let environment ← Lean.getEnv
  unless ExportTypeScript.isExported environment name do
    Lean.throwError (Refusal.render (.notExported name))
  let reference ← declarationReferenceOf packageNamespace name
  let rules ← rulesOf
  let context : Reify.Context := { rules, packageNamespace, target := none }
  let comment := fun () ↦ documentationOf (Source.commentOf environment name)
  let derived := fun (role : ExportTypeScript.Derived) ↦
    documentationOf (Source.derivedCommentOf environment name role)
  -- A functor takes an instance of the class of functors, which the theory must give.
  let instanceOf := fun (typeParameters : List (Core.TypeParameter Tree)) ↦ do
    if (← functorClassOf).isNone then Lean.throwError (Refusal.render (.noInstanceClass name))
    return Core.Declaration.instance reference (← derived .instance) typeParameters
  let kind ← kindOf name
  parametersOf rules (← Lean.getConstInfo name) fun parameters rest value? ↦ do
    let typeParameters ← parameters.toList.mapM (typeParameterOf context)
    let fieldsOf := fun (structureName : Lean.Name) (fields : List (Lean.Name × Lean.Expr)) ↦
      fields.mapM fun (field, fieldType) ↦ do
        return {
          name := ← fieldNameOf structureName field
          documentation := ← documentationOf (Source.fieldCommentOf environment structureName field)
          type := ← reify context (fuelOf fieldType) fieldType : Core.Field Tree }
    match kind with
    | .dataStructure =>
      let fields ← fieldsOf name (← fieldTypesOf name parameters)
      return [.data reference (← comment ()) (← derived .schema) (← derived .constructor) fields]
    | .structure =>
      let fields ← fieldsOf name (← fieldTypesOf name parameters)
      return [.structure reference (← comment ()) (← derived .constructor) typeParameters fields]
    | .refinement base condition =>
      return [.refinement reference (← comment ()) (← derived .schema)
        (← reify context (fuelOf base) base)
        (← declarationReferenceOf packageNamespace condition)]
    | .bundled =>
      let some value := value? | Lean.throwError (Refusal.render (.valuelessType name))
      let .const structureName _ := value.getAppFn
        | Lean.throwError (Refusal.render (.appliesNoStructure name))
      bundledFieldsOf rules value fun bundledParameters fields ↦ do
        -- A parameter with a default value, such as the monad of a kind of system, follows the
        -- type parameters of the fields, as a target requires.
        let ordered ← (← orderedOf parameters.toList bundledParameters).mapM
          (typeParameterOf context)
        -- The constructor takes an instance of every functor without a default value, which the
        -- class of functors gives.
        if ordered.any (fun parameter ↦ parameter.kind == .functor && parameter.default.isNone) &&
            (← functorClassOf).isNone then
          Lean.throwError (Refusal.render (.noConstructorClass name))
        -- A functor that a target names nowhere, such as the identity functor, leaves the fields
        -- of the structure unfolded, so the extension is an attempt, which a failure leaves out.
        let extended ← match ← labelOf? name structureName with
          | some label => try
              let arguments ←
                (← typeArgumentsOf rules value.getAppFn value.getAppArgs.toList).mapM
                fun argument ↦ do
                  let argumentType ← Lean.Meta.inferType argument
                  if isFunctorType rules argumentType then
                    return DeclaredArgument.mk (← reifyFunctor context unfoldingDepth argument) true
                      .required []
                  return .mk (← reify context (fuelOf argument) argument)
                    (isTypeConstructorType argumentType) .required []
              let bundled ← bundledParameters.mapM fun parameter ↦ do
                return DeclaredArgument.mk (← reify context (fuelOf parameter) parameter) false
                  .required []
              pure (some (Tree.declared (← declarationReferenceOf packageNamespace label) false
                (arguments ++ bundled) value))
            catch _ => pure none
          | none => pure none
        return [.bundle reference (← comment ()) (← derived .constructor) ordered extended
          (← fieldsOf structureName fields)]
    | .functor =>
      let some value := value? | Lean.throwError (Refusal.render (.valuelessFunctor name))
      lambdaObjectOf rules value rest fun target object ↦ do
        let object ← reify { context with target := target.fvarId? } (fuelOf object) object
        return [.lambda reference (← comment ()) typeParameters object,
          ← instanceOf typeParameters]
    | .typeConstructor =>
      let some value := value? | Lean.throwError (Refusal.render (.valuelessTypeConstructor name))
      let .forallE _ domain _ _ := rest | Lean.throwError (Refusal.render (.noTypeConstructor name))
      -- The type constructor takes a type lambda whose type applies it to the object of the
      -- lambda, as a functor does.
      Lean.Meta.withLocalDeclD `target domain fun target ↦ do
        let object := Lean.mkApp value target
        let object ← reify { context with target := target.fvarId? } (fuelOf object) object
        return [.lambda reference (← comment ()) typeParameters object,
          ← instanceOf typeParameters]
    | .functorClass =>
      let some value := value? | Lean.throwError (Refusal.render (.valuelessType name))
      let .const structureName _ := value.getAppFn
        | Lean.throwError (Refusal.render (.appliesNoStructure name))
      functorFieldsOf rules value fun functor fields axioms ↦ do
        let laws ← axioms.mapM fun (field, statement) ↦
          lawOf context structureName functor field statement
        return [.functorClass reference (← comment ()) (← derived .constructor) (← derived .axioms)
          (← binderNameOf functor) (← fieldsOf structureName fields) laws]
    | .curriedFunctor =>
      let some value := value? | Lean.throwError (Refusal.render (.valuelessFunctor name))
      let some targetType := curriedTargetOf? rules rest
        | Lean.throwError (Refusal.render (.noCurriedFunctor name))
      -- The object of the curried functor takes a type parameter after those of the declaration.
      curriedObjectOf rules name value rest fun parameter functor ↦
        lambdaObjectOf rules functor targetType fun target object ↦ do
          let objectContext := { context with target := target.fvarId? }
          let record ← curriedRecordOf objectContext name object
          let objectParameter ← typeParameterOf context parameter
          return [.curried reference (← comment ()) typeParameters objectParameter.name
              (← reify objectContext (fuelOf object) object) record,
            ← instanceOf (typeParameters ++ [objectParameter])]
    | .type =>
      let some value := value? | Lean.throwError (Refusal.render (.valuelessType name))
      return [.alias reference (← comment ()) typeParameters (← reify context (fuelOf value) value)]
    | .function =>
      -- A bundled structure among the parameters gives the function a type parameter for every
      -- field whose value is a type, such as `State` of a coalgebra.
      unbundledOf rest value? fun bundledParameters unbundled ↦ do
        let unbundled ← normalizedOf rules unbundled
        return [.function reference (← comment ()) (typeParameters.map (·.name))
          (← bundledParameters.mapM binderNameOf) (← reify context (fuelOf unbundled) unbundled)]
    | .value =>
      unless parameters.isEmpty do Lean.throwError (Refusal.render (.parametricValue name))
      -- The value is evaluated apart from the reading, by the kernel of Lean alone.
      let value ← match Evaluate.valueOf environment packageNamespace name unfoldingDepth rest
          (Lean.mkConst name) with
        | .ok value => pure value
        | .error refusal => Lean.throwError refusal.render
      return [.value reference (← comment ()) (← reify context (fuelOf rest) rest) value]

/-- Gives the trees of a module of the core that a module of the theory takes: the declarations of
the module that the theory gives a counterpart, in the order of their lines, and the class of
functors, where the theory gives one a counterpart. -/
def reifyModule (packageNamespace module : Lean.Name) :
    Lean.MetaM (Core.Module Tree Tree Tree) := do
  let source := Source.moduleOf (← Lean.getEnv) module
  return {
    module
    declarations := ← source.declarations.flatMapM (reifyDeclaration packageNamespace)
    functorClass := ← (← functorClassOf).mapM (declarationReferenceOf packageNamespace) }

end Translator.Lean
