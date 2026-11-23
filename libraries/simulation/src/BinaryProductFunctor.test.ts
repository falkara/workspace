import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import type { BinaryProductFunctor } from '#src/BinaryProductFunctor';
import * as Coalgebra from '#src/Coalgebra';

describe('BinaryProductFunctor', () => {
  it('makes the structure morphism of a coalgebra give an output and the next state', () => {
    const countdown = Coalgebra.coalgebra<BinaryProductFunctor<string>, number>({
      str: (value) => [`${value}`, value - 5],
    });
    expectTypeOf(countdown.str).returns.toEqualTypeOf<readonly [string, number]>();
    expect(countdown.str(-5)).toStrictEqual(['-5', -10]);
  });
});
