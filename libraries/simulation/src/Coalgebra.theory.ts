// Written by the generator of the theory from `Falkara.Simulation.Coalgebra`, so every change by hand is lost when the generator runs.
import type { HKT } from 'effect';

/**
 * A coalgebra, a state space together with a coalgebra structure on it.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Endofunctor.Coalgebra
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 1.4.5
 */
export interface Coalgebra<out Endofunctor extends HKT.TypeLambda, in out State> {
  /**
   * The coalgebra structure on the state space.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 1.4.5
   */
  readonly structure: (state: State) => HKT.Kind<Endofunctor, never, never, never, State>;
}

/**
 * Creates a `Coalgebra` from its field `structure`.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Endofunctor.Coalgebra
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 1.4.5
 */
export const make = <Endofunctor extends HKT.TypeLambda, State>(
  fields: Coalgebra<Endofunctor, State>,
) => fields;
