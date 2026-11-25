import { describe, it } from '@effect/vitest';
import { assertEquals } from '@effect/vitest/utils';
import { StreamCoalgebra } from '@falkara/simulation';
import { Effect, HashSet, Random, Stream } from 'effect';

import { type Board, generation } from './GameOfLife';

describe('StreamCoalgebra', () => {
  it.effect('turns a blinker from a row into a column and back', () =>
    Effect.gen(function* () {
      const system = StreamCoalgebra.make({
        structure: (board: Board) => ({ output: board, next: generation(board) }),
      });

      const outputs = yield* Stream.runCollect(
        Stream.take(StreamCoalgebra.behavior(system, HashSet.make('0,1', '1,1', '2,1')), 3),
      );

      assertEquals(outputs, [
        HashSet.make('0,1', '1,1', '2,1'),
        HashSet.make('1,0', '1,1', '1,2'),
        HashSet.make('0,1', '1,1', '2,1'),
      ]);
    }),
  );

  it.effect('moves a glider one cell down and to the right in four generations', () =>
    Effect.gen(function* () {
      const system = StreamCoalgebra.make({
        structure: (board: Board) => ({ output: board, next: generation(board) }),
      });

      const outputs = yield* Stream.runCollect(
        Stream.take(
          StreamCoalgebra.behavior(system, HashSet.make('1,0', '2,1', '0,2', '1,2', '2,2')),
          5,
        ),
      );

      assertEquals(outputs.at(4), HashSet.make('2,1', '3,2', '1,3', '2,3', '3,3'));
    }),
  );

  it.effect('runs a stream coalgebra written in place, whose boards it infers', () =>
    Effect.gen(function* () {
      const blinker = HashSet.make('0,1', '1,1', '2,1');

      const outputs = yield* Stream.runCollect(
        Stream.take(
          StreamCoalgebra.behavior(
            { structure: (board) => ({ output: board, next: generation(board) }) },
            blinker,
          ),
          2,
        ),
      );

      assertEquals(outputs, [blinker, HashSet.make('1,0', '1,1', '1,2')]);
    }),
  );

  it.effect('grows a board by a random cell before every generation, the same for one seed', () =>
    Effect.gen(function* () {
      const system = StreamCoalgebra.makeEffect({
        structure: (board: Board) =>
          Effect.map(Random.nextIntBetween(0, 2), (column) => ({
            output: HashSet.size(board),
            next: generation(HashSet.add(board, `${column},0`)),
          })),
      });
      const run = StreamCoalgebra.behaviorEffect(system, HashSet.make('0,1', '1,1', '2,1')).pipe(
        Stream.take(3),
        Stream.runCollect,
        Random.withSeed('glider'),
      );

      assertEquals(
        [yield* run, yield* run],
        [
          [3, 7, 6],
          [3, 7, 6],
        ],
      );
    }),
  );

  it.effect('resumes its behavior from the next state of a step', () =>
    Effect.gen(function* () {
      const system = StreamCoalgebra.make({
        structure: (board: Board) => ({ output: board, next: generation(board) }),
      });
      const blinker = HashSet.make('0,1', '1,1', '2,1');

      const [, second] = yield* Stream.runCollect(
        Stream.take(StreamCoalgebra.steps(system, blinker), 2),
      );
      const resumed = yield* Stream.runCollect(
        Stream.take(StreamCoalgebra.behavior(system, second?.next ?? blinker), 1),
      );

      assertEquals(resumed, [blinker]);
    }),
  );
});
