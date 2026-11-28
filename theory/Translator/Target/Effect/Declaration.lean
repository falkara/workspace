/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Core.Declaration
public import Translator.Target.Effect.Type

import Translator.Path
import Translator.Target.Effect.Schema
import Translator.Target.Effect.Shape
import Translator.Target.TypeScript.Name

/-!
# Declaration

The module defines the declarations of TypeScript that a declaration of the core takes in Effect. A
structure of data takes a schema of Effect branded by its name, with a field for every field of the
structure, as `Schema.Struct({ X: Schema.Rational, … }).pipe(Schema.brand('Tristimulus'))`, a type
of the same name for what the schema decodes, and a constructor, which brands a value by
`Brand.nominal`. A refinement takes the schema of its type with a filter that calls its condition
and the brand of its name, and a type of the same name. A structure with type parameters takes an
interface with a field for every field and a constructor that gives a value as a caller writes it. A
bundled structure takes the same interface, extending the label of its structure where it has one,
and a constructor that takes an instance of the class of functors for every functor among its type
parameters before its fields. A functor and a type constructor take an interface that extends the
type lambda of Effect, with their object at the object of the lambda as its type, and a curried
functor the same with a type parameter for the type it maps, after an interface of the structure
that its object gives where its declaration names the fields of the structure. A class of functors
takes an interface that extends the type class of Effect, a constructor, and the predicates of its
axioms, a function of an instance and of an equivalence of the values of the functor. A type alias
takes a type alias, a function the declaration of its signature, and a value a constant of its
type. Every declaration and every field takes its documentation comment.

## Implementation Notes

A declaration takes its name in Pascal case, such as `Tristimulus`, and its value, its constructor,
and the predicates of its axioms in camel case, `make` and `axioms` where it takes the name of its
module, as Effect names a constructor, such as `Tristimulus.make`.

A structure takes a schema in place of a type alone, so a value from outside the package takes the
brand of the structure only by decoding, which checks every field, and a brand of Effect, as two
structures with the same fields, such as a color and a change of a color, stay apart in TypeScript
only by their brands. Its constructor brands a value by `Brand.nominal` of Effect, which checks
nothing, as the schemas hold no checks.

A refinement takes no constructor, as its value takes the brand only through the filter, which the
schema runs on decoding.

A rational number takes `Rational.makeUnsafe` of Effect, which throws only on a denominator of 0, as
a rational number of Lean has a positive denominator.
-/

public section

namespace Translator.Effect

/-- Gives the documentation comment of TypeScript that a documentation of the core takes. -/
def documentationOf (documentation : Core.Documentation) : TypeScript.Documentation :=
  { text := documentation.text, addresses := documentation.addresses }

/-- Gives the name that a declaration takes as a type, its words in Pascal case. -/
def typeNameOf (reference : Core.Reference) : String :=
  TypeScript.pascalCaseOf reference.words

/-- Gives the name that a declaration takes as a value, its words in camel case. -/
def valueNameOf (reference : Core.Reference) : String :=
  TypeScript.camelCaseOf reference.words

/-- Gives the name of the constructor of a structure: `make` where it takes the name of its module,
and its words in camel case otherwise. -/
def constructorNameOf (reference : Core.Reference) : String :=
  if reference.takesModuleName then "make" else valueNameOf reference

/-- Gives the type of TypeScript that the object of a type lambda that is a parameter takes at a
type, `HKT.Kind<F, never, never, never, X>`. -/
def kindOf (functor : String) (object : TypeScript.TypeExpression) : TypeScript.TypeExpression :=
  .reference (.symbol (.effect "HKT" "Kind"))
    [.reference (.identifier functor) [], .keyword .never, .keyword .never, .keyword .never, object]

/-- Gives the expression of TypeScript that writes a value of the core, a rational number by
`Rational.fromBigInt` or `Rational.makeUnsafe`, a structure by its constructor with a value for
every field, and a pair as a tuple. -/
def initializerOf : Core.Value → TypeScript.Expression
  | .rational numerator 1 =>
    .call (.symbol (.effect "Rational" "fromBigInt")) [.literal (.bigInt numerator)]
  | .rational numerator denominator =>
    .call (.symbol (.effect "Rational" "makeUnsafe"))
      [.literal (.bigInt numerator), .literal (.bigInt denominator)]
  | .structure declaration fields =>
    .call (.identifier (constructorNameOf declaration))
      [.object (initializersOf fields)]
  | .pair first second => .array [initializerOf first, initializerOf second]
where
  /-- Gives a property of the object of a structure for every field. -/
  initializersOf : List (String × Core.Value) → List TypeScript.Property
    | [] => []
    | (name, value) :: rest => .mk none name (initializerOf value) :: initializersOf rest

/-- Gives the expression of TypeScript that a morphism of a law takes: a variable by its name, an
identity as `Function.identity`, a composite as `Function.flow`, and the action of the functor on a
morphism as `instance.map`, each with its types. -/
def morphismOf (context : Context) : Core.Morphism Core.TypeTerm → TypeScript.Expression
  | .parameter name => .identifier name
  | .identity type =>
    .instantiation (.symbol (.effect "Function" "identity")) [lowerType context type]
  | .compose first second =>
    .call (.symbol (.effect "Function" "flow"))
      [morphismOf context first, morphismOf context second]
  | .map domain codomain morphism =>
    .call (.instantiation (.member (.identifier "instance") "map")
        [lowerType context domain, lowerType context codomain])
      [morphismOf context morphism]

