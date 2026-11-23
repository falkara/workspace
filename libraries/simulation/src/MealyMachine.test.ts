import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import type { BinaryProductFunctor } from '#src/BinaryProductFunctor';
import type { Coalgebra } from '#src/Coalgebra';
import type { Coyoneda } from '#src/Coyoneda';
import type { FunctorComp } from '#src/FunctorComp';
import { type MealyMachine, mealyMachine } from '#src/MealyMachine';

describe('MealyMachine', () => {
  it('makes the structure morphism give an output and the next state upon every input', () => {
    const turnstile = mealyMachine<'coin' | 'push', 'unlock' | 'lock' | 'none', boolean>({
      str: (locked) => (input) =>
        input === 'coin' ? [locked ? 'unlock' : 'none', false] : [locked ? 'none' : 'lock', true],
    });
    expect(turnstile.str(true)('coin')).toStrictEqual(['unlock', false]);
    expect(turnstile.str(false)('push')).toStrictEqual(['lock', true]);
  });

  it('is the coalgebra of the functions from the inputs into the binary products with the outputs', () => {
    expectTypeOf<MealyMachine<string, number, boolean>>().toEqualTypeOf<
      Coalgebra<FunctorComp<BinaryProductFunctor<number>, Coyoneda<string>>, boolean>
    >();
  });
});
