import { describe, expect, it } from '@effect/vitest';
import { DeterministicAutomaton } from '@falkara/simulation';
import { Effect, HashSet, Stream } from 'effect';

import { type Board, generation } from './GameOfLife';

describe('DeterministicAutomaton', () => {
  it.effect('counts the living cells of the board before every move and after the last', () =>
    Effect.gen(function* () {
      const system = DeterministicAutomaton.make({
        structure: (board: Board) => ({
          output: HashSet.size(board),
          next: (cell: string) => generation(HashSet.add(board, cell)),
        }),
      });

      const outputs = yield* Stream.runCollect(
        Stream.make('1,1').pipe(
          DeterministicAutomaton.behavior(system, HashSet.make('0,1', '2,1')),
        ),
      );

      expect(outputs).toStrictEqual([2, 3]);
    }),
  );
});
