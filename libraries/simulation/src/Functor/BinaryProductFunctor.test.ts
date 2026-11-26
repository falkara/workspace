import { describe, expectTypeOf, it } from '@effect/vitest';
import { Schema } from 'effect';

import * as Coalgebra from '#src/Coalgebra';
import * as Functor from '#src/Functor';
import * as BinaryProductFunctor from '#src/Functor/BinaryProductFunctor';

/** The axioms of the functor of binary products with outputs in the strings, with two products equal where both of their parts are. */
const axioms = Functor.axioms(
  BinaryProductFunctor.functor<string>(),
  (self, that) => self.output === that.output && self.next === that.next,
);

describe('BinaryProductFunctor', () => {
  it('gives the coalgebra structure of a coalgebra an output and the next state', () => {
    const system = Coalgebra.make(BinaryProductFunctor.functor<string>())({
      structure: (state: number) => ({ output: `${state}`, next: state - 5 }),
    });

    expectTypeOf(system.structure).returns.toEqualTypeOf<
      BinaryProductFunctor.Product<string, number>
    >();
  });

  it.prop('keeps the identity', [Schema.String, Schema.Finite], ([output, next]) =>
    axioms.map_id({ output, next }),
  );

  it.prop('keeps the composition', [Schema.String, Schema.Finite], ([output, next]) =>
    axioms.map_comp(
      (value: number) => value + 1,
      (value: number) => `${value}`,
      { output, next },
    ),
  );
});
