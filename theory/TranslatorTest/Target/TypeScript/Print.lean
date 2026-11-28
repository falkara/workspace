module

meta import Translator.Target.TypeScript.Print

/-!
# Print

The module defines the checks of the text of the syntax of TypeScript against the text that the
translator writes: a module of declarations with its header and its groups of imports, a module of
tests whose blocks set every documented test apart by a blank line, the factory of the axioms of a
class of functors with its parameters on lines and its documented properties on lines, interfaces
with variances, constraints, default types, an extended interface, call signatures, and the object
of a type lambda, and constants of literals, unions, tuples, keywords, and elements.

## Implementation Notes

The checks compare the printed text with the text that the translator writes by `#guard_msgs` on
`#eval`, as `#guard` emits no message on success, which the linter `linter.hashCommand` of Mathlib
refuses, and the expected TypeScript stands in each check as the translator writes it.
-/

open Translator.TypeScript

/--
info: // Written by the translator from `TranslatorTest.Fixture.Point`, so every change by hand is lost when the translator runs.
import { Brand, type Option, Schema } from 'effect';

import * as Coordinate from '#src/Fixture/Coordinate.theory';
import type * as Module from '#src/Fixture/Point';

/** A schema of a point, which decodes its first coordinate. */
export const Point = Schema.Struct({
/** The first coordinate of the point. */
first: Coordinate.Coordinate,
}).pipe(Schema.brand('Point'));

/** A point by its first coordinate. */
export type Point = typeof Point.Type;

/** Brands a point from its first coordinate without a check. */
export const make = Brand.nominal<Point>();

/** Gives the point at a coordinate. */
export type PointAt = (coordinate: Coordinate.Coordinate) => Option.Option<Point>;

/** A contract of the functions of the theory that the module `Fixture/Point` of the package implements. */
interface Contract {
/** Gives the point at a coordinate. */
readonly pointAt: PointAt;
}

/** A check of the module `Fixture/Point` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
-/
#guard_msgs in
#eval IO.print (Module.print {
  header := "Written by the translator from `TranslatorTest.Fixture.Point`, so every \
    change by hand is lost when the translator runs."
  imports := [
    [.named false [⟨false, "Brand"⟩, ⟨true, "Option"⟩, ⟨false, "Schema"⟩] "effect"],
    [.namespaced false "Coordinate" "#src/Fixture/Coordinate.theory",
      .namespaced true "Module" "#src/Fixture/Point"]]
  statements := [
    .constant (some ⟨"A schema of a point, which decodes its first coordinate.", []⟩) true "Point"
      none
      (.call
        (.member
          (.call (.symbol (.effect "Schema" "Struct"))
            [.object [.mk (some ⟨"The first coordinate of the point.", []⟩) "first"
              (.member (.identifier "Coordinate") "Coordinate")]])
          "pipe")
        [.call (.symbol (.effect "Schema" "brand")) [.literal (.string "Point")]]),
    .typeAlias (some ⟨"A point by its first coordinate.", []⟩) true "Point" []
      (.query (.qualified "Point" "Type")),
    .constant (some ⟨"Brands a point from its first coordinate without a check.", []⟩) true "make"
      none
      (.call
        (.instantiation (.symbol (.effect "Brand" "nominal")) [.reference (.identifier "Point") []])
        []),
    .typeAlias (some ⟨"Gives the point at a coordinate.", []⟩) true "PointAt" []
      (.function []
        [.mk (.identifier "coordinate")
          (some (.reference (.qualified "Coordinate" "Coordinate") []))]
        (.reference (.symbol (.effect "Option" "Option")) [.reference (.identifier "Point") []])),
    .interface
      (some ⟨"A contract of the functions of the theory that the module `Fixture/Point` of the \
        package implements.", []⟩)
      false "Contract" [] none
      [.property (some ⟨"Gives the point at a coordinate.", []⟩) "pointAt"
        (.reference (.identifier "PointAt") [])],
    .typeAlias
      (some ⟨"A check of the module `Fixture/Point` of the package, which fails to compile where \
        the module leaves a function of the contract out or gives the function another type.", []⟩)
      false "_Implemented"
      [.mk .inferred "Implementation" (some (.reference (.identifier "Contract") []))
        (some (.query (.identifier "Module")))]
      (.reference (.identifier "Implementation") [])] })

/--
info: // Written by the translator from `TranslatorTest.Fixture.Point`, so every change by hand is lost when the translator runs.
import { describe, expect, it } from '@effect/vitest';
import { Equal, Option } from 'effect';

import * as Coordinate from '#src/Fixture/Coordinate';
import * as Point from '#src/Fixture/Point';

describe('Fixture/Point', () => {
/** The point at a coordinate is the point whose first coordinate it is. */
it.prop('pointAt_first', { coordinate: Coordinate.Coordinate }, ({ coordinate }) => {
const actual = Point.pointAt(coordinate);
const expected = Option.some(Point.make({ first: coordinate }));
expect(actual).toEqual(expected);
});

