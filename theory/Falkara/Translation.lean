/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Lean.EnvExtension

/-!
# Translation

The module defines the rules by which a translator reads the constants of Lean that the theory
builds on, such as `Rat`, `Prod.mk`, or `CategoryTheory.Functor.obj`, and the record of every
rule, which the command `translation_rule` of `Falkara.TranslationRule` fills while a module
compiles and a translator reads when it runs. A rule names a constant, the number of arguments that
an application of it takes, the type that its first argument names where the rule holds at one type
alone, such as the sum of rational numbers, and its action: a former of a type of the core, such as
the rational numbers or the options, a structural part of a term or a type, such as a pair or the
object of a functor, a primitive of a target, an operation of a library that a target implements by
a rule of its own, such as the sum of two rational numbers, or the erasure of the application to one
of its arguments. A vector gives a primitive a closed declaration of the theory whose value the
kernel of Lean computes, against which a target checks the rule that implements the primitive.

## Implementation Notes

The record lies apart from the command, as a translator reads it when it runs and the command fills
it while a module compiles, so the record is ordinary code and the command a metaprogram, which
imports this module at both phases.

A rule names its action by a word, as the command reads it, and every vocabulary lists its values
once, so the words and the values stay one to one.

The rules lie in an extension of the environment, looked up in the entries of every module rather
than in a state of the extension, as a translator imports the theory without the states of the
extensions, as `Falkara.ExportTypeScript` looks an export up.

A former, a structural part, and a primitive are kinds of their own, as a translator reads a former
into a type of the core, takes a structural part apart by its own reading, and passes a primitive
to the rule of its target alone.
-/

public section

namespace Falkara.Translation

/-- A former of a type of the core that a constant of Lean takes. -/
inductive Former where
  /-- The rational numbers. -/
  | rational
  /-- The strings. -/
  | string
  /-- The booleans. -/
  | boolean
  /-- The type of one value. -/
  | unit
  /-- The options of a type. -/
  | option
  /-- The finite arrays of a type. -/
  | array
  /-- The infinite streams of a type. -/
  | stream
  /-- The sequences of a type, which may end. -/
  | sequence
  /-- The product of two types. -/
  | product
  /-- The binary sum of two types. -/
  | sum
  /-- A computation that reads requirements and gives a result that may fail. -/
  | reader
  /-- A result that may fail. -/
  | except
  /-- The identity monad. -/
  | identity
  deriving Repr, DecidableEq

/-- Every former, in the order of its declaration. -/
def Former.all : List Former :=
  [.rational, .string, .boolean, .unit, .option, .array, .stream, .sequence, .product, .sum,
    .reader, .except, .identity]

/-- Gives the word that names a former in the command `translation_rule`. -/
def Former.word : Former → String
  | .rational => "rational"
  | .string => "string"
  | .boolean => "boolean"
  | .unit => "unit"
  | .option => "option"
  | .array => "array"
  | .stream => "stream"
  | .sequence => "sequence"
  | .product => "product"
  | .sum => "sum"
  | .reader => "reader"
  | .except => "except"
  | .identity => "identity"

/-- A structural part of a type or a term that a translator takes apart by a reading of its own. -/
inductive Structural where
  /-- The type of the functors between two categories. -/
  | functor
  /-- The object of a functor at an object. -/
  | functorObject
  /-- The morphism of a functor at a morphism. -/
  | functorMap
  /-- The prefunctor that a functor extends. -/
  | toPrefunctor
  /-- The object of a prefunctor at an object. -/
  | prefunctorObject
  /-- The class of the categories. -/
  | category
  /-- The category of types. -/
  | types
  /-- The functor on types of a type constructor. -/
  | typeFunctor
  /-- The identity functor of a category. -/
  | identityFunctor
  /-- The identity morphism of an object. -/
  | identityMorphism
  /-- The composite of two morphisms. -/
  | composition
  /-- The type of the morphisms between two objects of a category. -/
  | hom
  /-- The type of the morphisms between two types. -/
  | typeHom
  /-- The opposite of a type. -/
  | opposite
  /-- The object of the opposite that an object gives. -/
  | toOpposite
  /-- The object that an object of the opposite gives. -/
  | fromOpposite
  /-- The pair of two values. -/
  | pair
  /-- The first component of a pair. -/
  | first
  /-- The second component of a pair. -/
  | second
  /-- The function that a value of a type of functions gives, applied to an argument. -/
  | coercion
  /-- The first element of a stream. -/
  | head
  deriving Repr, DecidableEq

