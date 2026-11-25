import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Array, Effect, Schema, Stream } from 'effect';

import * as MealyMachine from '#src/Coalgebra/MealyMachine';

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
});
