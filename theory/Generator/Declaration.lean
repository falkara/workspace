/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Generator.Import

import Generator.Comment
import Generator.Name
import Generator.Type

/-!
# Declaration

The module defines the declaration of TypeScript that a declaration of the theory marked
`export_typescript` takes. A structure takes a schema of Effect branded by its name, with a field
for every field of the structure, as
`Schema.Struct({ X: Schema.Rational, … }).pipe(Schema.brand('Tristimulus'))`, and a type of the
same name for what the schema decodes, and a constructor, which brands a value as a caller writes
it, named `make` where the structure takes the name of its module, as Effect names a constructor,
such as `Tristimulus.make`, and in camel case otherwise. Every name drops the name of its module,
as a module of TypeScript is imported as a namespace, such as `behavior` for
`StreamCoalgebra.behavior`. A structure that takes type parameters,
or whose field takes no schema, such as a function, takes an interface in place of the schema, with
a field for every field of the structure and a type parameter for every type parameter, annotated
with its variance, such as `interface Machine<in out State, in Input, out Output>`, and a
constructor that gives a value as a caller writes it. A bundled structure, a type that applies a
structure of Mathlib with a field whose value is a type, such as
`Endofunctor.Coalgebra F`, takes the same interface and constructor, with a type parameter in
place of every field whose value is a type, named as the attribute `export_typescript` names it,
and a functor that is a parameter constrained to a type lambda of Effect, such as
`interface Coalgebra<out Endofunctor extends HKT.TypeLambda, in out State>` with
`readonly structure: (state: State) => HKT.Kind<Endofunctor, never, never, never, State>`, each
named as the attribute `export_typescript` names it. Its constructor takes every type parameter in
one call, such as `Coalgebra.make<Option.OptionTypeLambda, Board>({ structure })`, as TypeScript
infers no type lambda from the fields, so a caller gives the type arguments either way. A
bundled structure that applies a structure that the theory labels to functors that TypeScript names
extends the label at their type lambdas, as its value states it, and restates its fields unfolded,
so that the names of its own type parameters name what the functors leave unnamed, such as
`interface StreamCoalgebra<out Output, in out State> extends Coalgebra<BinaryProductFunctor<Output>,
State>` with `readonly structure: (state: State) => readonly [output: Output, state: State]`, which
TypeScript checks against the field of the label. A type constructor that a bundled structure
takes as a parameter with a default value, such as the monad `m := Id` of a kind of system, takes a
type parameter constrained to a type lambda after the type parameters of the fields, with the type
lambda of the identity functor as the default of the identity monad, as
`interface StreamCoalgebra<…, State, out Monad extends HKT.TypeLambda = Functor.Id>`, and the
constructor leaves it at its default, as TypeScript infers no type through a type lambda that a
parameter applies. A type constructor takes a type lambda with its value at the object of the
lambda as its type, such as `Effect.Effect<this['Target'], E, R>` for `ReaderT R (Except E)`, and
an instance of the class of functors, as a functor does. A functor on types takes
an interface that extends the type lambda of Effect, with the object of the functor at the object
of the lambda as its type, and a curried functor, a functor from types into the functors on types,
takes the same interface with a type parameter for the type it maps, named as the attribute
`export_typescript` names it or else as its definition names it, such as
`interface BinaryProductFunctor<out Factor> extends HKT.TypeLambda` with
`readonly type: readonly [Factor, this['Target']]`. The type of the functors on types takes an
interface that extends the type class of Effect with a type parameter for the action of the functor
on types, a field for every field that is no proof, a constructor, and the predicates of its
axioms, a function of an instance and of an equivalence of the values of the functor, such as
`interface Functor<in out Endofunctor extends HKT.TypeLambda>` with its field `map`
and `axioms` with the predicates `map_id` and `map_comp`.
A refinement takes the schema of its type with a
filter that calls its condition and the brand of its name, as
`Schema.String.pipe(Schema.check(Schema.makeFilter(isSegment)), Schema.brand('Segment'))`, and a
type of the same name for what the schema decodes. A type takes a type alias with a type parameter
for every type parameter of the type, annotated with its variance. A function takes a type of its
signature, with a type parameter for every implicit type parameter of the function. A function that
takes a stream passes on the failure and the requirements of the streams it takes, the type
parameters `E` and `R` of `Stream.Stream<A, E, R>`, to the streams it gives, as `Stream.map` of
Effect does, and the stream of the theory is the one with neither. A function whose last parameter
is a stream takes as well the signature without it, which gives a function of the stream, so that a
stream pipes into the function, as `moves.pipe(MealyMachine.behavior(play, board))`. Otherwise, an
operation on a type, a function of two or more parameters whose first parameter has the type of its
result or another type of the same declaration, takes as well the signature without its first
parameter, as `Function.dual` of Effect gives it, such as `pipe(color, Tristimulus.add(light))`,
whose function takes the type parameters that the first parameter alone names, as Effect takes
them. A function whose result is a bundled structure gives the result the types that its
definition gives the fields, such as the pair of the state spaces of two machines in series, and
several bundled parameters name their type parameters after themselves, such as `FirstState`. A
value takes a
constant of its type that holds the value as the kernel of Lean reduces it, a rational number as
`Rational.fromBigInt(1n)` or `Rational.makeUnsafe(1n, 2n)` and a structure of its module as its
constructor with a value for every field, such as `make({ X: …, Y: …, Z: … })`. Every
declaration and every field takes the documentation comment that the module `Comment` gives it, the
schema of a structure opening with "A schema of", and every function that the generator derives
from a declaration says what it does with the names of TypeScript, such as
``Brands a `Tristimulus` from its fields `X`, `Y`, and `Z` without a check.``,
``Creates a `StreamCoalgebra` from its field `structure`, taking its types from the annotations of
the parameters of the field or else from the type arguments.``,
``Gives the axioms of a `Functor` as predicates of an instance.``, and
``Gives the `Functor` instance of a `BinaryProductFunctor`.``. Every other declaration has no
declaration of TypeScript, and the generator refuses it.

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
- `morphismOf`: gives the expression of TypeScript that a morphism of an axiom of a functor takes,
  an identity as `Function.identity`, a composite as `Function.flow`, and the action of the functor
  on a morphism as `instance.map`.
