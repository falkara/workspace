import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Effect, Option, Schema, Stream } from 'effect';

import * as SequenceCoalgebra from '#src/Coalgebra/SequenceCoalgebra';

describe('SequenceCoalgebra', () => {
  it('infers the outputs and the state space from the coalgebra structure', () => {
    const countdown = SequenceCoalgebra.make({
      structure: (state: number) =>
        state > 0 ? Option.some([String(state), state - 1]) : Option.none(),
    });

    expectTypeOf(countdown).toEqualTypeOf<SequenceCoalgebra.SequenceCoalgebra<string, number>>();
  });

  it.effect.prop(
    'gives in its behavior the output of every step until the coalgebra gives nothing',
    [Schema.Int],
    ([seed]) =>
      Effect.gen(function* () {
        const start = Math.abs(seed) % 10;
        const countdown = SequenceCoalgebra.make({
          structure: (state: number) =>
            state > 0 ? Option.some([String(state), state - 1]) : Option.none(),
        });

        const outputs = yield* Stream.runCollect(SequenceCoalgebra.behavior(countdown, start));

        expect(outputs).toStrictEqual(
          Array.from({ length: start }, (_, index) => String(start - index)),
        );
      }),
  );
});
