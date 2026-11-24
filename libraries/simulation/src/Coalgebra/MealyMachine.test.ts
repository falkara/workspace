import { describe, expectTypeOf, it } from '@effect/vitest';

import { type MealyMachine, mealyMachine } from '#src/Coalgebra/MealyMachine';

describe('MealyMachine', () => {
  it('infers the inputs, the outputs, and the state space from the coalgebra structure', () => {
    const counter = mealyMachine({
      structure: (state: number) => (input: string) => [`${state}`, state + input.length],
    });

    expectTypeOf(counter).toEqualTypeOf<MealyMachine<string, string, number>>();
  });
});