/-- Every structural part, in the order of its declaration. -/
def Structural.all : List Structural :=
  [.functor, .functorObject, .functorMap, .toPrefunctor, .prefunctorObject, .category, .types,
    .typeFunctor, .identityFunctor, .identityMorphism, .composition, .hom, .typeHom, .opposite, .toOpposite,
    .fromOpposite, .pair, .first, .second, .coercion, .head]

/-- Gives the word that names a structural part in the command `translation_rule`. -/
def Structural.word : Structural → String
  | .functor => "functor"
  | .functorObject => "functorObject"
  | .functorMap => "functorMap"
  | .toPrefunctor => "toPrefunctor"
  | .prefunctorObject => "prefunctorObject"
  | .category => "category"
  | .types => "types"
  | .typeFunctor => "typeFunctor"
  | .identityFunctor => "identityFunctor"
  | .identityMorphism => "identityMorphism"
  | .composition => "composition"
  | .hom => "hom"
  | .typeHom => "typeHom"
  | .opposite => "opposite"
  | .toOpposite => "toOpposite"
  | .fromOpposite => "fromOpposite"
  | .pair => "pair"
  | .first => "first"
  | .second => "second"
  | .coercion => "coercion"
  | .head => "head"

/-- An operation of a library that a target implements by a rule of its own. -/
inductive Primitive where
  /-- A rational number of a natural number literal. -/
  | rationalLiteral
  /-- The negation of a rational number. -/
  | rationalNegate
  /-- The sum of two rational numbers. -/
  | rationalAdd
  /-- The difference of two rational numbers. -/
  | rationalSubtract
  /-- The product of two rational numbers. -/
  | rationalMultiply
  /-- The option that holds a value. -/
  | optionSome
  /-- The option that holds no value. -/
  | optionNone
  /-- The stream of the values that a function gives at the elements of a stream. -/
  | streamMap
  /-- The sequence of the values that a function gives at the elements of a sequence. -/
  | sequenceMap
  /-- The stream of the values that a function gives at the elements of two streams, pairwise. -/
  | streamZip
  /-- The stream of an element followed by a stream. -/
  | streamCons
  /-- The stream after its first element. -/
  | streamTail
  /-- The first element and the rest of a sequence, where it has a first element. -/
  | sequenceDestruct
  /-- The stream that repeats a value. -/
  | streamConst
  /-- The sequence without elements. -/
  | sequenceNil
  /-- The sequence of an element followed by a sequence. -/
  | sequenceCons
  deriving Repr, DecidableEq

/-- Every primitive, in the order of its declaration. -/
def Primitive.all : List Primitive :=
  [.rationalLiteral, .rationalNegate, .rationalAdd, .rationalSubtract, .rationalMultiply,
    .optionSome, .optionNone, .streamMap, .sequenceMap, .streamZip, .streamCons, .streamTail,
    .sequenceDestruct, .streamConst, .sequenceNil, .sequenceCons]

/-- Gives the word that names a primitive in the command `translation_rule`. -/
def Primitive.word : Primitive → String
  | .rationalLiteral => "rationalLiteral"
  | .rationalNegate => "rationalNegate"
  | .rationalAdd => "rationalAdd"
  | .rationalSubtract => "rationalSubtract"
  | .rationalMultiply => "rationalMultiply"
  | .optionSome => "optionSome"
  | .optionNone => "optionNone"
  | .streamMap => "streamMap"
  | .sequenceMap => "sequenceMap"
  | .streamZip => "streamZip"
  | .streamCons => "streamCons"
  | .streamTail => "streamTail"
  | .sequenceDestruct => "sequenceDestruct"
  | .streamConst => "streamConst"
  | .sequenceNil => "sequenceNil"
  | .sequenceCons => "sequenceCons"

