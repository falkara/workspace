/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Translation
public import Translator.Core.Type
public import Translator.Lean.Tree
public import Translator.Refusal

/-!
# Type

The module defines the translation of the tree of a type of the theory into a type of the core, a
type constructor, a signature, and a schema, by the formers that the rules of the translator give
the constants of Lean, such as the rational numbers for `Rat` and the options for `Option`, and by
the form of the tree otherwise: a type parameter as itself, a declaration that the theory gives a
counterpart by its reference and its arguments, an object of a functor or a type constructor that
is a parameter as its application, an object of a functor whose declaration names its fields as a
product presented by the declaration, a morphism and a function type as a function, and an implicit
type as a type parameter of the function that follows it. Every other tree refuses with the reason.

## Implementation Notes

The translation names no constant of Lean, as the rules of `Falkara.Translation`, which resolve
every constant when the theory compiles, give it the former of every constant. A former gives a
schema where it is a type of data: the rational numbers, the strings, the booleans, and the options
and the arrays of a type of data.

A parameter that the source leaves unnamed takes `f` where it is a morphism, as Mathlib names a
morphism, and the name Lean gives it otherwise, such as `a`. The parameter of a morphism takes the
name of its domain where its domain is a type parameter whose name is a word, such as `state` for
`State`, and `value` otherwise.

The arguments of a declaration take the order that a target takes them in: every argument without
a default value, then every argument past the binders of the declaration, and then every argument
with a default value up to the last one that differs from its default, as a target takes a type
parameter with a default value after every other one. Every argument is translated in the order of
the binders, so the first argument without a translation gives the refusal.

A binary sum translates its right summand before its left one, and a computation that reads
requirements its success, its failure, and its requirements in that order, as the target writes
them in that order.
-/

public section

namespace Translator.Lean

/-- What a translation of a tree knows beyond the tree: the rules of the translator, as the record
of `Falkara.Translation` gives them, and the declaration that labels the identity functor, the
functor of the identity monad, where the theory gives one a counterpart. -/
structure Elaborate.Context where
  /-- The rules of the translator. -/
  rules : List Falkara.Translation.Rule
  /-- The declaration that labels the identity functor. -/
  identity : Option Core.Reference

/-- Gives the arguments of a declaration in the order that a target takes them, each with the
polarities at which the declaration takes it, from the arguments in the order of the binders with
their roles: every argument without a default value, then every argument past the binders, and then
every argument with a default value up to the last one that differs from its default. -/
def orderedArgumentsOf (arguments : List (Core.Argument × List Bool × Role)) :
    List Core.Argument × List (List Bool) :=
  let required := arguments.filterMap fun
    | (argument, variance, .required) => some (argument, variance)
    | _ => none
  let extra := arguments.filterMap fun
    | (argument, variance, .extra) => some (argument, variance)
    | _ => none
  let defaulted := arguments.filterMap fun
    | (argument, variance, .defaulted atDefault) => some ((argument, variance), atDefault)
    | _ => none
  (required ++ extra ++ ((defaulted.reverse.dropWhile (·.2)).reverse.map (·.1))).unzip

mutual

/-- Gives the type of the core that a tree takes, or refuses with the reason. -/
def Tree.toType (context : Elaborate.Context) : Tree → Except Refusal Core.TypeTerm
  | .parameter name _ => pure (.parameter name)
  | .target _ => pure .target
  | .constant name arguments _ =>
    match Falkara.Translation.formerOf? context.rules name, arguments with
    | some .rational, [] => pure .rational
    | some .string, [] => pure .string
    | some .boolean, [] => pure .boolean
    | some .unit, [] => pure .unit
    | some .option, [element] => return .option (← element.toType context)
    | some .array, [element] => return .array (← element.toType context)
    | some .stream, [element] => return .stream (← element.toType context)
    | some .sequence, [element] => return .sequence (← element.toType context)
    | some .product, [first, second] => do
      let first ← first.toType context
      return .product none [.mk "fst" first, .mk "snd" (← second.toType context)]
    | some .sum, [left, right] => do
      let right ← right.toType context
      return .sum (← left.toType context) right
    | some .reader, [requirements, .constant except [failure] _, success] =>
      -- A computation reads its requirements in the monad of a result that may fail.
      if Falkara.Translation.formerOf? context.rules except == some .except then do
        let success ← success.toType context
        let failure ← failure.toType context
        return .effect success failure (← requirements.toType context)
      else throw (.notExported name)
    | _, _ => throw (.notExported name)
  | .declared reference _ arguments _ => do
    let (ordered, variances) :=
      orderedArgumentsOf (← DeclaredArgument.toArguments context arguments)
    return .named reference ordered variances
  | .object functor object _ => do
    let constructor ← functor.toConstructor context
    return .apply constructor (← object.toType context)
  | .record reference fields _ =>
    return .product (some reference) (← RecordField.toFields context fields)
  | .morphism domain codomain _ => do
    let name := match domain with
      | .parameter name _ => if name.all Char.isAlphanum then name.decapitalize else "value"
      | _ => "value"
    let parameter := Core.NamedType.mk name (← domain.toType context)
    -- A morphism to a function type takes the parameters of the function type after its own.
    match codomain, ← codomain.toType context with
    | .function .., .function _ parameters result =>
      return .function [] (parameter :: parameters) result
    | _, result => return .function [] [parameter] result
  | .function parameters result _ => do
    let parameters ← FunctionParameter.toParameters context parameters
    match result with
    | .dependent name source => throw (.dependentResult source name)
    | .implicit name source | .generic name _ source => throw (.implicitParameter source name)
    | result => return .function [] parameters (← result.toType context)
  | .dependent name source => throw (.dependentResult source name)
  | .implicit name source => throw (.implicitParameter source name)
  | .generic name body source => do
    -- An implicit type takes a type parameter of the function that follows it.
    let .function typeParameters parameters result ← body.toType context
      | throw (.noType source)
    return .function (name.toString :: typeParameters) parameters result
  | .other source => throw (.noType source)

