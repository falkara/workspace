import * as Theory from '#src/SequenceCoalgebra.theory';

/**
 * A sequence coalgebra, which gives from every state either nothing or an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export type SequenceCoalgebra<B, V> = Theory.SequenceCoalgebra<B, V>;

/**
 * Creates a sequence coalgebra, which gives from every state either nothing or an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export const sequenceCoalgebra = Theory.sequenceCoalgebra;
