import { describe, it } from '@effect/vitest';
import { assertEquals } from '@effect/vitest/utils';
import * as Coalgebra from '@falkara/simulation/Coalgebra';
import { Array, HashSet, type HKT, Option, Result } from 'effect';

import { type Board, generation } from './GameOfLife';

describe('Coalgebra', () => {
  it('takes a board to its next generation until the board dies out', () => {
    const survival = Coalgebra.make<Option.OptionTypeLambda, Board>({
      structure: (board) =>
        HashSet.isEmpty(board) ? Option.none() : Option.some(generation(board)),
    });

    assertEquals(survival.structure(HashSet.make('0,0')), Option.some(HashSet.empty()));
    assertEquals(survival.structure(HashSet.empty()), Option.none());
  });

  it('fails on a board that grows too crowded', () => {
    /** The type lambda of the results that fail with a failure of their own. */
    interface Failing<Failure> extends HKT.TypeLambda {
      readonly type: Result.Result<this['Target'], Failure>;
    }
    const crowding = Coalgebra.make<Failing<'Overcrowded'>, Board>({
      structure: (board) =>
        HashSet.size(board) > 100 ? Result.fail('Overcrowded') : Result.succeed(generation(board)),
    });

    assertEquals(
      crowding.structure(HashSet.make('0,1', '1,1', '2,1')),
      Result.succeed(HashSet.make('1,0', '1,1', '1,2')),
    );
    assertEquals(
      crowding.structure(HashSet.fromIterable(Array.makeBy(101, (column) => `${column},0`))),
      Result.fail('Overcrowded'),
    );
  });
});
