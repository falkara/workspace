import { describe, expectTypeOf, it } from '@effect/vitest';

import { type StreamCoalgebra, streamCoalgebra } from '#src/Coalgebra/StreamCoalgebra';

describe('StreamCoalgebra', () => {
  it('infers the outputs and the state space from the coalgebra structure', () => {
    const countdown = streamCoalgebra({
      structure: (state: number) => [`${state}`, state - 5],
    });

    expectTypeOf(countdown).toEqualTypeOf<StreamCoalgebra<string, number>>();
  });
});
