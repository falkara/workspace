// Written by the generator of the theory from `Falkara.Simulation.Functor`, so every change by hand is lost when the generator runs.

import type { HKT } from 'effect';

/**
 * A functor between categories, with its action on objects and its action on morphisms.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor
 */
export interface Functor<in out F extends HKT.TypeLambda> extends HKT.TypeClass<F> {
  /** The action of a functor on morphisms. */
  readonly map: <X, Y>(
    a: (value: X) => Y,
    value: HKT.Kind<F, never, never, never, X>,
  ) => HKT.Kind<F, never, never, never, Y>;
}

/**
 * Creates a functor between categories, with its action on objects and its action on morphisms.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor
 */
export const functor = <F extends HKT.TypeLambda>(fields: Functor<F>): Functor<F> => fields;
