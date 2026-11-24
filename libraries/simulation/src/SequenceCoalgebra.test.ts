import { describe, expectTypeOf, it } from '@effect/vitest';
import { Option } from 'effect';

import type { BinaryProductFunctor } from '#src/BinaryProductFunctor';
import type { Coalgebra } from '#src/Coalgebra';
import type { FunctorComp } from '#src/FunctorComp';
import { type SequenceCoalgebra, sequenceCoalgebra } from '#src/SequenceCoalgebra';

describe('SequenceCoalgebra', () => {
  it('infers the outputs and the state space from the coalgebra structure', () => {
    const countdown = sequenceCoalgebra({
      structure: (state: number) =>
        state > 0 ? Option.some([String(state), state - 1] as const) : Option.none(),
    });

    expectTypeOf(countdown).toEqualTypeOf<SequenceCoalgebra<string, number>>();
  });

  it('is the coalgebra of the options of the binary products with a type of outputs', () => {
    expectTypeOf<SequenceCoalgebra<string, number>>().toEqualTypeOf<
      Coalgebra<FunctorComp<BinaryProductFunctor<string>, Option.OptionTypeLambda>, number>
    >();
  });
});
