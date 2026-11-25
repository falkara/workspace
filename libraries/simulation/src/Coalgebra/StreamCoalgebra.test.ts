import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Context, Effect, Exit, pipe, Schema, Stream } from 'effect';

import * as MealyMachine from '#src/Coalgebra/MealyMachine';
import * as StreamCoalgebra from '#src/Coalgebra/StreamCoalgebra';
import type * as EffectFunctor from '#src/Functor/EffectFunctor';

describe('StreamCoalgebra', () => {
  it('infers the outputs and the state space from the coalgebra structure', () => {
    const system = StreamCoalgebra.make({
      structure: (state: number) => ({ output: `${state}`, next: state - 5 }),
    });

    expectTypeOf(system).toEqualTypeOf<StreamCoalgebra.StreamCoalgebra<string, number>>();
  });

  it('infers the failure and the requirements from the effects of the coalgebra structure', () => {
    class Step extends Context.Service<Step, { readonly size: number }>()('Step') {}
    const system = StreamCoalgebra.makeEffect({
      structure: (state: number) =>
        Effect.gen(function* () {
          const { size } = yield* Step;
          if (state > 100) return yield* Effect.fail('Overflow' as const);
          return { output: `${state}`, next: state + size };
        }),
    });

    expectTypeOf(system).toEqualTypeOf<
      StreamCoalgebra.StreamCoalgebra<string, number, EffectFunctor.EffectFunctor<'Overflow', Step>>
    >();
  });

  it.effect.prop('gives in its steps every output with the next state', [Schema.Int], ([start]) =>
    Effect.gen(function* () {
      const system = StreamCoalgebra.make({
        structure: (state: number) => ({ output: `${state}`, next: state + 1 }),
      });

      const steps = yield* Stream.runCollect(Stream.take(StreamCoalgebra.steps(system, start), 2));

      expect(steps).toStrictEqual([
        { output: `${start}`, next: start + 1 },
        { output: `${start + 1}`, next: start + 2 },
      ]);
    }),
  );

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

  it.effect.prop('gives the outputs of its effects until a step fails', [Schema.Int], ([start]) =>
    Effect.gen(function* () {
      const system = StreamCoalgebra.makeEffect({
        structure: (state: number) =>
          state > start + 1
            ? Effect.fail(state)
            : Effect.succeed({ output: `${state}`, next: state + 1 }),
      });

      const outputs: Array<string> = [];
      const failure = yield* Effect.flip(
        Stream.runForEach(StreamCoalgebra.behaviorEffect(system, start), (output) =>
          Effect.sync(() => outputs.push(output)),
        ),
      );

      expect([outputs, failure]).toStrictEqual([[`${start}`, `${start + 1}`], start + 2]);
    }),
  );

  it.effect.prop('maps the outputs of its behavior', [Schema.Int], ([start]) =>
    Effect.gen(function* () {
      const system = StreamCoalgebra.make({
        structure: (state: number) => ({ output: state, next: state + 1 }),
      });
      const effectful = StreamCoalgebra.makeEffect({
        structure: (state: number) => Effect.succeed({ output: state, next: state + 1 }),
      });

      const outputs = yield* Stream.runCollect(
        Stream.take(
          StreamCoalgebra.behavior(
            pipe(
              system,
              StreamCoalgebra.mapOutput((output) => `${output}`),
            ),
            start,
          ),
          2,
        ),
      );
      const effectOutputs = yield* Stream.runCollect(
        Stream.take(
          StreamCoalgebra.behaviorEffect(
            pipe(
              effectful,
              StreamCoalgebra.mapOutputEffect((output) => `${output}`),
            ),
            start,
          ),
          2,
        ),
      );

      expect([outputs, effectOutputs]).toStrictEqual([
        [`${start}`, `${start + 1}`],
        [`${start}`, `${start + 1}`],
      ]);
    }),
  );

  it.effect.prop(
    'runs as a Mealy machine that gives its behavior upon any inputs',
    [Schema.Int, Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 10 }))],
    ([start, length]) =>
      Effect.gen(function* () {
        const system = StreamCoalgebra.make({
          structure: (state: number) => ({ output: `${state}`, next: state + 1 }),
        });

        const outputs = yield* Stream.runCollect(
          MealyMachine.behavior(
            StreamCoalgebra.toMealyMachine(system),
            start,
            Stream.fromIterable(Array.from({ length }, () => undefined)),
          ),
        );

        expect(outputs).toStrictEqual(Array.from({ length }, (_, index) => `${start + index}`));
      }),
  );

  it.effect.prop(
    'runs with its effects as a Mealy machine with the same effects',
    [Schema.Int, Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 10 }))],
    ([start, length]) =>
      Effect.gen(function* () {
        const system = StreamCoalgebra.makeEffect({
          structure: (state: number) =>
            state > start + 5
              ? Effect.fail('Overflow' as const)
              : Effect.succeed({ output: `${state}`, next: state + 1 }),
        });
        const machine = StreamCoalgebra.toMealyMachine(system);

        const exit = yield* Effect.exit(
          Stream.runCollect(
            MealyMachine.behaviorEffect(
              machine,
              start,
              Stream.fromIterable(Array.from({ length }, () => undefined)),
            ),
          ),
        );

        expectTypeOf(machine).toEqualTypeOf<
          MealyMachine.MealyMachine<
            void,
            string,
            number,
            EffectFunctor.EffectFunctor<'Overflow', never>
          >
        >();
        expect(exit).toStrictEqual(
          length > 6
            ? Exit.fail('Overflow')
            : Exit.succeed(Array.from({ length }, (_, index) => `${start + index}`)),
        );
      }),
  );
});
