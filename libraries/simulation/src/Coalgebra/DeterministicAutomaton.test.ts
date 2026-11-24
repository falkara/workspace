import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Array, Effect, Schema, Stream } from 'effect';

import {
  type DeterministicAutomaton,
  deterministicAutomaton,
  deterministicAutomatonBehavior,
} from '#src/Coalgebra/DeterministicAutomaton';

describe('DeterministicAutomaton', () => {
  it('infers the inputs, the outputs, and the state space from the coalgebra structure', () => {
    const parity = deterministicAutomaton({
      structure: (even: boolean) => [even, (bit: 0 | 1) => (bit === 1 ? !even : even)],
    });

    expectTypeOf(parity).toEqualTypeOf<DeterministicAutomaton<0 | 1, boolean, boolean>>();
  });

  it.effect.prop(
    'gives in its behavior the output of every state that the inputs lead through',
    [Schema.Array(Schema.Boolean)],
    ([flips]) =>
      Effect.gen(function* () {
        const bits = flips.map((flip) => (flip ? 1 : 0));
        const parity = deterministicAutomaton({
          structure: (even: boolean) => [even, (bit: 0 | 1) => (bit === 1 ? !even : even)],
        });

        const outputs = yield* Stream.runCollect(
          deterministicAutomatonBehavior(parity, true, Stream.fromIterable(bits)),
        );

        expect(outputs).toStrictEqual(
          Array.scan(bits, true, (even, bit) => (bit === 1 ? !even : even)),
        );
      }),
  );

  it('passes on the failure and the requirements of the stream of inputs', () => {
    const parity = deterministicAutomaton({
      structure: (even: boolean) => [even, (bit: 0 | 1) => (bit === 1 ? !even : even)],
    });

    const parities = (bits: Stream.Stream<0 | 1, 'Disconnected', 'Sensor'>) =>
      deterministicAutomatonBehavior(parity, true, bits);

    expectTypeOf(parities).returns.toEqualTypeOf<
      Stream.Stream<boolean, 'Disconnected', 'Sensor'>
    >();
  });
});
