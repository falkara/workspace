import { describe, expect, it } from '@effect/vitest';
import * as DeterministicAutomaton from '@falkara/simulation/Coalgebra/DeterministicAutomaton';
import { Effect, HashSet, Stream } from 'effect';

import { type Board, generation } from './GameOfLife';

describe('DeterministicAutomaton', () => {
  it.effect('counts the living cells of the board before every move and after the last', () =>
    Effect.gen(function* () {
      const census = DeterministicAutomaton.make({
        structure: (board: Board) => [
          HashSet.size(board),
          (cell: string) => generation(HashSet.add(board, cell)),
        ],
      });

      const counts = yield* Stream.runCollect(
        Stream.make('1,1').pipe(
          DeterministicAutomaton.behavior(census, HashSet.make('0,1', '2,1')),
        ),
      );

      expect(counts).toStrictEqual([2, 3]);
    }),
  );
});
