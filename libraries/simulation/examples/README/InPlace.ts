await StreamCoalgebra.behavior({ structure: (board) => [board, generation(board)] }, blinker).pipe(
  Stream.take(3),
  Stream.runCollect,
  Effect.runPromise,
);
// The same three generations.

// The names that the page defines in the blocks before this one.
import * as StreamCoalgebra from '@falkara/simulation/Coalgebra/StreamCoalgebra';
import { Effect, type HashSet, Stream } from 'effect';
type Board = HashSet.HashSet<string>;
declare const generation: (board: Board) => Board;
declare const blinker: Board;