- `axiomOf`: gives the predicate of TypeScript that an axiom of a functor takes, an equality of two
  morphisms, as a function of the variables of the axiom and of a value of the source of the
  morphisms that tells by `equivalence` whether the two morphisms give one value.
- `functorClassOf`: gives the class of functors that the theory marks `export_typescript`, where the
  theory marks one.
- `instanceCommentOf`: gives the documentation comment of TypeScript of the instance of the class of
  functors that a functor or a curried functor of the theory takes.
- `instanceNameOf`: gives the name of the instance of the class of functors that a functor or a
  curried functor of the theory takes, such as `functor` for `BinaryProductFunctor` and `comp` for
  `Functor.comp`.
- `instanceTypeOf`: gives the type of TypeScript of the instance of the class of functors that a
  functor or a curried functor of the theory takes, a function of the type parameters of the
  functor and of an instance of every functor among them that gives the instance.
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

A declaration takes the name that the module `Name` gives it, such as `OfTristimulus` and
`ofTristimulus` for `Chromaticity.ofTristimulus` in the module `Chromaticity`, as every module of
the generator names the declaration.

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
    unless ExportTypeScript.isExported environment structureName &&
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
      return s!"{← fieldNameOf structureName field}: \
        {← initializerOf moduleNamespace name value}"
    return s!"{← constructorNameOf moduleNamespace structureName}\
      (\{ {", ".intercalate written} })"