/-- Gives the type constructor of the core that a tree takes, or refuses with the reason. -/
def Tree.toConstructor (context : Elaborate.Context) : Tree → Except Refusal Core.Constructor
  | .parameter name _ => pure (.parameter name)
  | .constant name _ source =>
    match Falkara.Translation.formerOf? context.rules name, context.identity with
    | some .option, _ => pure .option
    | some .identity, some label => pure (.identity label)
    | some .identity, none => throw (.noIdentityLabel source)
    | _, _ => throw (.unexportedTypeLambda source name)
  | .declared reference _ arguments _ => do
    let (ordered, variances) :=
      orderedArgumentsOf (← DeclaredArgument.toArguments context arguments)
    return .named reference ordered variances
  | .target source | .object _ _ source | .record _ _ source | .morphism _ _ source
  | .function _ _ source | .dependent _ source | .implicit _ source | .generic _ _ source
  | .other source => throw (.noTypeLambda source)

/-- Gives the arguments of the core that the arguments of a declaration take, in the order of the
binders, each with its polarities and its role, or refuses with the reason of the first without
one. -/
def DeclaredArgument.toArguments (context : Elaborate.Context) :
    List DeclaredArgument → Except Refusal (List (Core.Argument × List Bool × Role))
  | [] => pure []
  | .mk tree constructor role variance :: rest => do
    let argument ← if constructor then Core.Argument.constructor <$> tree.toConstructor context
      else Core.Argument.type <$> tree.toType context
    return (argument, variance, role) :: (← DeclaredArgument.toArguments context rest)

/-- Gives the fields of a product of the core that the fields of a record take, or refuses with
the reason of the first without one. -/
def RecordField.toFields (context : Elaborate.Context) :
    List RecordField → Except Refusal (List Core.NamedType)
  | [] => pure []
  | .mk name tree :: rest => do
    let field := Core.NamedType.mk name (← tree.toType context)
    return field :: (← RecordField.toFields context rest)

/-- Gives the parameters of a function of the core that the parameters of a function type take,
named by their binders, or refuses with the reason of the first without one. -/
def FunctionParameter.toParameters (context : Elaborate.Context) :
    List FunctionParameter → Except Refusal (List Core.NamedType)
  | [] => pure []
  | .mk name domain source :: rest => do
    if name.isAnonymous then throw (.unnamedParameter source)
    let parameterName := match domain with
      | .morphism .. => if name.hasMacroScopes then "f" else name.eraseMacroScopes.toString
      | _ => name.eraseMacroScopes.toString
    let parameter := Core.NamedType.mk parameterName (← domain.toType context)
    return parameter :: (← FunctionParameter.toParameters context rest)

end

/-- Gives the parameters and the result of the core that the signature of a function takes, or
refuses with the reason: the parameters and the result of a function type, and no parameters and
the type itself otherwise. -/
def Tree.toSignature (context : Elaborate.Context) (tree : Tree) :
    Except Refusal (List Core.NamedType × Core.TypeTerm) :=
  match tree with
  | .generic name _ source => throw (.implicitParameter source name)
  | .function .. => do
    match ← tree.toType context with
    | .function _ parameters result => return (parameters, result)
    | result => return ([], result)
  | tree => return ([], ← tree.toType context)

/-- Gives the schema of the core that a tree takes, or refuses with the reason: a function type has
none, as a schema describes data, a declaration that the theory gives a counterpart has one where
it is a type of data, and every other type has one where a rule gives it. -/
def Tree.toSchema (context : Elaborate.Context) : Tree → Except Refusal Core.Schema
  | .function _ _ source | .dependent _ source | .implicit _ source | .generic _ _ source =>
    throw (.functionSchema source)
  | .constant name arguments source =>
    match Falkara.Translation.formerOf? context.rules name, arguments with
    | some .rational, [] => pure .rational
    | some .string, [] => pure .string
    | some .boolean, [] => pure .boolean
    | some .option, [element] => return .option (← element.toSchema context)
    | some .array, [element] => return .array (← element.toSchema context)
    | _, [] => throw (.notExported name)
    | _, _ => throw (.noSchema source)
  | .declared reference data [] _ =>
    if data then pure (.named reference) else throw (.noDataSchema reference.declaration)
  | tree => throw (.noSchema tree.source)

end Translator.Lean
