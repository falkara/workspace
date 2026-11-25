import { describe, it } from '@effect/vitest';
import { assertEquals } from '@effect/vitest/utils';
import { SequenceCoalgebra } from '@falkara/simulation';
import { Effect, HashSet, Option, Stream } from 'effect';

import { type Board, generation } from './GameOfLife';

describe('SequenceCoalgebra', () => {
  it.effect('ends the game of a board that dies out', () =>
    Effect.gen(function* () {
      const system = SequenceCoalgebra.make({
        structure: (board: Board) =>
          HashSet.isEmpty(board)
            ? Option.none()
            : Option.some({ output: board, next: generation(board) }),
      });

      const outputs = yield* Stream.runCollect(
        SequenceCoalgebra.behavior(system, HashSet.make('0,0', '1,0')),
      );

      assertEquals(outputs, [HashSet.make('0,0', '1,0')]);
    }),
  );
});
