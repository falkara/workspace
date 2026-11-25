import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Array, Effect, pipe, Schema, Stream } from 'effect';

import * as MealyMachine from '#src/Coalgebra/MealyMachine';
import type * as EffectFunctor from '#src/Functor/EffectFunctor';

describe('MealyMachine', () => {
  it('infers the inputs, the outputs, and the state space from the coalgebra structure', () => {
    const system = MealyMachine.make({
      structure: (state: number) => (input: string) => ({
        output: `${state}`,
        next: state + input.length,
      }),
    });

    expectTypeOf(system).toEqualTypeOf<MealyMachine.MealyMachine<string, string, number>>();
  });

  it.effect.prop(
    'gives in its behavior the output upon every input and goes on from the next state',
    [Schema.Array(Schema.Int)],
    ([inputs]) =>
      Effect.gen(function* () {
        const system = MealyMachine.make({
          structure: (sum: number) => (input: number) => ({
            output: sum + input,
            next: sum + input,
          }),
        });

        const outputs = yield* Stream.runCollect(
          MealyMachine.behavior(system, 0, Stream.fromIterable(inputs)),
        );

        expect(outputs).toStrictEqual(Array.scan(inputs, 0, (sum, input) => sum + input).slice(1));
      }),
  );

  it.effect.prop(
    'gives the same behavior to a stream of inputs that pipes into it',
    [Schema.Array(Schema.Int)],
    ([inputs]) =>
      Effect.gen(function* () {
        const stream = Stream.fromIterable(inputs);
        const system = MealyMachine.make({
          structure: (sum: number) => (input: number) => ({
            output: sum + input,
            next: sum + input,
          }),
        });

        const outputs = yield* Stream.runCollect(stream.pipe(MealyMachine.behavior(system, 0)));

        expect(outputs).toStrictEqual(
          yield* Stream.runCollect(MealyMachine.behavior(system, 0, stream)),
        );
      }),
  );

  it('passes on the failure and the requirements of the stream of inputs', () => {
    const system = MealyMachine.make({
      structure: (sum: number) => (input: number) => ({ output: sum + input, next: sum + input }),
    });

    const totals = (inputs: Stream.Stream<number, 'Disconnected', 'Sensor'>) =>
      MealyMachine.behavior(system, 0, inputs);
    const pipedTotals = (inputs: Stream.Stream<number, 'Disconnected', 'Sensor'>) =>
      inputs.pipe(MealyMachine.behavior(system, 0));

    expectTypeOf(totals).returns.toEqualTypeOf<Stream.Stream<number, 'Disconnected', 'Sensor'>>();
    expectTypeOf(pipedTotals).returns.toEqualTypeOf<
      Stream.Stream<number, 'Disconnected', 'Sensor'>
    >();
  });

  it.effect.prop(
    'gives in its steps the output upon every input with the next state',
    [Schema.Array(Schema.Int)],
    ([inputs]) =>
      Effect.gen(function* () {
        const system = MealyMachine.make({
          structure: (sum: number) => (input: number) => ({
            output: sum + input,
            next: sum + input,
          }),
        });

        const steps = yield* Stream.runCollect(
          Stream.fromIterable(inputs).pipe(MealyMachine.steps(system, 0)),
        );

        expect(steps).toStrictEqual(
          Array.scan(inputs, 0, (sum, input) => sum + input)
            .slice(1)
            .map((sum) => ({ output: sum, next: sum })),
        );
      }),
  );

  it('unites the failure and the requirements of its steps with those of the inputs', () => {
    const system = MealyMachine.makeEffect({
      structure: (sum: number) => (input: number) =>
        input < 0
          ? Effect.fail('Negative' as const)
          : Effect.succeed({ output: sum + input, next: sum + input }),
    });

    const totals = (inputs: Stream.Stream<number, 'Disconnected', 'Sensor'>) =>
      inputs.pipe(MealyMachine.behaviorEffect(system, 0));

    expectTypeOf(totals).returns.toEqualTypeOf<
      Stream.Stream<number, 'Disconnected' | 'Negative', 'Sensor'>
    >();
  });

  it.effect.prop(
    'gives the output upon every input up to the step that fails',
    [Schema.Array(Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)))],
    ([inputs]) =>
      Effect.gen(function* () {
        const system = MealyMachine.makeEffect({
          structure: (sum: number) => (input: number) =>
            input < 0
              ? Effect.fail(sum)
              : Effect.succeed({ output: sum + input, next: sum + input }),
        });

        const outputs: number[] = [];
        const failure = yield* Effect.flip(
          Stream.runForEach(
            MealyMachine.behaviorEffect(system, 0, Stream.fromIterable([...inputs, -1])),
            (output) => Effect.sync(() => outputs.push(output)),
          ),
        );

        expect([outputs, failure]).toStrictEqual([
          Array.scan(inputs, 0, (sum, input) => sum + input).slice(1),
          Array.scan(inputs, 0, (sum, input) => sum + input).at(-1),
        ]);
      }),
  );

  it.effect.prop(
    'maps the outputs and the inputs of its behavior',
    [Schema.Array(Schema.Int)],
    ([inputs]) =>
      Effect.gen(function* () {
        const system = MealyMachine.make({
          structure: (sum: number) => (input: number) => ({
            output: sum + input,
            next: sum + input,
          }),
        });
        const mapped = pipe(
          system,
          MealyMachine.mapInput((text: string) => text.length),
          MealyMachine.mapOutput((sum) => `${sum}`),
        );

        const outputs = yield* Stream.runCollect(
          MealyMachine.behavior(
            mapped,
            0,
            Stream.fromIterable(inputs.map((input) => 'x'.repeat(Math.abs(input) % 5))),
          ),
        );

        expect(outputs).toStrictEqual(
          Array.scan(inputs, 0, (sum, input) => sum + (Math.abs(input) % 5))
            .slice(1)
            .map((sum) => `${sum}`),
        );
      }),
  );

  it.effect.prop(
    'gives in series the behavior of the second machine upon the behavior of the first',
    [Schema.Array(Schema.Int)],
    ([inputs]) =>
      Effect.gen(function* () {
        const total = MealyMachine.make({
          structure: (sum: number) => (input: number) => ({
            output: sum + input,
            next: sum + input,
          }),
        });
        const peak = MealyMachine.make({
          structure: (highest: number) => (input: number) => ({
            output: Math.max(highest, input),
            next: Math.max(highest, input),
          }),
        });
        const system = pipe(total, MealyMachine.series(peak));

        const outputs = yield* Stream.runCollect(
          MealyMachine.behavior(system, [0, -Infinity], Stream.fromIterable(inputs)),
        );

        expect(outputs).toStrictEqual(
          yield* Stream.runCollect(
            Stream.fromIterable(inputs).pipe(
              MealyMachine.behavior(total, 0),
              MealyMachine.behavior(peak, -Infinity),
            ),
          ),
        );
      }),
  );

  it.effect.prop(
    'pairs in parallel the behaviors of two machines upon the parts of the inputs',
    [Schema.Array(Schema.Tuple([Schema.Int, Schema.Int]))],
    ([inputs]) =>
      Effect.gen(function* () {
        const total = MealyMachine.make({
          structure: (sum: number) => (input: number) => ({
            output: sum + input,
            next: sum + input,
          }),
        });
        const peak = MealyMachine.make({
          structure: (highest: number) => (input: number) => ({
            output: Math.max(highest, input),
            next: Math.max(highest, input),
          }),
        });

        const outputs = yield* Stream.runCollect(
          MealyMachine.behavior(
            MealyMachine.parallel(total, peak),
            [0, -Infinity],
            Stream.fromIterable(inputs),
          ),
        );

        expect(outputs).toStrictEqual(
          Array.zip(
            Array.scan(inputs, 0, (sum, [input]) => sum + input).slice(1),
            Array.scan(inputs, -Infinity, (highest, [, input]) => Math.max(highest, input)).slice(
              1,
            ),
          ),
        );
      }),
  );

  it('unites the failures and the requirements of composed machines', () => {
    const total = MealyMachine.makeEffect({
      structure: (sum: number) => (input: number) =>
        input < 0
          ? Effect.fail('Negative' as const)
          : Effect.succeed({ output: sum + input, next: sum + input }),
    });
    const label = MealyMachine.makeEffect({
      structure: (count: number) => (input: number) =>
        input > 100
          ? Effect.fail('Overflow' as const)
          : Effect.succeed({ output: `${input}`, next: count + 1 }),
    });

    expectTypeOf(pipe(total, MealyMachine.seriesEffect(label))).toEqualTypeOf<
      MealyMachine.MealyMachine<
        number,
        string,
        readonly [number, number],
        EffectFunctor.EffectFunctor<'Negative' | 'Overflow', never>
      >
    >();
    expectTypeOf(pipe(total, MealyMachine.parallelEffect(label))).toEqualTypeOf<
      MealyMachine.MealyMachine<
        readonly [number, number],
        readonly [number, string],
        readonly [number, number],
        EffectFunctor.EffectFunctor<'Negative' | 'Overflow', never>
      >
    >();
  });

  it.effect('runs the effects of composed machines in the order of the machines', () =>
    Effect.gen(function* () {
      const trace: string[] = [];
      const first = MealyMachine.makeEffect({
        structure: (state: number) => (input: number) =>
          Effect.sync(() => {
            trace.push('first');
            return { output: input, next: state };
          }),
      });
      const second = MealyMachine.makeEffect({
        structure: (state: number) => (input: number) =>
          Effect.sync(() => {
            trace.push('second');
            return { output: input, next: state };
          }),
      });

      yield* MealyMachine.seriesEffect(first, second).structure([0, 0])(1);
      yield* MealyMachine.parallelEffect(first, second).structure([0, 0])([1, 1]);

      expect(trace).toStrictEqual(['first', 'second', 'first', 'second']);
    }),
  );

  it.effect.prop(
    'maps the inputs of a machine with effects and keeps its effects',
    [Schema.Array(Schema.String)],
    ([texts]) =>
      Effect.gen(function* () {
        const system = MealyMachine.makeEffect({
          structure: (sum: number) => (input: number) =>
            Effect.succeed({ output: sum + input, next: sum + input }),
        });
        const mapped = pipe(
          system,
          MealyMachine.mapInput((text: string) => text.length),
        );

        const outputs = yield* Stream.runCollect(
          MealyMachine.behaviorEffect(mapped, 0, Stream.fromIterable(texts)),
        );

        expectTypeOf(mapped).toEqualTypeOf<
          MealyMachine.MealyMachine<
            string,
            number,
            number,
            EffectFunctor.EffectFunctor<never, never>
          >
        >();
        expect(outputs).toStrictEqual(
          Array.scan(texts, 0, (sum, text) => sum + text.length).slice(1),
        );
      }),
  );
});
