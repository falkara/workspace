// Written by the generator of the theory from `Falkara.Simulation.StreamCoalgebra`, so every change by hand is lost when the generator runs.

/**
 * A stream coalgebra, which gives from every state an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export interface StreamCoalgebra<out B, in out V> {
  /** structure morphism of the coalgebra */
  readonly str: (value: V) => readonly [B, V];
}

/**
 * Creates a stream coalgebra, which gives from every state an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export const streamCoalgebra = <B, V>(fields: StreamCoalgebra<B, V>): StreamCoalgebra<B, V> =>
  fields;
