import { SequenceCoalgebra } from '@falkara/simulation';

const system = SequenceCoalgebra.make({
  structure: (board: Board) =>
    HashSet.isEmpty(board)
      ? Option.none()
      : Option.some({ output: board, next: generation(board) }),
});

await SequenceCoalgebra.behavior(system, HashSet.make('0,0', '1,0')).pipe(
  Stream.runCollect,
  Effect.runPromise,
);
// [HashSet('0,0', '1,0')]: the board of two cells, and then the end, as both cells die.

// The names that the page defines in the blocks before this one.
import { Effect, HashSet, Option, Stream } from 'effect';
type Board = HashSet.HashSet<string>;
declare const generation: (board: Board) => Board;
