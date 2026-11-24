import { describe, expectTypeOf, it } from '@effect/vitest';

import type { BinaryProductFunctor } from '#src/BinaryProductFunctor';
import type { Coalgebra } from '#src/Coalgebra';
import { type StreamCoalgebra, streamCoalgebra } from '#src/StreamCoalgebra';

describe('StreamCoalgebra', () => {
  it('infers the outputs and the state space from the coalgebra structure', () => {
    const countdown = streamCoalgebra({
      structure: (state: number) => [`${state}`, state - 5],
    });

    expectTypeOf(countdown).toEqualTypeOf<StreamCoalgebra<string, number>>();
  });

  it('is the coalgebra of the functor of binary products with a type of outputs', () => {
    expectTypeOf<StreamCoalgebra<string, number>>().toEqualTypeOf<
      Coalgebra<BinaryProductFunctor<string>, number>
    >();
  });
});
