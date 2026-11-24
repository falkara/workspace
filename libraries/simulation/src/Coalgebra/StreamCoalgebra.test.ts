import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Effect, Schema, Stream } from 'effect';

import {
  type StreamCoalgebra,
  streamCoalgebra,
  streamCoalgebraBehavior,
} from '#src/Coalgebra/StreamCoalgebra';

describe('StreamCoalgebra', () => {
  it('infers the outputs and the state space from the coalgebra structure', () => {
    const countdown = streamCoalgebra({
      structure: (state: number) => [`${state}`, state - 5],
    });

    expectTypeOf(countdown).toEqualTypeOf<StreamCoalgebra<string, number>>();
  });

  it.effect.prop(
    'gives in its behavior the output of every step and goes on from the next state',
    [Schema.Int],
    ([start]) =>
      Effect.gen(function* () {
        const counter = streamCoalgebra({
          structure: (state: number) => [`${state}`, state + 1],
        });

        const outputs = yield* Stream.runCollect(
          Stream.take(streamCoalgebraBehavior(counter, start), 3),
        );

        expect(outputs).toStrictEqual([`${start}`, `${start + 1}`, `${start + 2}`]);
      }),
  );
});
