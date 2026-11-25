import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Array, Effect, Schema, Stream } from 'effect';

import * as DeterministicAutomaton from '#src/Coalgebra/DeterministicAutomaton';

describe('DeterministicAutomaton', () => {
  it('infers the inputs, the outputs, and the state space from the coalgebra structure', () => {
    const system = DeterministicAutomaton.make({
      structure: (even: boolean) => [even, (bit: 0 | 1) => (bit === 1 ? !even : even)],
    });

    expectTypeOf(system).toEqualTypeOf<
      DeterministicAutomaton.DeterministicAutomaton<0 | 1, boolean, boolean>
    >();
  });

  it.effect.prop(
    'gives in its behavior the output of every state that the inputs lead through, one output more than the inputs where they end',
    [Schema.Array(Schema.Boolean)],
    ([flips]) =>
      Effect.gen(function* () {
        const bits = flips.map((flip) => (flip ? 1 : 0));
        const system = DeterministicAutomaton.make({
          structure: (even: boolean) => [even, (bit: 0 | 1) => (bit === 1 ? !even : even)],
        });

        const outputs = yield* Stream.runCollect(
          DeterministicAutomaton.behavior(system, true, Stream.fromIterable(bits)),
        );

        expect(outputs).toStrictEqual(
          Array.scan(bits, true, (even, bit) => (bit === 1 ? !even : even)),
        );
      }),
  );

  it.effect.prop(
    'gives the same behavior to a stream of inputs that pipes into it',
    [Schema.Array(Schema.Boolean)],
    ([flips]) =>
      Effect.gen(function* () {
        const bits = Stream.fromIterable(flips.map((flip) => (flip ? 1 : 0)));
        const system = DeterministicAutomaton.make({
          structure: (even: boolean) => [even, (bit: 0 | 1) => (bit === 1 ? !even : even)],
        });

        const outputs = yield* Stream.runCollect(
          bits.pipe(DeterministicAutomaton.behavior(system, true)),
        );

        expect(outputs).toStrictEqual(
          yield* Stream.runCollect(DeterministicAutomaton.behavior(system, true, bits)),
        );
      }),
  );

  it('passes on the failure and the requirements of the stream of inputs', () => {
    const system = DeterministicAutomaton.make({
      structure: (even: boolean) => [even, (bit: 0 | 1) => (bit === 1 ? !even : even)],
    });

    const parities = (bits: Stream.Stream<0 | 1, 'Disconnected', 'Sensor'>) =>
      DeterministicAutomaton.behavior(system, true, bits);
    const pipedParities = (bits: Stream.Stream<0 | 1, 'Disconnected', 'Sensor'>) =>
      bits.pipe(DeterministicAutomaton.behavior(system, true));

    expectTypeOf(parities).returns.toEqualTypeOf<
      Stream.Stream<boolean, 'Disconnected', 'Sensor'>
    >();
    expectTypeOf(pipedParities).returns.toEqualTypeOf<
      Stream.Stream<boolean, 'Disconnected', 'Sensor'>
    >();
  });
});
