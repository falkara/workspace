import { describe, expect, it } from '@effect/vitest';
import { ResumptionCoalgebra } from '@falkara/simulation';
import { Channel, Effect, HashSet, Result } from 'effect';

import { type Board, generation } from './GameOfLife';

describe('ResumptionCoalgebra', () => {
  it.effect('ends the game of a board that dies out with the reason', () =>
    Effect.gen(function* () {
      const system = ResumptionCoalgebra.make({
        structure: (board: Board) =>
          HashSet.isEmpty(board)
            ? Result.fail('Extinct' as const)
            : HashSet.size(board) > 100
              ? Result.fail('Overcrowded' as const)
              : Result.succeed({ output: board, next: generation(board) }),
      });

      const reason = yield* Channel.runDrain(
        ResumptionCoalgebra.channel(system, HashSet.make('0,0', '1,0')),
      );

      expect(reason).toBe('Extinct');
    }),
  );
});
