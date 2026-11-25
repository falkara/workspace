import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Channel, Effect, Result, Schema, Stream } from 'effect';

import * as ResumptionCoalgebra from '#src/Coalgebra/ResumptionCoalgebra';
import type * as EffectFunctor from '#src/Functor/EffectFunctor';

describe('ResumptionCoalgebra', () => {
  it('infers the outputs, the result, and the state space from the coalgebra structure', () => {
    const system = ResumptionCoalgebra.make({
      structure: (state: number) =>
        state > 0 ? Result.succeed({ output: `${state}`, next: state - 1 }) : Result.fail(true),
    });

    expectTypeOf(system).toEqualTypeOf<
      ResumptionCoalgebra.ResumptionCoalgebra<string, boolean, number>
    >();
  });

  it('infers the failure and the requirements from the effects of the coalgebra structure', () => {
    const system = ResumptionCoalgebra.makeEffect({
      structure: (state: number) =>
        state > 100
          ? Effect.fail('Overflow' as const)
          : Effect.succeed(
              state > 0
                ? Result.succeed({ output: `${state}`, next: state - 1 })
                : Result.fail('Landed' as const),
            ),
    });

    expectTypeOf(system).toEqualTypeOf<
      ResumptionCoalgebra.ResumptionCoalgebra<
        string,
        'Landed',
        number,
        EffectFunctor.EffectFunctor<'Overflow', never>
      >
    >();
  });

  it.effect.prop(
    'emits in its channel every output and ends with the result',
    [Schema.Int],
    ([seed]) =>
      Effect.gen(function* () {
        const start = Math.abs(seed) % 10;
        const system = ResumptionCoalgebra.make({
          structure: (state: number) =>
            state > 0
              ? Result.succeed({ output: `${state}`, next: state - 1 })
              : Result.fail(`landed after ${start}`),
        });

        const outputs: string[] = [];
        const result = yield* Channel.runForEach(
          ResumptionCoalgebra.channel(system, start),
          (chunk) => Effect.sync(() => outputs.push(...chunk)),
        );

        expect([outputs, result]).toStrictEqual([
          Array.from({ length: start }, (_, index) => `${start - index}`),
          `landed after ${start}`,
        ]);
      }),
  );

  it.effect.prop(
    'gives in its behavior and its steps every output until the result',
    [Schema.Int],
    ([seed]) =>
      Effect.gen(function* () {
        const start = Math.abs(seed) % 10;
        const system = ResumptionCoalgebra.make({
          structure: (state: number) =>
            state > 0 ? Result.succeed({ output: `${state}`, next: state - 1 }) : Result.fail(0),
        });

        const outputs = yield* Stream.runCollect(ResumptionCoalgebra.behavior(system, start));
        const steps = yield* Stream.runCollect(ResumptionCoalgebra.steps(system, start));

        expect([outputs, steps]).toStrictEqual([
          Array.from({ length: start }, (_, index) => `${start - index}`),
          Array.from({ length: start }, (_, index) => ({
            output: `${start - index}`,
            next: start - index - 1,
          })),
        ]);
      }),
  );

  it.effect.prop(
    'fails in its channel and its behavior where a step fails',
    [Schema.Int],
    ([seed]) =>
      Effect.gen(function* () {
        const start = Math.abs(seed) % 10;
        const system = ResumptionCoalgebra.makeEffect({
          structure: (state: number) =>
            state > 0
              ? Effect.succeed(Result.succeed({ output: `${state}`, next: state - 1 }))
              : Effect.fail('Crashed' as const),
        });

        const channelFailure = yield* Effect.flip(
          Channel.runDrain(ResumptionCoalgebra.channelEffect(system, start)),
        );
        const behaviorFailure = yield* Effect.flip(
          Stream.runDrain(ResumptionCoalgebra.behaviorEffect(system, start)),
        );

        expect([channelFailure, behaviorFailure]).toStrictEqual(['Crashed', 'Crashed']);
      }),
  );
});
