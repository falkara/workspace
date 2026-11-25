import { Effect, Option, Stream } from 'effect';

import type * as Theory from '#src/Coalgebra/SequenceCoalgebra.theory';

export { make, type SequenceCoalgebra } from '#src/Coalgebra/SequenceCoalgebra.theory';

/**
 * The behavior of a sequence coalgebra, which gives from every state the sequence of the outputs that the coalgebra gives from the state on until it gives nothing.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const behavior: Theory.Behavior = (coalgebra, state) =>
  Stream.unfold(state, (current) =>
    Effect.succeed(
      Option.getOrUndefined(
        Option.map(coalgebra.structure(current), ({ output, next }) => [output, next] as const),
      ),
    ),
  );
