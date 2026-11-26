import { describe, it } from '@effect/vitest';
import { assertEquals } from '@effect/vitest/utils';
import { BinaryCoproductFunctor, Coalgebra, Functor } from '@falkara/simulation';
import { Array, HashSet, Option, Result } from 'effect';

import { type Board, generation } from './GameOfLife';

describe('Coalgebra', () => {
  it('takes a board to its next generation until the board dies out', () => {
    const option = Functor.make<Option.OptionTypeLambda>({ map: Option.map });
    const system = Coalgebra.make(option)({
      structure: (board: Board) =>
        HashSet.isEmpty(board) ? Option.none() : Option.some(generation(board)),
    });

    assertEquals(system.structure(HashSet.make('0,0')), Option.some(HashSet.empty()));
    assertEquals(system.structure(HashSet.empty()), Option.none());
  });

  it('fails on a board that grows too crowded', () => {
    const system = Coalgebra.make(BinaryCoproductFunctor.functor<'Overcrowded'>())({
      structure: (board: Board) =>
        HashSet.size(board) > 100 ? Result.fail('Overcrowded') : Result.succeed(generation(board)),
    });

    assertEquals(
      system.structure(HashSet.make('0,1', '1,1', '2,1')),
      Result.succeed(HashSet.make('1,0', '1,1', '1,2')),
    );
    assertEquals(
      system.structure(HashSet.fromIterable(Array.makeBy(101, (column) => `${column},0`))),
      Result.fail('Overcrowded'),
    );
  });
});
