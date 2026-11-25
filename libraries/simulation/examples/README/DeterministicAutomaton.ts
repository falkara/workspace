import { DeterministicAutomaton } from '@falkara/simulation';

const system = DeterministicAutomaton.make({
  structure: (board: Board) => ({
    output: HashSet.size(board),
    next: (cell: string) => generation(HashSet.add(board, cell)),
  }),
});

await Stream.make('1,1').pipe(
  DeterministicAutomaton.behavior(system, HashSet.make('0,1', '2,1')),
  Stream.runCollect,
  Effect.runPromise,
);
// [2, 3]: 2 before the move and 3 after it.

// The names that the page defines in the blocks before this one.
import { Effect, HashSet, Stream } from 'effect';
type Board = HashSet.HashSet<string>;
declare const generation: (board: Board) => Board;
