// Written by the generator of the theory from `Falkara.Simulation.Coalgebra`, so every change by hand is lost when the generator runs.
import type { HKT } from 'effect';

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
 * Creates a `Coalgebra` from its field `structure`, taking its types from the annotations of the parameters of the field or else from the type arguments.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Endofunctor.Coalgebra
 */
export const make = <Endofunctor extends HKT.TypeLambda, State>(
  fields: Coalgebra<Endofunctor, State>,
) => fields;