/-- Gives the predicate of TypeScript that a law takes, a function of the variables of the law and
of a value of the domain of its morphisms that tells by `equivalence` whether the two morphisms
give one value. -/
def lawOf (context : Context) (law : Core.Law Core.TypeTerm) : TypeScript.Property :=
  let equivalence : TypeScript.Expression := match law.equivalence with
    | some object => .instantiation (.identifier "equivalence") [lowerType context object]
    | none => .identifier "equivalence"
  .mk (some (documentationOf law.documentation)) law.name
    (.arrow (law.typeParameters.map fun parameter ↦ .mk .inferred parameter none none)
      ((law.parameters.map fun (name, type) ↦
          .mk (.identifier name) (some (lowerType context type))) ++
        [.mk (.identifier "value") (some (lowerType context law.domain))])
      .inline (some (.keyword .boolean))
      (.expression (.call equivalence
        [.call (.parenthesized (morphismOf context law.left)) [.identifier "value"],
          .call (.parenthesized (morphismOf context law.right)) [.identifier "value"]])))

/-- Gives the members of TypeScript that the fields of a structure take, each a read-only property
with its documentation comment. -/
def membersOf (context : Context) (fields : List (Core.Field Core.TypeTerm)) :
    List TypeScript.Member :=
  fields.map fun field ↦
    .property (some (documentationOf field.documentation)) field.name (lowerType context field.type)

/-- Gives the type parameters of TypeScript of a declaration, each with the variance at which it
occurs in the given types of the declaration. -/
def typeParametersOf (context : Context) (types : List Core.TypeTerm)
    (typeParameters : List (Core.TypeParameter Core.Argument)) : List TypeScript.TypeParameter :=
  typeParameters.map fun parameter ↦
    typeParameterOf context (varianceOf parameter.name types) parameter

