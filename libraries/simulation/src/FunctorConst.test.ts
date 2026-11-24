import { describe, expectTypeOf, it } from '@effect/vitest';
import { Schema } from 'effect';

import * as Coalgebra from '#src/Coalgebra';
import { functorAxioms } from '#src/Functor';
import { type FunctorConst, functorConst } from '#src/FunctorConst';

/** The axioms of the constant functor at the strings, with two strings equal where they are the same. */
const axioms = functorAxioms(functorConst<string>(), (self, that) => self === that);

describe('FunctorConst', () => {
  it('gives the coalgebra structure of a coalgebra an output and no next state', () => {
    const display = Coalgebra.coalgebra<FunctorConst<string>>()({
      structure: (state: number) => `${state}`,
    });

    expectTypeOf(display.structure).returns.toEqualTypeOf<string>();
  });

  it.prop('keeps the identity', [Schema.String], ([output]) => axioms.map_id(output));

  it.prop('keeps the composition', [Schema.String], ([output]) =>
    axioms.map_comp(
      (value: number) => value + 1,
      (value: number) => `${value}`,
      output,
    ),
  );
});