/** The points at two equal coordinates are equal. */
it.prop('pointAt_eq', { first: Coordinate.Coordinate, second: Coordinate.Coordinate }, ({ first, second }) => {
if (!Equal.equals(first, second)) {
return;
}
const actual = Point.pointAt(first);
const expected = Point.pointAt(second);
expect(actual).toEqual(expected);
});
});
-/
#guard_msgs in
#eval IO.print (Module.print {
  header := "Written by the translator from `TranslatorTest.Fixture.Point`, so every \
    change by hand is lost when the translator runs."
  imports := [
    [.named false [⟨false, "describe"⟩, ⟨false, "expect"⟩, ⟨false, "it"⟩] "@effect/vitest",
      .named false [⟨false, "Equal"⟩, ⟨false, "Option"⟩] "effect"],
    [.namespaced false "Coordinate" "#src/Fixture/Coordinate",
      .namespaced false "Point" "#src/Fixture/Point"]]
  statements := [
    .expression none
      (.call (.identifier "describe")
        [.literal (.string "Fixture/Point"),
          .arrow [] [] .inline none (.block [
            .expression
              (some ⟨"The point at a coordinate is the point whose first coordinate it is.", []⟩)
              (.call (.member (.identifier "it") "prop")
                [.literal (.string "pointAt_first"),
                  .object [.mk none "coordinate" (.member (.identifier "Coordinate") "Coordinate")],
                  .arrow [] [.mk (.object ["coordinate"]) none] .inline none (.block [
                    .constant none false "actual" none
                      (.call (.member (.identifier "Point") "pointAt") [.identifier "coordinate"]),
                    .constant none false "expected" none
                      (.call (.symbol (.effect "Option" "some"))
                        [.call (.member (.identifier "Point") "make")
                          [.object [.mk none "first" (.identifier "coordinate")]]]),
                    .expression none
                      (.call (.member (.call (.identifier "expect") [.identifier "actual"])
                        "toEqual") [.identifier "expected"])])]),
            .expression (some ⟨"The points at two equal coordinates are equal.", []⟩)
              (.call (.member (.identifier "it") "prop")
                [.literal (.string "pointAt_eq"),
                  .object [
                    .mk none "first" (.member (.identifier "Coordinate") "Coordinate"),
                    .mk none "second" (.member (.identifier "Coordinate") "Coordinate")],
                  .arrow [] [.mk (.object ["first", "second"]) none] .inline none (.block [
                    .returnIf (.not (.call (.symbol (.effect "Equal" "equals"))
                      [.identifier "first", .identifier "second"])),
                    .constant none false "actual" none
                      (.call (.member (.identifier "Point") "pointAt") [.identifier "first"]),
                    .constant none false "expected" none
                      (.call (.member (.identifier "Point") "pointAt") [.identifier "second"]),
                    .expression none
                      (.call (.member (.call (.identifier "expect") [.identifier "actual"])
                        "toEqual") [.identifier "expected"])])])])])] })

/--
info: /**
 * Gives the predicates that tell whether an instance preserves identity morphisms and composition, comparing the values of its endofunctor by the given equivalence.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor
 */
