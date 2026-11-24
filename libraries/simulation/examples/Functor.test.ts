import { describe, it } from '@effect/vitest';
import { assertEquals } from '@effect/vitest/utils';
import * as Coalgebra from '@falkara/simulation/Coalgebra';
import * as Functor from '@falkara/simulation/Functor';
import { HashSet, type HKT, Schema } from 'effect';

import { type Board, generation } from './GameOfLife';

/** A step that counts the cells it brings to life beside the next state. */
interface Births<Next> {
  readonly births: number;
  readonly next: Next;
}

/** The type lambda of the steps that count their births. */
interface BirthsTypeLambda extends HKT.TypeLambda {
  readonly type: Births<this['Target']>;
}

/** The endofunctor of the steps that count their births, whose action keeps the count. */
const births = Functor.make<BirthsTypeLambda>({
  map: (f) => (value) => ({ births: value.births, next: f(value.next) }),
});

describe('Functor', () => {
  it.prop('keeps the identity of a new endofunctor', [Schema.Int, Schema.Int], ([count, next]) =>
    Functor.axioms(
      births,
      (self, that) => self.births === that.births && self.next === that.next,
    ).map_id({ births: count, next }),
  );

  it.prop('keeps the composition of a new endofunctor', [Schema.Int, Schema.Int], ([count, next]) =>
    Functor.axioms(
      births,
      (self, that) => self.births === that.births && self.next === that.next,
    ).map_comp(
      (value: number) => value + 1,
      (value: number) => `${value}`,
      { births: count, next },
    ),
  );

  it('counts the births of every generation in a coalgebra of a new endofunctor', () => {
    const life = Coalgebra.make<BirthsTypeLambda, Board>({
      structure: (board) => {
        const next = generation(board);
        return { births: HashSet.size(HashSet.difference(next, board)), next };
      },
    });

    assertEquals(life.structure(HashSet.make('0,1', '1,1', '2,1')), {
      births: 2,
      next: HashSet.make('1,0', '1,1', '1,2'),
    });
  });
});
