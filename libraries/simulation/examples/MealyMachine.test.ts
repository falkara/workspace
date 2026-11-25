import { describe, expect, it } from '@effect/vitest';
import { assertEquals } from '@effect/vitest/utils';
import { MealyMachine } from '@falkara/simulation';
import { Effect, HashSet, pipe, Stream } from 'effect';

import { type Board, generation } from './GameOfLife';

describe('MealyMachine', () => {
  it.effect('counts the living cells after every move of a player', () =>
    Effect.gen(function* () {
      const system = MealyMachine.make({
        structure: (board: Board) => (cell: string) => {
          const next = generation(HashSet.add(board, cell));
          return { output: HashSet.size(next), next };
        },
      });

      const outputs = yield* Stream.runCollect(
        Stream.make('1,1', '5,5').pipe(MealyMachine.behavior(system, HashSet.make('0,1', '2,1'))),
      );

      expect(outputs).toStrictEqual([3, 3]);
    }),
  );

  it.effect('passes on the failure of the moves of a player', () =>
    Effect.gen(function* () {
      const system = MealyMachine.make({
        structure: (board: Board) => (cell: string) => {
          const next = generation(HashSet.add(board, cell));
          return { output: HashSet.size(next), next };
        },
      });
      const moves = Stream.make('1,1').pipe(Stream.concat(Stream.fail('Disconnected' as const)));

      const failure = yield* Effect.flip(
        Stream.runCollect(MealyMachine.behavior(system, HashSet.make('0,1', '2,1'), moves)),
      );

      expect(failure).toBe('Disconnected');
    }),
  );

  it.effect('records the most living cells after every move of a player', () =>
    Effect.gen(function* () {
      const player = MealyMachine.make({
        structure: (board: Board) => (cell: string) => {
          const next = generation(HashSet.add(board, cell));
          return { output: HashSet.size(next), next };
        },
      });
      const peak = MealyMachine.make({
        structure: (highest: number) => (count: number) => ({
          output: Math.max(highest, count),
          next: Math.max(highest, count),
        }),
      });
      const record = pipe(
        player,
        MealyMachine.series(peak),
        MealyMachine.mapOutput((highest) => `at most ${highest} cells`),
      );

      const steps = yield* Stream.runCollect(
        Stream.make('1,1', '5,5').pipe(MealyMachine.steps(record, [HashSet.make('0,1', '2,1'), 0])),
      );

      assertEquals(steps, [
        { output: 'at most 3 cells', next: [HashSet.make('1,0', '1,1', '1,2'), 3] },
        { output: 'at most 3 cells', next: [HashSet.make('0,1', '1,1', '2,1'), 3] },
      ]);
    }),
  );
});
