// Written by the generator of the theory from `Falkara.Simulation.Functor`, so every change by hand is lost when the generator runs.

import { Function, type HKT } from 'effect';

/**
 * A functor between categories, with its action on objects and its action on morphisms.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor
 */
export interface Functor<in out F extends HKT.TypeLambda> extends HKT.TypeClass<F> {
  /** The action of a functor on morphisms. */
  readonly map: <X, Y>(
    a: (value: X) => Y,
  ) => (value: HKT.Kind<F, never, never, never, X>) => HKT.Kind<F, never, never, never, Y>;
}

/**
 * Creates a functor between categories, with its action on objects and its action on morphisms.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor
 */
export const functor = <F extends HKT.TypeLambda>(fields: Functor<F>): Functor<F> => fields;

/**
 * Gives the axioms of a functor between categories, with its action on objects and its action on morphisms.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor
 */
export const functorAxioms = <F extends HKT.TypeLambda>(
  instance: Functor<F>,
  equivalence: <X>(
    self: HKT.Kind<F, never, never, never, X>,
    that: HKT.Kind<F, never, never, never, X>,
  ) => boolean,
) => ({
  /** A functor preserves identity morphisms. */
  map_id: <X>(value: HKT.Kind<F, never, never, never, X>): boolean =>
    equivalence<X>(
      instance.map<X, X>(Function.identity<X>)(value),
      (Function.identity<HKT.Kind<F, never, never, never, X>>)(value),
    ),
  /** A functor preserves composition. */
  map_comp: <X, Y, Z>(
    f: (value: X) => Y,
    g: (value: Y) => Z,
    value: HKT.Kind<F, never, never, never, X>,
  ): boolean =>
    equivalence<Z>(
      instance.map<X, Z>(Function.flow(f, g))(value),
      Function.flow(instance.map<X, Y>(f), instance.map<Y, Z>(g))(value),
    ),
});
