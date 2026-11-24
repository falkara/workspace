import { describe, it } from '@effect/vitest';
import { assertEquals } from '@effect/vitest/utils';
import * as StreamCoalgebra from '@falkara/simulation/Coalgebra/StreamCoalgebra';
import { Effect, HashSet, Stream } from 'effect';

import { type Board, generation } from './GameOfLife';

describe('StreamCoalgebra', () => {
  it.effect('turns a blinker from a row into a column and back', () =>
    Effect.gen(function* () {
      const life = StreamCoalgebra.make({
        structure: (board: Board) => [board, generation(board)],
      });

      const generations = yield* Stream.runCollect(
        Stream.take(StreamCoalgebra.behavior(life, HashSet.make('0,1', '1,1', '2,1')), 3),
      );

      assertEquals(generations, [
        HashSet.make('0,1', '1,1', '2,1'),
        HashSet.make('1,0', '1,1', '1,2'),
        HashSet.make('0,1', '1,1', '2,1'),
      ]);
    }),
  );

  it.effect('moves a glider one cell down and to the right in four generations', () =>
    Effect.gen(function* () {
      const life = StreamCoalgebra.make({
        structure: (board: Board) => [board, generation(board)],
      });

      const generations = yield* Stream.runCollect(
        Stream.take(
          StreamCoalgebra.behavior(life, HashSet.make('1,0', '2,1', '0,2', '1,2', '2,2')),
          5,
        ),
      );

      assertEquals(generations.at(4), HashSet.make('2,1', '3,2', '1,3', '2,3', '3,3'));
    }),
  );

  it.effect('runs a stream coalgebra written in place, whose boards it infers', () =>
    Effect.gen(function* () {
      const blinker = HashSet.make('0,1', '1,1', '2,1');

      const generations = yield* Stream.runCollect(
        Stream.take(
          StreamCoalgebra.behavior({ structure: (board) => [board, generation(board)] }, blinker),
          2,
        ),
      );

      assertEquals(generations, [blinker, HashSet.make('1,0', '1,1', '1,2')]);
    }),
  );
});
