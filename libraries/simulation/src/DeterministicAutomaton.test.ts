import { describe, expectTypeOf, it } from '@effect/vitest';

import type { BinaryProductFunctor } from '#src/BinaryProductFunctor';
import type { Coalgebra } from '#src/Coalgebra';
import type { Coyoneda } from '#src/Coyoneda';
import { type DeterministicAutomaton, deterministicAutomaton } from '#src/DeterministicAutomaton';
import type { FunctorComp } from '#src/FunctorComp';

describe('DeterministicAutomaton', () => {
  it('infers the inputs, the outputs, and the state space from the coalgebra structure', () => {
    const parity = deterministicAutomaton({
      structure: (even: boolean) => [even, (bit: 0 | 1) => (bit === 1 ? !even : even)],
    });

    expectTypeOf(parity).toEqualTypeOf<DeterministicAutomaton<0 | 1, boolean, boolean>>();
  });

  it('is the coalgebra of the binary products of the outputs with the functions from the inputs', () => {
    expectTypeOf<DeterministicAutomaton<string, number, boolean>>().toEqualTypeOf<
      Coalgebra<FunctorComp<Coyoneda<string>, BinaryProductFunctor<number>>, boolean>
    >();
  });
});
