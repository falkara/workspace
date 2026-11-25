import { ResumptionCoalgebra } from '@falkara/simulation';
import { Channel, Result } from 'effect';

const system = ResumptionCoalgebra.make({
  structure: (board: Board) =>
    HashSet.isEmpty(board)
      ? Result.fail('Extinct' as const)
      : HashSet.size(board) > 100
        ? Result.fail('Overcrowded' as const)
        : Result.succeed({ output: board, next: generation(board) }),
});

await ResumptionCoalgebra.channel(system, HashSet.make('0,0', '1,0')).pipe(
  Channel.runDrain,
  Effect.runPromise,
);
// 'Extinct': the board of two cells dies out after one generation.

// The names that the page defines in the blocks before this one.
import { Effect, HashSet } from 'effect';
type Board = HashSet.HashSet<string>;
declare const generation: (board: Board) => Board;
