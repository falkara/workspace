import { Effect, Stream } from 'effect';

import type * as Theory from '#src/Coalgebra/StreamCoalgebra.theory';

export { make, type StreamCoalgebra } from '#src/Coalgebra/StreamCoalgebra.theory';

/**
 * The behavior of a stream coalgebra, which gives from every state the stream of the outputs that the coalgebra gives from the state on.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const behavior: Theory.Behavior = (coalgebra, state) =>
  Stream.unfold(state, (current) => Effect.succeed(coalgebra.structure(current)));
