import * as Coalgebra from '@falkara/simulation/Coalgebra';

const system = Coalgebra.make<Option.OptionTypeLambda, Board>({
  structure: (board) => (HashSet.isEmpty(board) ? Option.none() : Option.some(generation(board))),
});

system.structure(blinker);
// Option.some(HashSet('1,0', '1,1', '1,2')), the column of three that follows the row.

// The names that the page defines in the blocks before this one.
import { HashSet, Option } from 'effect';
type Board = HashSet.HashSet<string>;
declare const generation: (board: Board) => Board;
declare const blinker: Board;
