await StreamCoalgebra.behavior(
  { structure: (board) => ({ output: board, next: generation(board) }) },
  blinker,
).pipe(Stream.take(3), Stream.runCollect, Effect.runPromise);
// The same three generations.

// The names that the page defines in the blocks before this one.
import { StreamCoalgebra } from '@falkara/simulation';
import { Effect, type HashSet, Stream } from 'effect';
type Board = HashSet.HashSet<string>;
declare const generation: (board: Board) => Board;
declare const blinker: Board;