/-- Gives the declarations of TypeScript that a declaration of the core takes in a file of a
module of the theory, with the class of functors, where the theory gives one. -/
def lowerDeclaration (context : Context) (functorClass : Option Core.Reference) :
    Core.Declaration Core.TypeTerm Core.Argument Core.Schema → List TypeScript.Statement
  | .data reference documentation schema constructor fields =>
    let typeName := typeNameOf reference
    [.constant (some (documentationOf schema)) true typeName none
        (.call
          (.member
            (.call (.symbol (.effect "Schema" "Struct"))
              [.object (fields.map fun field ↦
                .mk (some (documentationOf field.documentation)) field.name
                  (lowerSchema context field.type))])
            "pipe")
          [.call (.symbol (.effect "Schema" "brand")) [.literal (.string typeName)]]),
      .typeAlias (some (documentationOf documentation)) true typeName []
        (.query (.qualified typeName "Type")),
      .constant (some (documentationOf constructor)) true (constructorNameOf reference) none
        (.call
          (.instantiation (.symbol (.effect "Brand" "nominal"))
            [.reference (.identifier typeName) []])
          [])]
  | .refinement reference documentation schema base condition =>
    let typeName := typeNameOf reference
    [.constant (some (documentationOf schema)) true typeName none
        (.call (.member (lowerSchema context base) "pipe")
          [.call (.symbol (.effect "Schema" "check"))
              [.call (.symbol (.effect "Schema" "makeFilter"))
                [.symbol (.check (pathOf context.theory condition.module)
                  (valueNameOf condition))]],
            .call (.symbol (.effect "Schema" "brand")) [.literal (.string typeName)]]),
      .typeAlias (some (documentationOf documentation)) true typeName []
        (.query (.qualified typeName "Type"))]
  | .structure reference documentation constructor typeParameters fields =>
    let typeName := typeNameOf reference
    let arguments := typeParameters.map fun parameter ↦
      TypeScript.TypeExpression.reference (.identifier parameter.name) []
    [.interface (some (documentationOf documentation)) true typeName
        (typeParametersOf context (fields.map (·.type)) typeParameters) none
        (membersOf context fields),
      .constant (some (documentationOf constructor)) true (constructorNameOf reference) none
        (.arrow (typeParameters.map fun parameter ↦ .mk .inferred parameter.name none none)
          [.mk (.identifier "fields") (some (.reference (.identifier typeName) arguments))] .inline
          none (.expression (.identifier "fields")))]
  | .bundle reference documentation constructor typeParameters extended fields =>
    let typeName := typeNameOf reference
    -- The constructor leaves every parameter with a default value at its default, such as the
    -- identity monad of a kind of system, as TypeScript infers no type through a type lambda that
    -- a parameter applies.
    let constructed := typeParameters.filter (·.default.isNone)
    let (functors, others) := constructed.partition (·.kind == .functor)
    let generics := fun (all : List (Core.TypeParameter Core.Argument)) ↦
      all.map (typeParameterOf context .inferred)
    let fieldsFunction := TypeScript.Expression.arrow (generics others)
      [.mk (.identifier "fields") (some (.reference (.identifier typeName)
        (constructed.map fun parameter ↦ .reference (.identifier parameter.name) [])))]
      .inline none (.expression (.identifier "fields"))
    -- A functor among the parameters takes an instance of the class of functors in a call of its
    -- own before the fields, so TypeScript infers the other parameters from the fields, and the
    -- constructor leaves every instance unused, named as its functor after an underscore.
    let constructorValue := if functors.isEmpty then
        TypeScript.Expression.arrow (generics constructed)
          [.mk (.identifier "fields") (some (.reference (.identifier typeName)
            (constructed.map fun parameter ↦ .reference (.identifier parameter.name) [])))]
          .inline none (.expression (.identifier "fields"))
      else
        .arrow (generics functors)
          (functors.map fun parameter ↦ .mk (.identifier s!"_{parameter.name.decapitalize}")
            (some (.reference ((functorClass.map (nameOf context)).getD (.identifier ""))
              [.reference (.identifier parameter.name) []])))
          .inline none (.expression fieldsFunction)
    [.interface (some (documentationOf documentation)) true typeName
        (typeParametersOf context (fields.map (·.type)) typeParameters)
        (extended.map (lowerType context)) (membersOf context fields),
      .constant (some (documentationOf constructor)) true (constructorNameOf reference) none
        constructorValue]
  | .lambda reference documentation typeParameters object =>
    [.interface (some (documentationOf documentation)) true (typeNameOf reference)
      (typeParametersOf context [object] typeParameters)
      (some (.reference (.symbol (.effect "HKT" "TypeLambda")) []))
      [.property none "type" (lowerType context object)]]
  | .curried reference documentation typeParameters parameter object record =>
    let lambda := fun (type : TypeScript.TypeExpression) ↦ TypeScript.Statement.interface
      (some (documentationOf documentation)) true (typeNameOf reference)
      (typeParametersOf context [object] typeParameters ++
        [.mk (varianceOf parameter [object]) parameter none none])
      (some (.reference (.symbol (.effect "HKT" "TypeLambda")) []))
      [.property none "type" type]
    match record with
    | none => [lambda (lowerType context object)]
    -- An object that is a structure whose fields the theory names takes an interface of its own,
    -- named as the theory names the structure, with a type parameter for every field, as
    -- TypeScript refuses `this['Target']` within a type literal.
    | some record =>
      [.interface (some (documentationOf record.documentation)) true record.name
          (record.parameters.map fun name ↦ .mk .covariant name none none) none
          (record.fields.map fun (name, documentation, parameterName) ↦
            .property (some (documentationOf documentation)) name
              (.reference (.identifier parameterName) [])),
        lambda (.reference (.identifier record.name) (record.arguments.map (lowerType context)))]
  | .functorClass reference documentation constructor axioms functor fields laws =>
    let typeName := typeNameOf reference
    let generic : TypeScript.TypeParameter :=
      .mk .inferred functor (some (.reference (.symbol (.effect "HKT" "TypeLambda")) [])) none
    let instanceType := TypeScript.TypeExpression.reference (.identifier typeName)
      [.reference (.identifier functor) []]
    [.interface (some (documentationOf documentation)) true typeName
        [.mk (varianceOf functor (fields.map (·.type))) functor
          (some (.reference (.symbol (.effect "HKT" "TypeLambda")) [])) none]
        (some (.reference (.symbol (.effect "HKT" "TypeClass"))
          [.reference (.identifier functor) []]))
        (membersOf context fields),
      .constant (some (documentationOf constructor)) true (constructorNameOf reference) none
        (.arrow [generic] [.mk (.identifier "fields") (some instanceType)] .inline none
          (.expression (.identifier "fields"))),
      .constant (some (documentationOf axioms)) true
        (if reference.takesModuleName then "axioms" else s!"{valueNameOf reference}Axioms") none
        (.arrow [generic]
          [.mk (.identifier "instance") (some instanceType),
            .mk (.identifier "equivalence")
              (some (.function [.mk .inferred "X" none none]
                [.mk (.identifier "self")
                    (some (kindOf functor (.reference (.identifier "X") []))),
                  .mk (.identifier "that")
                    (some (kindOf functor (.reference (.identifier "X") [])))]
                (.keyword .boolean)))]
          .lines none (.expression (.parenthesized (.object (laws.map (lawOf context))))))]
  | .alias reference documentation typeParameters type =>
    [.typeAlias (some (documentationOf documentation)) true (typeNameOf reference)
      (typeParametersOf context [type] typeParameters) (lowerType context type)]
  | .function reference documentation typeParameters bundledParameters signature =>
    [functionStatementOf context (documentationOf documentation) (typeNameOf reference)
      (typeParameters ++ bundledParameters) signature]
  | .value reference documentation type value =>
    [.constant (some (documentationOf documentation)) true (valueNameOf reference)
      (some (lowerType context type)) (initializerOf value)]
  | .instance .. => []

end Translator.Effect
