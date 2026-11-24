import { describe, expectTypeOf, it } from '@effect/vitest';
import { Option } from 'effect';

import { type SequenceCoalgebra, sequenceCoalgebra } from '#src/Coalgebra/SequenceCoalgebra';

describe('SequenceCoalgebra', () => {
  it('infers the outputs and the state space from the coalgebra structure', () => {
    const countdown = sequenceCoalgebra({
      structure: (state: number) =>
        state > 0 ? Option.some([String(state), state - 1] as const) : Option.none(),
    });

    expectTypeOf(countdown).toEqualTypeOf<SequenceCoalgebra<string, number>>();
  });
});
