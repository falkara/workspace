import { describe, expectTypeOf, it } from '@effect/vitest';
import { Schema } from 'effect';

import { type BinaryProductFunctor, binaryProductFunctor } from '#src/BinaryProductFunctor';
import * as Coalgebra from '#src/Coalgebra';
import { type Coyoneda, coyoneda } from '#src/Coyoneda';
import { functorAxioms } from '#src/Functor';
import { type FunctorComp, functorComp } from '#src/FunctorComp';

/** The axioms of the functor of the Mealy machines, with two functions equal where they give equal pairs at an input. */
const axiomsAt = (input: string) =>
  functorAxioms(functorComp(binaryProductFunctor<string>(), coyoneda<string>()), (self, that) => {
    const [selfOutput, selfState] = self(input);
    const [thatOutput, thatState] = that(input);
    return selfOutput === thatOutput && selfState === thatState;
  });

describe('FunctorComp', () => {
  it('gives the coalgebra structure of a coalgebra an output and the next state upon every input', () => {
    /** A functor of the Mealy machines with inputs and outputs in the strings, a function from an input to an output and the next state. */
    type Mealy = FunctorComp<BinaryProductFunctor<string>, Coyoneda<string>>;

    const counter = Coalgebra.coalgebra<Mealy>()({
      structure: (state: number) => (input) => [`${state}`, state + input.length],
    });

    expectTypeOf(counter.structure).returns.toEqualTypeOf<
      (input: string) => readonly [string, number]
    >();
  });

  it.prop('keeps the identity', [Schema.Finite, Schema.String], ([offset, input]) =>
    axiomsAt(input).map_id((value: string) => [value, value.length + offset]),
  );

  it.prop('keeps the composition', [Schema.Finite, Schema.String], ([offset, input]) =>
    axiomsAt(input).map_comp(
      (value: number) => value + 1,
      (value: number) => `${value}`,
      (value: string) => [value, value.length + offset],
    ),
  );
});
