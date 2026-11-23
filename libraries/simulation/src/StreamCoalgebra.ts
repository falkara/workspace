import * as Theory from '#src/StreamCoalgebra.theory';

/**
 * A stream coalgebra, which gives from every state an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export type StreamCoalgebra<B, V> = Theory.StreamCoalgebra<B, V>;

/**
 * Creates a stream coalgebra, which gives from every state an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export const streamCoalgebra = Theory.streamCoalgebra;
