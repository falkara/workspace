// Written by the generator of the theory from `Falkara.Simulation.SequenceCoalgebra`, so every change by hand is lost when the generator runs.

import type { Option } from 'effect';

/**
 * A sequence coalgebra, which gives from every state either nothing or an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export interface SequenceCoalgebra<out B, in out V> {
  /** structure morphism of the coalgebra */
  readonly str: (value: V) => Option.Option<readonly [B, V]>;
}

/**
 * Creates a sequence coalgebra, which gives from every state either nothing or an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export const sequenceCoalgebra = <B, V>(fields: SequenceCoalgebra<B, V>): SequenceCoalgebra<B, V> =>
  fields;
