/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Core.Declaration
public import Translator.Target.Effect.Type

/-!
# Shape

The module defines the idioms of Effect that a declaration of the core takes beyond its types: the
variance that a type parameter declares, `in` where it occurs negatively in the types of its
declaration, `out` where it occurs positively, both where it occurs at both polarities, and none
where it does not occur; a type parameter constrained to a type lambda of Effect, `HKT.TypeLambda`,
where it is a functor or a type constructor, so that `HKT.Kind` applies it, with its default value;
and the signature of a function: the channels `E` and `R` of the streams it takes, which it passes
on to the streams it gives, as `Stream.map` of Effect does; the signature without its last
parameter, which gives a function of a stream, where its last parameter is a stream, so that a
stream pipes into the function; and the signature without its first parameter, as `Function.dual`
of Effect gives it, where the function is an operation on a type, a function of two or more
parameters whose first parameter has the type of its result or another type of the same
declaration.

## Implementation Notes

A type parameter occurs at a positive polarity in what a type gives and at a negative polarity in
what a function takes, and an occurrence in an argument of a declaration takes every polarity at
which the declaration takes the argument, reversed where the occurrence is negative.

An object of a type constructor that is a parameter varies with the type constructor in the
direction of a natural transformation, so the type constructor occurs at the polarity of the
object, while TypeScript sees no variance of a type lambda that is a parameter and refuses every
annotation but both, so every type parameter in the object occurs at both polarities.

A computation varies with its success, its failure, and its requirements alike, as Effect declares
`Effect.Effect`, whereas the requirements of the theory are read.

The signature without its first parameter takes the type parameters that the other parameters
name, and the function it gives takes the rest, which the first parameter alone names, as Effect
takes them, so that the type of a value that pipes into it gives them.
-/

public section

namespace Translator.Effect

mutual

/-- Gives the polarities at which a type parameter occurs in a type, `true` for a positive
occurrence and `false` for a negative one, given the polarity of the type. -/
def polaritiesOf (parameter : String) (positive : Bool) : Core.TypeTerm → List Bool
  | .rational | .string | .boolean | .unit | .target => []
  | .parameter name => if name == parameter then [positive] else []
  | .option element | .array element | .stream element | .sequence element =>
    polaritiesOf parameter positive element
  | .product _ fields => namedPolaritiesOf parameter positive fields
  | .sum left right => polaritiesOf parameter positive left ++ polaritiesOf parameter positive right
  | .effect success failure requirements =>
    polaritiesOf parameter positive success ++ polaritiesOf parameter positive failure ++
      polaritiesOf parameter positive requirements
  | .apply constructor argument =>
    constructorPolaritiesOf parameter positive constructor ++
      polaritiesOf parameter positive argument ++ polaritiesOf parameter (!positive) argument
  | .named _ arguments variances => argumentPolaritiesOf parameter positive arguments variances
  | .function _ parameters result =>
    namedPolaritiesOf parameter (!positive) parameters ++ polaritiesOf parameter positive result

/-- Gives the polarities at which a type parameter occurs in a type constructor. -/
def constructorPolaritiesOf (parameter : String) (positive : Bool) :
    Core.Constructor → List Bool
  | .parameter name => if name == parameter then [positive] else []
  | .identity _ | .option => []
  | .named _ arguments variances => argumentPolaritiesOf parameter positive arguments variances

/-- Gives the polarities at which a type parameter occurs in the arguments of a declaration, every
argument at every polarity at which the declaration takes it, reversed where the polarity is
negative. -/
def argumentPolaritiesOf (parameter : String) (positive : Bool) :
    List Core.Argument → List (List Bool) → List Bool
  | [], _ => []
  | .type type :: rest, variances =>
    (variances.headD []).flatMap (fun polarity ↦
      polaritiesOf parameter (positive == polarity) type) ++
      argumentPolaritiesOf parameter positive rest variances.tail
  | .constructor constructor :: rest, variances =>
    (variances.headD []).flatMap (fun polarity ↦
      constructorPolaritiesOf parameter (positive == polarity) constructor) ++
      argumentPolaritiesOf parameter positive rest variances.tail

/-- Gives the polarities at which a type parameter occurs in fields or parameters. -/
def namedPolaritiesOf (parameter : String) (positive : Bool) : List Core.NamedType → List Bool
  | [] => []
  | .mk _ type :: rest =>
    polaritiesOf parameter positive type ++ namedPolaritiesOf parameter positive rest

end

/-- Gives the variance that a type parameter declares from the polarities at which it occurs in the
types of its declaration. -/
def varianceOf (parameter : String) (types : List Core.TypeTerm) : TypeScript.Variance :=
  let polarities := types.flatMap (polaritiesOf parameter true)
  match polarities.contains false, polarities.contains true with
  | true, true => .invariant
  | true, false => .contravariant
  | false, true => .covariant
  | false, false => .inferred

