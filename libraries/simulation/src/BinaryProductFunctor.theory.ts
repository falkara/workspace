// Written by the generator of the theory from `Falkara.Simulation.BinaryProductFunctor`, so every change by hand is lost when the generator runs.

import type { HKT } from 'effect';

/**
 * The curried functor of binary products, which maps every type $X$ to the functor $Y \mapsto X \times Y$.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Limits.Types.binaryProductFunctor
 */
export interface BinaryProductFunctor<out X> extends HKT.TypeLambda {
  readonly type: readonly [X, this['Target']];
}
