// Written by the generator of the theory from `Falkara.Simulation.Functor`, so every change by hand is lost when the generator runs.
import { Function, type HKT } from 'effect';

/**
 * A functor between categories, with its action on objects and its action on morphisms.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor
 */
export interface Functor<
  in out Endofunctor extends HKT.TypeLambda,
> extends HKT.TypeClass<Endofunctor> {
  /** The action of a functor on morphisms. */
  readonly map: <X, Y>(
    a: (x: X) => Y,
  ) => (
    value: HKT.Kind<Endofunctor, never, never, never, X>,
  ) => HKT.Kind<Endofunctor, never, never, never, Y>;
}

/**
 * Creates a `Functor` from its field `map`.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor
 */
export const functor = <Endofunctor extends HKT.TypeLambda>(fields: Functor<Endofunctor>) => fields;

/**
 * Gives the axioms of a `Functor` as predicates of an instance.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor
 */
export const functorAxioms = <Endofunctor extends HKT.TypeLambda>(
  instance: Functor<Endofunctor>,
  equivalence: <X>(
    self: HKT.Kind<Endofunctor, never, never, never, X>,
    that: HKT.Kind<Endofunctor, never, never, never, X>,
  ) => boolean,
) => ({
  /** The predicate that tells whether the instance preserves identity morphisms. */
  map_id: <X>(value: HKT.Kind<Endofunctor, never, never, never, X>): boolean =>
    equivalence<X>(
      instance.map<X, X>(Function.identity<X>)(value),
      (Function.identity<HKT.Kind<Endofunctor, never, never, never, X>>)(value),
    ),
  /** The predicate that tells whether the instance preserves composition. */
  map_comp: <X, Y, Z>(
    f: (x: X) => Y,
    g: (y: Y) => Z,
    value: HKT.Kind<Endofunctor, never, never, never, X>,
  ): boolean =>
    equivalence<Z>(
      instance.map<X, Z>(Function.flow(f, g))(value),
      Function.flow(instance.map<X, Y>(f), instance.map<Y, Z>(g))(value),
    ),
});
