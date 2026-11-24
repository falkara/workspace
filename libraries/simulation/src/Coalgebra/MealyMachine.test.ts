import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Array, Effect, Schema, Stream } from 'effect';

import { type MealyMachine, mealyMachine, mealyMachineBehavior } from '#src/Coalgebra/MealyMachine';

describe('MealyMachine', () => {
  it('infers the inputs, the outputs, and the state space from the coalgebra structure', () => {
    const counter = mealyMachine({
      structure: (state: number) => (input: string) => [`${state}`, state + input.length],
    });

    expectTypeOf(counter).toEqualTypeOf<MealyMachine<string, string, number>>();
  });

  it.effect.prop(
    'gives in its behavior the output upon every input and goes on from the next state',
    [Schema.Array(Schema.Int)],
    ([inputs]) =>
      Effect.gen(function* () {
        const total = mealyMachine({
          structure: (sum: number) => (input: number) => [sum + input, sum + input],
        });

        const outputs = yield* Stream.runCollect(
          mealyMachineBehavior(total, 0, Stream.fromIterable(inputs)),
        );

        expect(outputs).toStrictEqual(Array.scan(inputs, 0, (sum, input) => sum + input).slice(1));
      }),
  );

  it('passes on the failure and the requirements of the stream of inputs', () => {
    const total = mealyMachine({
      structure: (sum: number) => (input: number) => [sum + input, sum + input],
    });

    const totals = (inputs: Stream.Stream<number, 'Disconnected', 'Sensor'>) =>
      mealyMachineBehavior(total, 0, inputs);

    expectTypeOf(totals).returns.toEqualTypeOf<Stream.Stream<number, 'Disconnected', 'Sensor'>>();
  });
});
