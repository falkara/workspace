import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Effect, Schema, Stream } from 'effect';

import * as StreamCoalgebra from '#src/Coalgebra/StreamCoalgebra';

describe('StreamCoalgebra', () => {
  it('infers the outputs and the state space from the coalgebra structure', () => {
    const system = StreamCoalgebra.make({
      structure: (state: number) => ({ output: `${state}`, next: state - 5 }),
    });

    expectTypeOf(system).toEqualTypeOf<StreamCoalgebra.StreamCoalgebra<string, number>>();
  });

  it.effect.prop(
    'gives in its behavior the output of every step and goes on from the next state',
    [Schema.Int],
    ([start]) =>
      Effect.gen(function* () {
        const system = StreamCoalgebra.make({
          structure: (state: number) => ({ output: `${state}`, next: state + 1 }),
        });

        const outputs = yield* Stream.runCollect(
          Stream.take(StreamCoalgebra.behavior(system, start), 3),
        );

        expect(outputs).toStrictEqual([`${start}`, `${start + 1}`, `${start + 2}`]);
      }),
  );
});