export const axioms = <Endofunctor extends HKT.TypeLambda>(
instance: Functor<Endofunctor>,
equivalence: <X>(self: HKT.Kind<Endofunctor, never, never, never, X>, that: HKT.Kind<Endofunctor, never, never, never, X>) => boolean,
) => ({
/** The predicate that tells whether the instance preserves identity morphisms. */
map_id: <X>(value: HKT.Kind<Endofunctor, never, never, never, X>): boolean => equivalence<X>((instance.map<X, X>(Function.identity<X>))(value), (Function.identity<HKT.Kind<Endofunctor, never, never, never, X>>)(value)),
});
-/
#guard_msgs in
#eval
  let kind := fun (object : TypeExpression) ↦
    TypeExpression.reference (.symbol (.effect "HKT" "Kind"))
      [.reference (.identifier "Endofunctor") [], .keyword .never, .keyword .never,
        .keyword .never, object]
  let element := TypeExpression.reference (.identifier "X") []
  IO.print (Statement.print
    (.constant
      (some ⟨"Gives the predicates that tell whether an instance preserves identity morphisms \
        and composition, comparing the values of its endofunctor by the given equivalence.",
        ["https://leanprover-community.github.io/mathlib4_docs/find/\
          #doc/CategoryTheory.Functor"]⟩)
      true "axioms" none
      (.arrow
        [.mk .inferred "Endofunctor" (some (.reference (.symbol (.effect "HKT" "TypeLambda")) []))
          none]
        [.mk (.identifier "instance")
            (some (.reference (.identifier "Functor") [.reference (.identifier "Endofunctor") []])),
          .mk (.identifier "equivalence")
            (some (.function [.mk .inferred "X" none none]
              [.mk (.identifier "self") (some (kind element)),
                .mk (.identifier "that") (some (kind element))]
              (.keyword .boolean)))]
        .lines none
        (.expression (.parenthesized (.object [
          .mk (some ⟨"The predicate that tells whether the instance preserves identity morphisms.",
              []⟩)
            "map_id"
            (.arrow [.mk .inferred "X" none none]
              [.mk (.identifier "value") (some (kind element))] .inline (some (.keyword .boolean))
              (.expression
                (.call (.instantiation (.identifier "equivalence") [element])
                  [.call
                      (.parenthesized
                        (.call
                          (.instantiation (.member (.identifier "instance") "map")
                            [element, element])
                          [.instantiation (.symbol (.effect "Function" "identity")) [element]]))
                      [.identifier "value"],
                    .call
                      (.parenthesized
                        (.instantiation (.symbol (.effect "Function" "identity")) [kind element]))
                      [.identifier "value"]])))]))))))

/--
info: /**
 * A stream coalgebra, which gives from every state an output and the next state in a monad.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Corollary 2.3.6.1
 */
