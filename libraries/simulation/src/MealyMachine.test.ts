import { describe, expectTypeOf, it } from '@effect/vitest';

import type { BinaryProductFunctor } from '#src/BinaryProductFunctor';
import type { Coalgebra } from '#src/Coalgebra';
import type { Coyoneda } from '#src/Coyoneda';
import type { FunctorComp } from '#src/FunctorComp';
import { type MealyMachine, mealyMachine } from '#src/MealyMachine';

describe('MealyMachine', () => {
  it('infers the inputs, the outputs, and the state space from the coalgebra structure', () => {
    const counter = mealyMachine({
      structure: (state: number) => (input: string) => [`${state}`, state + input.length],
    });

    expectTypeOf(counter).toEqualTypeOf<MealyMachine<string, string, number>>();
  });

  it('is the coalgebra of the functions from the inputs into the binary products with the outputs', () => {
    expectTypeOf<MealyMachine<string, number, boolean>>().toEqualTypeOf<
      Coalgebra<FunctorComp<BinaryProductFunctor<number>, Coyoneda<string>>, boolean>
    >();
  });
});
