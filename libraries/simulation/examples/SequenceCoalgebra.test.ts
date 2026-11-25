import { describe, it } from '@effect/vitest';
import { assertEquals } from '@effect/vitest/utils';
import * as SequenceCoalgebra from '@falkara/simulation/Coalgebra/SequenceCoalgebra';
import { Effect, HashSet, Option, Stream } from 'effect';

import { type Board, generation } from './GameOfLife';

describe('SequenceCoalgebra', () => {
  it.effect('ends the game of a board that dies out', () =>
    Effect.gen(function* () {
      const system = SequenceCoalgebra.make({
        structure: (board: Board) =>
          HashSet.isEmpty(board) ? Option.none() : Option.some([board, generation(board)]),
      });

      const outputs = yield* Stream.runCollect(
        SequenceCoalgebra.behavior(system, HashSet.make('0,0', '1,0')),
      );

      assertEquals(outputs, [HashSet.make('0,0', '1,0')]);
    }),
  );
});