/-- Gives the expression of TypeScript that a morphism of an axiom of a functor takes: a variable by
its name, an identity as `Function.identity`, a composite as `Function.flow`, and the action of the
functor on a morphism as `instance.map`, each with its types, or fails with the reason where the
morphism has none. -/
partial def morphismOf (moduleNamespace : Lean.Name) (functor morphism : Lean.Expr) :
    TypeScriptM String := do
  -- The generator imports no Mathlib, so the names of Mathlib are written as names alone.
  if let .fvar parameter := morphism then return (← parameter.getUserName).toString
  if morphism.isAppOfArity `CategoryTheory.CategoryStruct.id 3 then
    return s!"{← effectNameOf "Function" "identity" .value}\
      <{← typeOf moduleNamespace (← normalizedOf (morphism.getArg! 2))}>"
  if morphism.isAppOfArity `CategoryTheory.CategoryStruct.comp 7 then
    return s!"{← effectNameOf "Function" "flow" .value}\
      ({← morphismOf moduleNamespace functor (morphism.getArg! 5)}, \
      {← morphismOf moduleNamespace functor (morphism.getArg! 6)})"
  if morphism.isAppOfArity `CategoryTheory.Functor.map 8 && morphism.getArg! 4 == functor then
    return s!"instance.map<{← typeOf moduleNamespace (morphism.getArg! 5)}, \
      {← typeOf moduleNamespace (morphism.getArg! 6)}>\
      ({← morphismOf moduleNamespace functor (morphism.getArg! 7)})"
  Lean.throwError m!"`{morphism}` has no expression in TypeScript."

/-- Gives the predicate of TypeScript that an axiom of a functor takes, an equality of two
morphisms, as a function of the variables of the axiom and of a value of the source of the
morphisms that tells by `equivalence` whether the two morphisms give one value, or fails with the
reason where the axiom has none. -/
def axiomOf (moduleNamespace : Lean.Name) (functor statement : Lean.Expr) : TypeScriptM String :=
  loop statement.getForallArity statement [] []
where
  /-- Takes the variables of the axiom one at a time, the types as type parameters and every other
  variable as a parameter, with at most as many steps as the axiom has variables. -/
  loop (remaining : Nat) (statement : Lean.Expr) (generics parameters : List String) :
      TypeScriptM String := do
    match remaining, statement with
    | remaining + 1, .forallE name domain body binderInfo =>
      Lean.Meta.withLocalDecl name binderInfo domain fun bound ↦ do
        if domain.isSort then
          loop remaining (body.instantiate1 bound) (generics ++ [name.toString]) parameters
        else
          loop remaining (body.instantiate1 bound) generics
            (parameters ++ [s!"{name}: {← typeOf moduleNamespace (← normalizedOf domain)}"])
    | _, _ =>
      let .app (.app (.app (.const ``Eq _) morphismType) left) right := statement
        | Lean.throwError m!"`{statement}` has no predicate in TypeScript, as it is no equality."
      let #[_, _, source, target] := morphismType.getAppArgs
        | Lean.throwError m!"`{statement}` has no predicate in TypeScript, as it equates no \
            morphisms."
      -- Two morphisms are equal where they give one value at every value of their source.
      let equivalenceArgument ← match ← parameterObjectOf (← normalizedOf target) with
        | some (_, object) => pure s!"<{← typeOf moduleNamespace object}>"
        | none => pure ""
      let allParameters := parameters ++
        [s!"value: {← typeOf moduleNamespace (← normalizedOf source)}"]
      return s!"<{", ".intercalate generics}>({", ".intercalate allParameters}): boolean => \
        equivalence{equivalenceArgument}(({← morphismOf moduleNamespace functor left})(value), \
        ({← morphismOf moduleNamespace functor right})(value))"

/-- Gives the class of functors that the theory marks `export_typescript`, the declaration whose
value is the type of the functors on types, where the theory marks one. -/
def functorClassOf : Lean.MetaM (Option Lean.Name) := do
  let declarations := (ExportTypeScript.exportsOf (← Lean.getEnv)).map (·.declaration)
  declarations.findM? fun name ↦ return (← kindOf name) matches .functorClass

/-- Gives the documentation comment of TypeScript of the instance of the class of functors that a
functor or a curried functor of the theory takes, such as
``Gives the `Functor` instance of a `BinaryProductFunctor`.``, or fails with the reason where the
theory marks no class of functors. -/
def instanceCommentOf (moduleNamespace name : Lean.Name) : Lean.MetaM String := do
  let some functorClass ← functorClassOf
    | Lean.throwError m!"`{name}` has no instance in TypeScript, as the theory marks no class of \
        functors `export_typescript`."
  derivedCommentOf name s!"Gives the `{← displayNameOf moduleNamespace functorClass}` \
    instance of {articledOf (← displayNameOf moduleNamespace name)}."

/-- Gives the name of the instance of the class of functors that a functor or a curried functor of
the theory takes in TypeScript: the name of the class in camel case where the functor takes the
name of its module, such as `BinaryProductFunctor.functor`, and the name of the functor in camel
case otherwise, such as `Functor.comp`, or fails with the reason where the theory marks no class of
functors. -/
def instanceNameOf (moduleNamespace name : Lean.Name) : Lean.MetaM String := do
  let some functorClass ← functorClassOf
    | Lean.throwError m!"`{name}` has no instance in TypeScript, as the theory marks no class of \
        functors `export_typescript`."
  match localWordsOf moduleNamespace (← moduleOf name) name with
  | [] => return (← typeNameOf moduleNamespace functorClass).decapitalize
  | words => return camelCaseOf words

/-- Gives the type of TypeScript of the instance of the class of functors that a functor or a
curried functor of the theory takes, a function of the type parameters of the functor and of an
instance for every functor among them that gives the instance, or fails with the reason where the
theory marks no class of functors. -/
def instanceTypeOf (moduleNamespace name : Lean.Name) : TypeScriptM String := do
  let some functorClass ← functorClassOf
    | Lean.throwError m!"`{name}` has no instance in TypeScript, as the theory marks no class of \
        functors `export_typescript`."
  let className ← referenceOf functorClass (← typeNameOf moduleNamespace functorClass)
  let typeName ← typeNameOf moduleNamespace name
  let kind ← kindOf name
  parametersOf (← Lean.getConstInfo name) fun parameters rest value? ↦ do
    -- The instance takes the type parameters of the functor, and the object of a curried functor
    -- after them, and an instance of every functor among them, such as the functors of a
    -- composite, whose action on morphisms the instance applies, named as the functor in camel
    -- case, as TypeScript names a value.
    let written := fun (all : List Lean.Expr) ↦ do
      let names ← all.mapM fun parameter ↦ return (← parameter.fvarId!.getUserName).toString
      let generics ← (all.zip names).mapM fun (parameter, parameterName) ↦
        genericOf moduleNamespace parameter parameterName
      let instances ← (all.zip names).filterMapM fun (parameter, parameterName) ↦ do
        if isFunctorType (← parameter.fvarId!.getType) then
          return some s!"{parameterName.decapitalize}: {className}<{parameterName}>"
        return none
      let arguments := if names.isEmpty then "" else s!"<{", ".intercalate names}>"
      let declared := if names.isEmpty then "" else s!"<{", ".intercalate generics}>"
      return s!"{declared}({", ".intercalate instances}) => {className}<{typeName}{arguments}>"
    if kind matches .curriedFunctor then
      let some value := value?
        | Lean.throwError m!"`{name}` has no instance in TypeScript, as the theory gives the \
            functor no value."
      curriedObjectOf name value rest fun parameter _ ↦
        written (parameters.toList ++ [parameter])
    else written parameters.toList

/-- Gives the interface of TypeScript that a bundled structure extends, the declaration marked
`export_typescript` that labels its structure at the type lambdas of the functors that its value
applies the structure to and at the type parameters of its fields, such as
`Coalgebra<BinaryProductFunctor<Output>, State>` for a stream coalgebra, where the theory labels the
structure and TypeScript names every functor, and none otherwise. -/
def extendedOf? (moduleNamespace name : Lean.Name) (value : Lean.Expr)
    (bundledParameters : List Lean.Expr) : TypeScriptM (Option String) := do
  let .const structureName _ := value.getAppFn | return none
  let some label ← labelOf? name structureName | return none
  let saved ← get
  try
    let written ← (← typeArgumentsOf value.getAppFn value.getAppArgs.toList).mapM fun argument ↦ do
      let argumentType ← Lean.Meta.inferType argument
      if isFunctorType argumentType then typeLambdaOf moduleNamespace argument
      else if isTypeConstructorType argumentType then typeConstructorOf moduleNamespace argument
      else typeOf moduleNamespace argument
    let names ← bundledParameters.mapM fun parameter ↦
      return (← parameter.fvarId!.getUserName).toString
    return some s!"{← referenceOf label (← typeNameOf moduleNamespace label)}<\
      {", ".intercalate (written ++ names)}>"
  catch _ =>
    -- A functor that TypeScript names nowhere, such as the identity functor, leaves the fields of
    -- the structure unfolded, and the imports that the attempt recorded are dropped.
    set saved
    return none

/-- Gives the declaration of TypeScript that a declaration of the theory marked `export_typescript`
takes, named without the namespace of its module, or fails with the reason where the declaration
has none. -/
def declarationOf (moduleNamespace name : Lean.Name) : TypeScriptM String := do
  let environment ← Lean.getEnv
  unless ExportTypeScript.isExported environment name do
    Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory never marks it \
      `export_typescript`."
  let typeName ← typeNameOf moduleNamespace name
  let valueName ← valueNameOf moduleNamespace name
  let constructorName ← constructorNameOf moduleNamespace name
  -- A comment names the declaration after its module where its name drops the module.
  let displayName ← displayNameOf moduleNamespace name
  parametersOf (← Lean.getConstInfo name) fun parameters rest value? ↦ do
    let names ← parameters.toList.mapM fun parameter ↦
      return (← parameter.fvarId!.getUserName).toString
    let arguments := if names.isEmpty then "" else s!"<{", ".intercalate names}>"
    let variances ← variancesOf name
    let annotated ← ((parameters.toList.zip names).zip variances).mapM
      fun ((parameter, parameterName), polarities) ↦
        genericOf moduleNamespace parameter (annotationOf parameterName polarities)
    let generics := if names.isEmpty then "" else s!"<{", ".intercalate annotated}>"
    match ← kindOf name with
    | .dataStructure =>
      let fieldTypes ← fieldTypesOf name parameters
      let fields ← fieldTypes.mapM fun (field, fieldType) ↦ do
        return s!"{← fieldCommentOf name field}{← fieldNameOf name field}: \
          {← schemaOf moduleNamespace fieldType},\n"
      let fieldNames ← fieldTypes.mapM fun (field, _) ↦ fieldNameOf name field
      return s!"{← commentOf name (some "A schema of")}export const {typeName} = \
          {← effectNameOf "Schema" "Struct" .value}(\{\n{String.join fields}}).pipe(\
          {← effectNameOf "Schema" "brand" .value}('{typeName}'));\n\n" ++
        s!"{← commentOf name}export type {typeName} = typeof {typeName}.Type;\n\n" ++
        s!"{← derivedCommentOf name s!"Brands {articledOf displayName} from its \
            {fieldsOf fieldNames} without a check."}export const \
          {constructorName} = {← effectNameOf "Brand" "nominal" .value}<{typeName}>();\n"
    | .structure =>
      let fieldTypes ← fieldTypesOf name parameters
      let fields ← fieldTypes.mapM fun (field, fieldType) ↦ do
        return s!"{← fieldCommentOf name field}readonly {← fieldNameOf name field}: \
          {← typeOf moduleNamespace fieldType};\n"
      let fieldNames ← fieldTypes.mapM fun (field, _) ↦ fieldNameOf name field
      return s!"{← commentOf name}export interface {typeName}{generics} \
          \{\n{String.join fields}}\n\n" ++
        s!"{← derivedCommentOf name s!"Creates {articledOf displayName} from its \
            {fieldsOf fieldNames}."}export const {constructorName} = \
          {arguments}(fields: {typeName}{arguments}) => fields;\n"
    | .refinement base condition =>
      return s!"{← commentOf name (some "A schema of")}export const {typeName} = \
          {← schemaOf moduleNamespace base}.pipe({← effectNameOf "Schema" "check" .value}(\
          {← effectNameOf "Schema" "makeFilter" .value}(\
          {← valueNameOf moduleNamespace condition})), \
          {← effectNameOf "Schema" "brand" .value}('{typeName}'));\n\n" ++
        s!"{← commentOf name}export type {typeName} = typeof {typeName}.Type;\n"
    | .bundled =>
      let some value := value?
        | Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory gives the \
            type no value."
      let .const structureName _ := value.getAppFn
        | Lean.throwError m!"`{name}` applies no structure."
      bundledFieldsOf value fun bundledParameters fields ↦ do
        -- A parameter with a default value, such as the monad of a kind of system, follows the
        -- type parameters of the fields, as TypeScript requires.
        let allParameters ← orderedOf parameters.toList bundledParameters
        let allNames ← allParameters.mapM fun parameter ↦
          return (← parameter.fvarId!.getUserName).toString
        let annotations ← (allParameters.zip allNames).mapM fun (parameter, parameterName) ↦ do
          genericOf moduleNamespace parameter (annotationOf parameterName
            (← fields.flatMapM fun (_, fieldType) ↦ polaritiesOf parameter true fieldType))
        let allGenerics := if allNames.isEmpty then "" else s!"<{", ".intercalate annotations}>"
        -- The constructor declares the parameters with their constraints and applies the
        -- interface to them by their names alone. It leaves every parameter with a default value
        -- at its default, such as the identity monad of a kind of system, as TypeScript infers no
        -- type through a type lambda that a parameter applies.
        let constructed ← (allParameters.zip allNames).filterM fun (parameter, _) ↦
          return (← defaultOf? parameter).isNone
        let constrained ← constructed.mapM fun (parameter, parameterName) ↦
          genericOf moduleNamespace parameter parameterName
        let declared := if constructed.isEmpty then "" else s!"<{", ".intercalate constrained}>"
        let constructedArguments := if constructed.isEmpty then "" else
          s!"<{", ".intercalate (constructed.map (·.2))}>"
        let fieldLines ← fields.mapM fun (field, fieldType) ↦ do
          return s!"{← fieldCommentOf structureName field}readonly \
            {← fieldNameOf structureName field}: \
            {← typeOf moduleNamespace fieldType};\n"
        let fieldNames ← fields.mapM fun (field, _) ↦ fieldNameOf structureName field
        -- A bundled structure whose structure the theory labels extends the label at its functors,
        -- as its value states it, and keeps the variance of its fields, which TypeScript checks
        -- against the label. It restates its fields unfolded, so that the names of its own type
        -- parameters name the parameters and the elements that the functors leave unnamed, and
        -- TypeScript checks every restated field against the field of the label.
        let comment ← commentOf name
        let extended := match ← extendedOf? moduleNamespace name value bundledParameters with
          | some extended => s!" extends {extended}"
          | none => ""
        let interface := s!"{comment}export interface {typeName}{allGenerics}{extended} \
          \{\n{String.join fieldLines}}\n\n"
        -- A constructor whose fields are functions says where its types come from, as a function
        -- whose parameters take no annotation and no type argument leaves its types unknown.
        let source := if fields.any (·.2.consumeMData.isForall) then
            s!", taking its types from the annotations of the parameters of the \
              {if fieldNames.length == 1 then "field" else "fields"} or else from the type \
              arguments"
          else ""
        return interface ++
          s!"{← derivedCommentOf name s!"Creates {articledOf displayName} from its \
              {fieldsOf fieldNames}{source}."}export const {constructorName} = {declared}\
            (fields: {typeName}{constructedArguments}) => fields;\n"
    | .functor =>
      let some value := value?
        | Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory gives the \
            functor no value."
      lambdaObjectOf value rest fun object ↦ do
        return s!"{← commentOf name}export interface {typeName}{generics} extends \
          {← effectNameOf "HKT" "TypeLambda" .type} \{\n\
          readonly type: {← typeOf moduleNamespace object};\n}\n"
    | .typeConstructor =>
      let some value := value?
        | Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory gives the \
            type constructor no value."
      let .forallE _ domain _ _ := rest
        | Lean.throwError m!"`{name}` is no type constructor."
      -- The type constructor takes a type lambda whose type applies it to the object of the
      -- lambda, as a functor does.
      Lean.Meta.withLocalDeclD (.mkSimple "this['Target']") domain fun target ↦ do
        return s!"{← commentOf name}export interface {typeName}{generics} extends \
          {← effectNameOf "HKT" "TypeLambda" .type} \{\n\
          readonly type: {← typeOf moduleNamespace (Lean.mkApp value target)};\n}\n"
    | .functorClass =>
      let some value := value?
        | Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory gives the \
            type no value."
      let .const structureName _ := value.getAppFn
        | Lean.throwError m!"`{name}` applies no structure."
      functorFieldsOf value fun functor fields axioms ↦ do
        let functorName := (← functor.fvarId!.getUserName).toString
        let generic ← genericOf moduleNamespace functor (annotationOf functorName
          (← fields.flatMapM fun (_, fieldType) ↦ polaritiesOf functor true fieldType))
        let fieldLines ← fields.mapM fun (field, fieldType) ↦ do
          return s!"{← fieldCommentOf structureName field}readonly \
            {← fieldNameOf structureName field}: \
            {← typeOf moduleNamespace fieldType};\n"
        -- The axioms take predicates of an instance, which tell by an equivalence of the values
        -- of the functor whether the instance keeps each axiom.
        let kind := fun (object : String) ↦ do
          return s!"{← effectNameOf "HKT" "Kind" .type}<{functorName}, never, never, never, \
            {object}>"
        let axiomLines ← axioms.mapM fun (field, statement) ↦ do
          return s!"{← fieldCommentOf structureName field}{← fieldNameOf structureName field}: \
            {← axiomOf moduleNamespace functor statement},\n"
        let fieldNames ← fields.mapM fun (field, _) ↦ fieldNameOf structureName field
        return s!"{← commentOf name}export interface {typeName}<{generic}> extends \
            {← effectNameOf "HKT" "TypeClass" .type}<{functorName}> \{\n\
            {String.join fieldLines}}\n\n" ++
          s!"{← derivedCommentOf name s!"Creates {articledOf displayName} from its \
              {fieldsOf fieldNames}."}export const {constructorName} = \
            <{← genericOf moduleNamespace functor functorName}>(fields: \
            {typeName}<{functorName}>) => \
            fields;\n\n" ++
          s!"{← derivedCommentOf name s!"Gives the axioms of {articledOf displayName} as \
              predicates of an instance."}export const {← axiomsNameOf moduleNamespace name} = \
            <{← genericOf moduleNamespace functor functorName}>(\n\
            instance: {typeName}<{functorName}>,\n\
            equivalence: \
            <X>(self: {← kind "X"}, that: {← kind "X"}) => boolean,\n) => (\{\n\
            {String.join axiomLines}});\n"
    | .curriedFunctor =>
      let some value := value?
        | Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory gives the \
            functor no value."
      let some targetType := curriedTargetOf? rest
        | Lean.throwError m!"`{name}` is no curried functor."
      -- The object of the curried functor takes a type parameter after those of the declaration.
      curriedObjectOf name value rest fun parameter functor ↦
        lambdaObjectOf functor targetType fun object ↦ do
          let parameterName := (← parameter.fvarId!.getUserName).toString
          let objectGeneric := annotationOf parameterName (← polaritiesOf parameter true object)
          let typeLambda := fun (objectType : String) ↦ do
            return s!"{← commentOf name}export interface {typeName}\
              <{", ".intercalate (annotated ++ [objectGeneric])}> extends \
              {← effectNameOf "HKT" "TypeLambda" .type} \{\n\
              readonly type: {objectType};\n}\n"
          -- An object that is a structure whose fields the theory names takes an interface of its
          -- own, named as the theory names the structure, with a type parameter for every field,
          -- as TypeScript refuses `this['Target']` within a type literal.
          let environment ← Lean.getEnv
          let .mdata data inner := object | typeLambda (← typeOf moduleNamespace object)
          let (some (.ofName declaration), .const structureName _) :=
              (data.find `typescriptRecord, inner.getAppFn)
            | typeLambda (← typeOf moduleNamespace object)
          let some clause := ExportTypeScript.clauseOf? environment declaration structureName
            | typeLambda (← typeOf moduleNamespace object)
          let fieldTypes ← fieldTypesOf structureName inner.getAppArgs
          let fieldNames := fieldTypes.map fun (field, _) ↦
            (ExportTypeScript.nameOf? environment declaration field).getD field.toString
          -- Every argument of the structure takes the name of the field whose type it is.
          let parameterNames := inner.getAppArgs.toList.map fun argument ↦
            ((fieldTypes.zip fieldNames).find? (·.1.2 == argument)).map (·.2.capitalize)
          unless parameterNames.all Option.isSome do
            Lean.throwError m!"`{name}` has no type in TypeScript, as a field of `{structureName}` \
              takes no argument of the structure as its type."
          let fieldLines ← (fieldTypes.zip fieldNames).mapM fun ((field, fieldType), fieldName) ↦ do
            let comment ← match (ExportTypeScript.clauseOf? environment declaration field).bind
                (·.comment) with
              | some comment => documentationOf comment.text comment.item.toList
              | none => commentOf (structureName ++ field)
            let parameter := (inner.getAppArgs.toList.zip parameterNames).findSome? fun
              (argument, parameterName) ↦ if argument == fieldType then parameterName else none
            return s!"{comment}readonly {fieldName}: {parameter.getD ""};\n"
          let interfaceComment ← match clause.comment with
            | some comment => documentationOf comment.text comment.item.toList
            | none => commentOf structureName
          let arguments ← inner.getAppArgs.toList.mapM (typeOf moduleNamespace)
          return s!"{interfaceComment}export interface {clause.name}\
              <{", ".intercalate (parameterNames.filterMap (·.map (s!"out {·}")))}> \
              \{\n{String.join fieldLines}}\n\n" ++
            (← typeLambda s!"{clause.name}<{", ".intercalate arguments}>")
    | .type =>
      let some value := value?
        | Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory gives the \
            type no value."
      return s!"{← commentOf name}export type {typeName}{generics} = \
        {← typeOf moduleNamespace value};\n"
    | .function =>
      -- A bundled structure among the parameters gives the function a type parameter for every
      -- field whose value is a type, such as `State` of a coalgebra.
      unbundledOf rest value? fun bundledParameters unbundled ↦ do
        -- An object of a functor among the types, such as the product of a step, takes the type
        -- it reduces to, such as the record of the product.
        let unbundled ← normalizedOf unbundled
        let isStream := fun (type : Lean.Expr) ↦ type.isAppOf `Stream' || type.isAppOf `Stream'.Seq
        let (parameterTypes, resultType) ← Lean.Meta.forallTelescope unbundled
          fun unbundledParameters body ↦ do
            return (← unbundledParameters.toList.mapM fun parameter ↦
              Lean.Meta.inferType parameter, body)
        -- A function that takes a stream passes on the failure `E` and the requirements `R` of the
        -- streams it takes to the streams it gives, and the stream of the theory is the one with
        -- neither.
        let streaming := parameterTypes.any isStream
        let (signature, result) ← signatureOf moduleNamespace [] (if streaming then
          unbundled.replace fun type ↦
            if isStream type then some (Lean.mkAnnotation `channels type) else none
          else unbundled)
        let channels := if streaming then ["E = never", "R = never"] else []
        let bundledNames ← bundledParameters.mapM fun parameter ↦
          return (← parameter.fvarId!.getUserName).toString
        let allNames := names ++ bundledNames
        let allArguments := if allNames.isEmpty then "" else s!"<{", ".intercalate allNames}>"
        let allGenerics := if allNames.isEmpty && channels.isEmpty then "" else
          s!"<{", ".intercalate (allNames ++ channels)}>"
        -- A function whose last parameter is a stream takes as well the signature without it,
        -- which gives a function of the stream, so that a stream pipes into the function.
        if parameterTypes.getLast?.any isStream then
          return s!"{← commentOf name}export interface {typeName} \{\n\
            {allGenerics}({", ".intercalate signature}): {result};\n\
            {allArguments}({", ".intercalate signature.dropLast}): \
            <{", ".intercalate channels}>({signature.getLastD ""}) => {result};\n}\n"
        -- An operation on a type, a function of two or more parameters whose first parameter has
        -- the type of its result or another type of the same declaration, such as a combinator
        -- that maps a machine into a machine, takes as well the signature without its first
        -- parameter, which gives a function of it, as `Function.dual` of Effect gives
        -- `Rational.sum`.
        let sameDeclaration := match parameterTypes.head?.map (·.getAppFn), resultType.getAppFn with
          | some (.const first _), .const result _ => first == result
          | _, _ => false
        if parameterTypes.length > 1 && (parameterTypes.head? == some resultType || sameDeclaration)
            then
          -- The signature without the first parameter takes the type parameters that the other
          -- parameters name, and the function it gives takes the rest, which the first parameter
          -- alone names, as Effect takes them, so that the type of a value that pipes into it
          -- gives them.
          let named := (parameters.toList ++ bundledParameters).zip allNames
          let (outer, inner) := named.partition fun (parameter, _) ↦
            parameterTypes.tail.any (·.containsFVar parameter.fvarId!)
          let genericsOf := fun (all : List (Lean.Expr × String)) ↦
            if all.isEmpty then "" else s!"<{", ".intercalate (all.map (·.2))}>"
          return s!"{← commentOf name}export interface {typeName} \{\n\
            {allGenerics}({", ".intercalate signature}): {result};\n\
            {genericsOf outer}({", ".intercalate signature.tail}): \
            {genericsOf inner}({signature.headD ""}) => {result};\n}\n"
        return s!"{← commentOf name}export type {typeName} = \
          {allGenerics}({", ".intercalate signature}) => {result};\n"
    | .value =>
      unless names.isEmpty do
        Lean.throwError m!"`{name}` has no value in TypeScript, as it takes type parameters."
      return s!"{← commentOf name}export const {valueName}: \
        {← typeOf moduleNamespace rest} = \
        {← initializerOf moduleNamespace name (← valueOf name rest (Lean.mkConst name))};\n"

end Generator
