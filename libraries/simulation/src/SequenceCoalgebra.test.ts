import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Option } from 'effect';
import type { BinaryProductFunctor } from '#src/BinaryProductFunctor';
import type { Coalgebra } from '#src/Coalgebra';
import type { FunctorComp } from '#src/FunctorComp';
import { type SequenceCoalgebra, sequenceCoalgebra } from '#src/SequenceCoalgebra';

describe('SequenceCoalgebra', () => {
  it('makes the structure morphism give either nothing or an output and the next state', () => {
    const countdown = sequenceCoalgebra<string, number>({
      str: (value) => (value > 0 ? Option.some([`${value}`, value - 1]) : Option.none()),
    });
    expect(countdown.str(1)).toStrictEqual(Option.some(['1', 0]));
    expect(countdown.str(0)).toStrictEqual(Option.none());
  });

  it('is the coalgebra of the options of the binary products with a type of outputs', () => {
    expectTypeOf<SequenceCoalgebra<string, number>>().toEqualTypeOf<
      Coalgebra<FunctorComp<BinaryProductFunctor<string>, Option.OptionTypeLambda>, number>
    >();
  });
});
