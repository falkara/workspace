import { BinaryCoproductFunctor } from '@falkara/simulation';

const system = Coalgebra.make(BinaryCoproductFunctor.functor<'Overcrowded'>())({
  structure: (board: Board) =>
    HashSet.size(board) > 100 ? Result.fail('Overcrowded') : Result.succeed(generation(board)),
});

system.structure(blinker);
// Result.succeed(HashSet('1,0', '1,1', '1,2')), as three cells are far from a crowd.

// The names that the page defines in the blocks before this one.
import { Coalgebra } from '@falkara/simulation';
import { HashSet, Result } from 'effect';
type Board = HashSet.HashSet<string>;
declare const generation: (board: Board) => Board;
declare const blinker: Board;
