import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Schema } from 'effect';
import * as Coalgebra from '#src/Coalgebra';
import { type Coyoneda, coyoneda } from '#src/Coyoneda';
import { functorAxioms } from '#src/Functor';

/** The axioms of the functor of the functions from the strings, with two functions equal where they agree at an input. */
const axiomsAt = (input: string) =>
  functorAxioms(coyoneda<string>(), (self, that) => self(input) === that(input));

describe('Coyoneda', () => {
  it('makes the structure morphism of a coalgebra give the next state upon every input', () => {
    const counter = Coalgebra.coalgebra<Coyoneda<string>, number>({
      str: (value) => (input) => value + input.length,
    });
    expectTypeOf(counter.str).returns.toEqualTypeOf<(value: string) => number>();
    expect(counter.str(-5)('abc')).toBe(-2);
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
