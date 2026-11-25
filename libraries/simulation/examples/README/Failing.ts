import { type HKT, Result } from 'effect';

interface Failing<Failure> extends HKT.TypeLambda {
  readonly type: Result.Result<this['Target'], Failure>;
}

const system = Coalgebra.make<Failing<'Overcrowded'>, Board>({
  structure: (board) =>
    HashSet.size(board) > 100 ? Result.fail('Overcrowded') : Result.succeed(generation(board)),
});

system.structure(blinker);
// Result.succeed(HashSet('1,0', '1,1', '1,2')), as three cells are far from a crowd.

// The names that the page defines in the blocks before this one.
import * as Coalgebra from '@falkara/simulation/Coalgebra';
import { HashSet } from 'effect';
type Board = HashSet.HashSet<string>;
declare const generation: (board: Board) => Board;
declare const blinker: Board;
