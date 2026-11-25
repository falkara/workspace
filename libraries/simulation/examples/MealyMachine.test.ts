import { describe, expect, it } from '@effect/vitest';
import { MealyMachine } from '@falkara/simulation';
import { Effect, HashSet, Stream } from 'effect';

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
});
