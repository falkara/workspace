import { describe, expectTypeOf, it } from '@effect/vitest';
import { Schema } from 'effect';

import { type BinaryProductFunctor, binaryProductFunctor } from '#src/BinaryProductFunctor';
import * as Coalgebra from '#src/Coalgebra';
import { functorAxioms } from '#src/Functor';

/** The axioms of the functor of binary products with outputs in the strings, with two pairs equal where both of their parts are. */
const axioms = functorAxioms(
  binaryProductFunctor<string>(),
  (self, that) => self[0] === that[0] && self[1] === that[1],
);

describe('BinaryProductFunctor', () => {
  it('gives the coalgebra structure of a coalgebra an output and the next state', () => {
    const countdown = Coalgebra.coalgebra<BinaryProductFunctor<string>>()({
      structure: (state: number) => [`${state}`, state - 5],
    });

    expectTypeOf(countdown.structure).returns.toEqualTypeOf<readonly [string, number]>();
  });

  it.prop('keeps the identity', [Schema.String, Schema.Finite], ([output, state]) =>
    axioms.map_id([output, state]),
  );

  it.prop('keeps the composition', [Schema.String, Schema.Finite], ([output, state]) =>
    axioms.map_comp(
      (value: number) => value + 1,
      (value: number) => `${value}`,
      [output, state],
    ),
  );
});
