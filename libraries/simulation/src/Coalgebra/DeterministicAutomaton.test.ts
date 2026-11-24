import { describe, expectTypeOf, it } from '@effect/vitest';

import {
  type DeterministicAutomaton,
  deterministicAutomaton,
} from '#src/Coalgebra/DeterministicAutomaton';

describe('DeterministicAutomaton', () => {
  it('infers the inputs, the outputs, and the state space from the coalgebra structure', () => {
    const parity = deterministicAutomaton({
      structure: (even: boolean) => [even, (bit: 0 | 1) => (bit === 1 ? !even : even)],
    });

    expectTypeOf(parity).toEqualTypeOf<DeterministicAutomaton<0 | 1, boolean, boolean>>();
  });
});