/-- The action of a rule: what a translator reads an application of its constant as. -/
inductive Action where
  /-- A former of a type of the core. -/
  | type (former : Former)
  /-- A structural part of a type or a term. -/
  | structural (part : Structural)
  /-- A primitive of a target, applied to the explicit arguments of the application. -/
  | primitive (primitive : Primitive)
  /-- The argument of the application at an index, which the application stands for. -/
  | erase (kept : Nat)
  deriving Repr, DecidableEq

/-- A rule of a translator: a constant of Lean, the number of arguments that an application of it
takes, the type that its first argument names where the rule holds at one type alone, and its
action. -/
structure Rule where
  /-- The constant of Lean. -/
  constant : Lean.Name
  /-- The number of arguments that an application of the constant takes. -/
  arity : Nat
  /-- The type that the first argument names, where the rule holds at one type alone. -/
  domain : Option Lean.Name
  /-- The action of the rule. -/
  action : Action
  deriving Repr, DecidableEq

/-- A vector of a primitive: a closed declaration of the theory that applies the primitive, whose
value the kernel of Lean computes, against which a target checks the rule that implements the
primitive. -/
structure Vector where
  /-- The primitive. -/
  primitive : Primitive
  /-- The closed declaration. -/
  declaration : Lean.Name
  deriving Repr, DecidableEq

/-- An entry of the record: a rule or a vector. -/
inductive Entry where
  /-- A rule of a translator. -/
  | rule (rule : Rule)
  /-- A vector of a primitive. -/
  | vector (vector : Vector)
  deriving Repr, DecidableEq

/-- The record of the rules and the vectors of a translator. -/
initialize translationExtension : Lean.SimplePersistentEnvExtension Entry Unit ←
  Lean.registerSimplePersistentEnvExtension {
    addEntryFn := fun _ _ ↦ ()
    addImportedFn := fun _ ↦ ()
  }

/-- Gives every entry of the record, those of the imported modules and those of the current one, in
the order of the commands that give them. -/
def entriesOf (environment : Lean.Environment) : List Entry :=
  (List.range environment.header.moduleNames.size).flatMap (fun index ↦
    (translationExtension.getModuleEntries environment index).toList) ++
    -- The extension keeps the entries of the current module with the latest first.
    (translationExtension.getEntries environment).reverse

/-- Gives every rule of the record, in the order of their entries. -/
def rulesOf (environment : Lean.Environment) : List Rule :=
  (entriesOf environment).filterMap fun
    | .rule rule => some rule
    | .vector _ => none

/-- Gives every vector of a primitive, in the order of their entries. -/
def vectorsOf (environment : Lean.Environment) (primitive : Primitive) : List Vector :=
  (entriesOf environment).filterMap fun
    | .vector vector => if vector.primitive == primitive then some vector else none
    | .rule _ => none

/-- Gives the rule of an application of a constant to a number of arguments, the first of which
names a type where it names one, where a rule holds there: a rule at the type of the first argument
before a rule at every type. -/
def ruleOf? (rules : List Rule) (constant : Lean.Name) (arity : Nat) (domain : Option Lean.Name) :
    Option Rule :=
  let candidates := rules.filter fun rule ↦ rule.constant == constant && rule.arity == arity
  (candidates.find? fun rule ↦ rule.domain.isSome && rule.domain == domain) <|>
    candidates.find? (·.domain.isNone)

/-- Gives the constants whose rules take an action, in the order of their rules. -/
def constantsOf (rules : List Rule) (action : Action) : List Lean.Name :=
  (rules.filter (·.action == action)).map (·.constant)

/-- Gives the former of a type of the core that a constant takes, where a rule gives it one,
whatever the arity of the rule. -/
def formerOf? (rules : List Rule) (constant : Lean.Name) : Option Former :=
  rules.findSome? fun rule ↦
    match rule.action with
    | .type former => if rule.constant == constant then some former else none
    | _ => none

/-- Tells whether a constant takes a structural part by a rule, whatever the arity of the rule. -/
def isStructural (rules : List Rule) (part : Structural) (constant : Lean.Name) : Bool :=
  rules.any fun rule ↦ rule.constant == constant && rule.action == .structural part

end Falkara.Translation
