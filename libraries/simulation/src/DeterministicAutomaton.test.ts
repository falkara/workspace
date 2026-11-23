import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import type { BinaryProductFunctor } from '#src/BinaryProductFunctor';
import type { Coalgebra } from '#src/Coalgebra';
import type { Coyoneda } from '#src/Coyoneda';
import { type DeterministicAutomaton, deterministicAutomaton } from '#src/DeterministicAutomaton';
import type { FunctorComp } from '#src/FunctorComp';

describe('DeterministicAutomaton', () => {
  it('makes the structure morphism give an output and the next state upon every input', () => {
    const parity = deterministicAutomaton<0 | 1, boolean, boolean>({
      str: (even) => [even, (bit) => (bit === 1 ? !even : even)],
    });
    const [output, next] = parity.str(true);
    expect(output).toBe(true);
    expect(next(1)).toBe(false);
    expect(next(0)).toBe(true);
  });

  it('is the coalgebra of the binary products of the outputs with the functions from the inputs', () => {
    expectTypeOf<DeterministicAutomaton<string, number, boolean>>().toEqualTypeOf<
      Coalgebra<FunctorComp<Coyoneda<string>, BinaryProductFunctor<number>>, boolean>
    >();
  });
});
