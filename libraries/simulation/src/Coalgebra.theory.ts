// Written by the generator of the theory from `Falkara.Simulation.Coalgebra`, so every change by hand is lost when the generator runs.
import type { HKT } from 'effect';

/**
 * A coalgebra, a state space together with a coalgebra structure on it.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Endofunctor.Coalgebra
 */
export interface Coalgebra<out Endofunctor extends HKT.TypeLambda, in out State> {
  /** The coalgebra structure on the state space. */
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
