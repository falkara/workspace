// Written by the generator of the theory from `Falkara.Simulation.Coalgebra`, so every change by hand is lost when the generator runs.
import type { HKT } from 'effect';

import type * as Functor from '#src/Functor.theory';

/**
 * A system that gives from every state its next step, in the shape that its endofunctor sets.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Endofunctor.Coalgebra
 */
export interface Coalgebra<out Endofunctor extends HKT.TypeLambda, in out State> {
  /** The function that gives the next step of the system from a state. */
  readonly structure: (state: State) => HKT.Kind<Endofunctor, never, never, never, State>;
}

/**
 * Creates a system from the instance of its endofunctor and the function that gives its next step.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Endofunctor.Coalgebra
 */
export const make =
  <Endofunctor extends HKT.TypeLambda>(_endofunctor: Functor.Functor<Endofunctor>) =>
  <State>(fields: Coalgebra<Endofunctor, State>) =>
    fields;