export interface StreamCoalgebra<in out Output, in out State, out Monad extends HKT.TypeLambda = Functor.Id> extends Coalgebra.Coalgebra<Functor.Comp<BinaryProductFunctor.BinaryProductFunctor<Output>, Monad>, State> {
/** The function that gives the next step of the system from a state. */
readonly structure: (state: State) => HKT.Kind<Monad, never, never, never, { readonly output: Output; readonly next: State }>;
}
/** The coalgebra that maps every output of a stream coalgebra by a function, upon the state space of the coalgebra. */
export interface MapOutput {
<Output, MappedOutput, State>(coalgebra: StreamCoalgebra<Output, State>, f: (output: Output) => MappedOutput): StreamCoalgebra<MappedOutput, State>;
<Output, MappedOutput>(f: (output: Output) => MappedOutput): <State>(coalgebra: StreamCoalgebra<Output, State>) => StreamCoalgebra<MappedOutput, State>;
}
/** A functor of binary products, which maps every type to its binary product with the factor. */
export interface BinaryProductFunctor<out Factor> extends HKT.TypeLambda {
readonly type: Product<Factor, this['Target']>;
}
-/
#guard_msgs in
#eval
  let output := TypeExpression.reference (.identifier "Output") []
  let state := TypeExpression.reference (.identifier "State") []
  let coalgebra := fun (outputType : TypeExpression) ↦
    TypeExpression.reference (.identifier "StreamCoalgebra") [outputType, state]
  let mapping := TypeExpression.function [] [.mk (.identifier "output") (some output)]
    (.reference (.identifier "MappedOutput") [])
  IO.print (Statement.print
    (.interface
      (some ⟨"A stream coalgebra, which gives from every state an output and the next state in a \
        monad.", ["https://doi.org/10.1017/CBO9781316823187 Corollary 2.3.6.1"]⟩)
      true "StreamCoalgebra"
      [.mk .invariant "Output" none none, .mk .invariant "State" none none,
        .mk .covariant "Monad" (some (.reference (.symbol (.effect "HKT" "TypeLambda")) []))
          (some (.reference (.qualified "Functor" "Id") []))]
      (some (.reference (.qualified "Coalgebra" "Coalgebra")
        [.reference (.qualified "Functor" "Comp")
          [.reference (.qualified "BinaryProductFunctor" "BinaryProductFunctor") [output],
            .reference (.identifier "Monad") []],
          state]))
      [.property (some ⟨"The function that gives the next step of the system from a state.", []⟩)
        "structure"
        (.function [] [.mk (.identifier "state") (some state)]
          (.reference (.symbol (.effect "HKT" "Kind"))
            [.reference (.identifier "Monad") [], .keyword .never, .keyword .never,
              .keyword .never,
              .object [.property none "output" output, .property none "next" state]]))]) ++
  Statement.print
    (.interface
      (some ⟨"The coalgebra that maps every output of a stream coalgebra by a function, upon the \
        state space of the coalgebra.", []⟩)
      true "MapOutput" [] none
      [.call
          [.mk .inferred "Output" none none, .mk .inferred "MappedOutput" none none,
            .mk .inferred "State" none none]
          [.mk (.identifier "coalgebra") (some (coalgebra output)),
            .mk (.identifier "f") (some mapping)]
          (coalgebra (.reference (.identifier "MappedOutput") [])),
        .call [.mk .inferred "Output" none none, .mk .inferred "MappedOutput" none none]
          [.mk (.identifier "f") (some mapping)]
          (.function [.mk .inferred "State" none none]
            [.mk (.identifier "coalgebra") (some (coalgebra output))]
            (coalgebra (.reference (.identifier "MappedOutput") [])))]) ++
  Statement.print
    (.interface
      (some ⟨"A functor of binary products, which maps every type to its binary product with the \
        factor.", []⟩)
      true "BinaryProductFunctor" [.mk .covariant "Factor" none none]
      (some (.reference (.symbol (.effect "HKT" "TypeLambda")) []))
      [.property none "type"
        (.reference (.identifier "Product")
          [.reference (.identifier "Factor") [], .indexed .this (.literal (.string "Target"))])]))

/--
info: const machine = MealyMachine.make({ structure: (state: 0 | 1 | 2) => (input: 0 | 1 | 2) => machineTable[state][input] });
export const corner: Point = point({ x: Rational.makeUnsafe(1n, 2n), y: Rational.fromBigInt(-3n) });
type Literals = readonly [Rational.Rational, ReadonlyArray<Rational.Rational>, string, boolean, void];
Schema.Literals([0, 1, 2])
-/
#guard_msgs in
#eval
  let values := TypeExpression.union
    [.literal (.number 0), .literal (.number 1), .literal (.number 2)]
  IO.print (Statement.print
    (.constant none false "machine" none
      (.call (.member (.identifier "MealyMachine") "make")
        [.object [.mk none "structure"
          (.arrow [] [.mk (.identifier "state") (some values)] .inline none
            (.expression (.arrow [] [.mk (.identifier "input") (some values)] .inline none
              (.expression
                (.element (.element (.identifier "machineTable") (.identifier "state"))
                  (.identifier "input"))))))]])) ++
  Statement.print
    (.constant none true "corner" (some (.reference (.identifier "Point") []))
      (.call (.identifier "point")
        [.object [
          .mk none "x"
            (.call (.symbol (.effect "Rational" "makeUnsafe"))
              [.literal (.bigInt 1), .literal (.bigInt 2)]),
          .mk none "y"
            (.call (.symbol (.effect "Rational" "fromBigInt")) [.literal (.bigInt (-3))])]])) ++
  Statement.print
    (.typeAlias none false "Literals" []
      (.tuple [.reference (.symbol (.effect "Rational" "Rational")) [],
        .reference (.identifier "ReadonlyArray")
          [.reference (.symbol (.effect "Rational" "Rational")) []],
        .keyword .string, .keyword .boolean, .keyword .void])) ++
  Expression.print
    (.call (.symbol (.effect "Schema" "Literals"))
      [.array [.literal (.number 0), .literal (.number 1), .literal (.number 2)]]))
