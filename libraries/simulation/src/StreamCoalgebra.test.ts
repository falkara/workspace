import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import type { BinaryProductFunctor } from '#src/BinaryProductFunctor';
import type { Coalgebra } from '#src/Coalgebra';
import { type StreamCoalgebra, streamCoalgebra } from '#src/StreamCoalgebra';

describe('StreamCoalgebra', () => {
  it('makes the structure morphism give an output and the next state', () => {
    const countdown = streamCoalgebra<string, number>({ str: (value) => [`${value}`, value - 5] });
    expect(countdown.str(-5)).toStrictEqual(['-5', -10]);
  });

  it('is the coalgebra of the functor of binary products with a type of outputs', () => {
    expectTypeOf<StreamCoalgebra<string, number>>().toEqualTypeOf<
      Coalgebra<BinaryProductFunctor<string>, number>
    >();
  });
});
