// Written by the generator of the theory from `Falkara.Simulation.SequenceCoalgebra`, so every change by hand is lost when the generator runs.
import type { Option } from 'effect';

/**
 * A sequence coalgebra, which gives from every state either nothing or an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.1
 */
export interface SequenceCoalgebra<out Output, in out State> {
  /**
   * The coalgebra structure on the state space.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 1.4.5
   */
  readonly structure: (state: State) => Option.Option<readonly [Output, State]>;
}

/**
 * Creates a `SequenceCoalgebra` from its field `structure`.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.1
 */
export const sequenceCoalgebra = <Output, State>(
  fields: SequenceCoalgebra<Output, State>,
): SequenceCoalgebra<Output, State> => fields;
