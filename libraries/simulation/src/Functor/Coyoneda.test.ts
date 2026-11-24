import { describe, expectTypeOf, it } from '@effect/vitest';
import { Schema } from 'effect';

import * as Coalgebra from '#src/Coalgebra';
import { functorAxioms } from '#src/Functor';
import { type Coyoneda, coyoneda } from '#src/Functor/Coyoneda';

/** The axioms of the functor of the functions from the strings, with two functions equal where they agree at an input. */
const axiomsAt = (input: string) =>
  functorAxioms(coyoneda<string>(), (self, that) => self(input) === that(input));

describe('Coyoneda', () => {
  it('gives the coalgebra structure of a coalgebra the next state upon every input', () => {
    const counter = Coalgebra.coalgebra<Coyoneda<string>>()({
      structure: (state: number) => (input) => state + input.length,
    });

    expectTypeOf(counter.structure).returns.toEqualTypeOf<(input: string) => number>();
  });

  it.prop('keeps the identity', [Schema.Finite, Schema.String], ([offset, input]) =>
    axiomsAt(input).map_id((value: string) => value.length + offset),
  );

  it.prop('keeps the composition', [Schema.Finite, Schema.String], ([offset, input]) =>
    axiomsAt(input).map_comp(
      (value: number) => value + 1,
      (value: number) => `${value}`,
      (value: string) => value.length + offset,
    ),
  );
});
