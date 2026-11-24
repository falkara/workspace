import { describe, expect, it } from '@effect/vitest';
import * as MealyMachine from '@falkara/simulation/Coalgebra/MealyMachine';
import { Effect, HashSet, Stream } from 'effect';

import { type Board, generation } from './GameOfLife';

describe('MealyMachine', () => {
  it.effect('counts the living cells after every move of a player', () =>
    Effect.gen(function* () {
      const play = MealyMachine.make({
        structure: (board: Board) => (cell: string) => {
          const next = generation(HashSet.add(board, cell));
          return [HashSet.size(next), next];
        },
      });

      const counts = yield* Stream.runCollect(
        Stream.make('1,1', '5,5').pipe(MealyMachine.behavior(play, HashSet.make('0,1', '2,1'))),
      );

      expect(counts).toStrictEqual([3, 3]);
    }),
  );

  it.effect('passes on the failure of the moves of a player', () =>
    Effect.gen(function* () {
      const play = MealyMachine.make({
        structure: (board: Board) => (cell: string) => {
          const next = generation(HashSet.add(board, cell));
          return [HashSet.size(next), next];
        },
      });
      const moves = Stream.make('1,1').pipe(Stream.concat(Stream.fail('Disconnected' as const)));

      const failure = yield* Effect.flip(
        Stream.runCollect(MealyMachine.behavior(play, HashSet.make('0,1', '2,1'), moves)),
      );

      expect(failure).toBe('Disconnected');
    }),
  );
});