/-- Gives the type parameter of TypeScript that a type parameter of the core takes with a variance,
constrained to a type lambda of Effect where it is a functor or a type constructor, and with its
default value. -/
def typeParameterOf (context : Context) (variance : TypeScript.Variance)
    (parameter : Core.TypeParameter Core.Argument) : TypeScript.TypeParameter :=
  .mk variance parameter.name
    (if parameter.kind == .type then none
      else some (.reference (.symbol (.effect "HKT" "TypeLambda")) []))
    (parameter.default.map (lowerArgument context))

mutual

/-- Tells whether a type names a type parameter. -/
def TypeTerm.mentions (name : String) : Core.TypeTerm → Bool
  | .rational | .string | .boolean | .unit | .target => false
  | .parameter parameter => parameter == name
  | .option element | .array element | .stream element | .sequence element =>
    TypeTerm.mentions name element
  | .product _ fields => fields.any (NamedType.mentions name)
  | .sum left right => TypeTerm.mentions name left || TypeTerm.mentions name right
  | .effect success failure requirements =>
    TypeTerm.mentions name success || TypeTerm.mentions name failure ||
      TypeTerm.mentions name requirements
  | .apply constructor argument =>
    Constructor.mentions name constructor || TypeTerm.mentions name argument
  | .named _ arguments _ => arguments.any (Argument.mentions name)
  | .function _ parameters result =>
    parameters.any (NamedType.mentions name) || TypeTerm.mentions name result

/-- Tells whether a type constructor names a type parameter. -/
def Constructor.mentions (name : String) : Core.Constructor → Bool
  | .parameter parameter => parameter == name
  | .identity _ | .option => false
  | .named _ arguments _ => arguments.any (Argument.mentions name)

/-- Tells whether an argument names a type parameter. -/
def Argument.mentions (name : String) : Core.Argument → Bool
  | .type type => TypeTerm.mentions name type
  | .constructor constructor => Constructor.mentions name constructor

/-- Tells whether the type of a field or a parameter names a type parameter. -/
def NamedType.mentions (name : String) : Core.NamedType → Bool
  | .mk _ type => TypeTerm.mentions name type

end

/-- Gives the declaration or the constant of Lean that heads a type, where one heads it, so that
two types of the same declaration tell themselves apart from every other. -/
def headOf : Core.TypeTerm → Option String
  | .rational => some "Rat"
  | .string => some "String"
  | .boolean => some "Bool"
  | .unit => some "PUnit"
  | .option _ => some "Option"
  | .array _ => some "Array"
  | .stream _ => some "Stream'"
  | .sequence _ => some "Stream'.Seq"
  | .product none _ => some "Prod"
  | .sum .. => some "Sum"
  | .effect .. => some "ReaderT"
  | .named reference _ _ => some reference.declaration.toString
  | .parameter _ | .target | .product (some _) _ | .apply .. | .function .. => none

/-- Gives the declaration of TypeScript of the signature of a function: a type alias of its function
type, or an interface with the signature and the signature without its last parameter where its
last parameter is a stream, or without its first parameter where it is an operation on a type, with
the channels `E` and `R` where it takes a stream. -/
def functionStatementOf (context : Context) (documentation : TypeScript.Documentation)
    (name : String) (typeParameters : List String) (signature : Core.TypeTerm) :
    TypeScript.Statement :=
  let (parameters, result) := match signature with
    | .function [] parameters result => (parameters, result)
    | signature => ([], signature)
  let isStream := fun (type : Core.NamedType) ↦ match type with
    | .mk _ (.stream _) | .mk _ (.sequence _) => true
    | _ => false
  let streaming := parameters.any isStream
  let lowering := { context with channels := streaming }
  let written := parameters.map fun parameter ↦ match parameter with
    | .mk parameterName type =>
      TypeScript.Parameter.mk (.identifier parameterName) (some (lowerType lowering type))
  let resultType := lowerType lowering result
  let generics := fun (all : List String) ↦
    all.map fun parameter ↦ TypeScript.TypeParameter.mk .inferred parameter none none
  let channels : List TypeScript.TypeParameter := if streaming then
      [.mk .inferred "E" none (some (.keyword .never)),
        .mk .inferred "R" none (some (.keyword .never))]
    else []
  let functionType := TypeScript.Statement.typeAlias (some documentation) true name []
    (.function (generics typeParameters ++ channels) written resultType)
  match parameters with
  | [] => functionType
  | first :: rest =>
    let firstType := match first with | .mk _ type => type
    let restTypes := rest.map fun | .mk _ type => type
    if parameters.getLast?.any isStream then
      .interface (some documentation) true name [] none
        [.call (generics typeParameters ++ channels) written resultType,
          .call (generics typeParameters) written.dropLast
            (.function channels written.getLast?.toList resultType)]
    else if !rest.isEmpty &&
        (firstType == result || (headOf firstType).isSome && headOf firstType == headOf result)
    then
      let (outer, inner) := typeParameters.partition fun parameter ↦
        restTypes.any (TypeTerm.mentions parameter)
      .interface (some documentation) true name [] none
        [.call (generics typeParameters ++ channels) written resultType,
          .call (generics outer) written.tail
            (.function (generics inner) written.head?.toList resultType)]
    else functionType

end Translator.Effect
