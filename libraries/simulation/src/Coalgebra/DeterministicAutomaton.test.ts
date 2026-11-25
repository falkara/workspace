import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Array, Effect, pipe, Schema, Stream } from 'effect';

import * as DeterministicAutomaton from '#src/Coalgebra/DeterministicAutomaton';
import * as MealyMachine from '#src/Coalgebra/MealyMachine';
import type * as EffectFunctor from '#src/Functor/EffectFunctor';

describe('DeterministicAutomaton', () => {
  it('infers the inputs, the outputs, and the state space from the coalgebra structure', () => {
    const system = DeterministicAutomaton.make({
      structure: (even: boolean) => ({
        output: even,
        next: (bit: 0 | 1) => (bit === 1 ? !even : even),
      }),
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
          structure: (even: boolean) => ({
            output: even,
            next: (bit: 0 | 1) => (bit === 1 ? !even : even),
          }),
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
          structure: (even: boolean) => ({
            output: even,
            next: (bit: 0 | 1) => (bit === 1 ? !even : even),
          }),
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
      structure: (even: boolean) => ({
        output: even,
        next: (bit: 0 | 1) => (bit === 1 ? !even : even),
      }),
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

  it('unites the failure and the requirements of its transitions with those of the inputs', () => {
    const system = DeterministicAutomaton.makeEffect({
      structure: (even: boolean) => ({
        output: even,
        next: (bit: 0 | 1) => (bit === 1 ? Effect.fail('Noise' as const) : Effect.succeed(even)),
      }),
    });

    const parities = (bits: Stream.Stream<0 | 1, 'Disconnected', 'Sensor'>) =>
      bits.pipe(DeterministicAutomaton.behaviorEffect(system, true));

    expectTypeOf(parities).returns.toEqualTypeOf<
      Stream.Stream<boolean, 'Disconnected' | 'Noise', 'Sensor'>
    >();
  });

  it.effect.prop(
    'gives the output of every state up to the transition that fails',
    [Schema.Array(Schema.Boolean)],
    ([flips]) =>
      Effect.gen(function* () {
        const bits = [...flips.map((flip) => (flip ? 1 : 0)), 2] as const;
        const system = DeterministicAutomaton.makeEffect({
          structure: (even: boolean) => ({
            output: even,
            next: (bit: 0 | 1 | 2) =>
              bit === 2 ? Effect.fail(even) : Effect.succeed(bit === 1 ? !even : even),
          }),
        });

        const outputs: boolean[] = [];
        const failure = yield* Effect.flip(
          Stream.runForEach(
            DeterministicAutomaton.behaviorEffect(system, true, Stream.fromIterable(bits)),
            (output) => Effect.sync(() => outputs.push(output)),
          ),
        );

        expect([outputs, failure]).toStrictEqual([
          Array.scan(flips, true, (even, flip) => (flip ? !even : even)).slice(0, -1),
          Array.scan(flips, true, (even, flip) => (flip ? !even : even)).at(-1),
        ]);
      }),
  );

  it.effect.prop(
    'maps the outputs and the inputs of its behavior',
    [Schema.Array(Schema.Boolean)],
    ([flips]) =>
      Effect.gen(function* () {
        const system = DeterministicAutomaton.make({
          structure: (even: boolean) => ({
            output: even,
            next: (bit: 0 | 1) => (bit === 1 ? !even : even),
          }),
        });
        const mapped = pipe(
          system,
          DeterministicAutomaton.mapInput((flip: boolean) => (flip ? 1 : 0)),
          DeterministicAutomaton.mapOutput((even) => (even ? 'even' : 'odd')),
        );

        const outputs = yield* Stream.runCollect(
          DeterministicAutomaton.behavior(mapped, true, Stream.fromIterable(flips)),
        );

        expect(outputs).toStrictEqual(
          Array.scan(flips, true, (even, flip) => (flip ? !even : even)).map((even) =>
            even ? 'even' : 'odd',
          ),
        );
      }),
  );

  it.effect.prop(
    'runs as a Mealy machine that gives the output of every state an input leaves',
    [Schema.Array(Schema.Boolean)],
    ([flips]) =>
      Effect.gen(function* () {
        const bits = Stream.fromIterable(flips.map((flip) => (flip ? 1 : 0)));
        const system = DeterministicAutomaton.make({
          structure: (even: boolean) => ({
            output: even,
            next: (bit: 0 | 1) => (bit === 1 ? !even : even),
          }),
        });
        const effectful = DeterministicAutomaton.makeEffect({
          structure: (even: boolean) => ({
            output: even,
            next: (bit: 0 | 1) => Effect.succeed(bit === 1 ? !even : even),
          }),
        });

        const outputs = yield* Stream.runCollect(
          MealyMachine.behavior(DeterministicAutomaton.toMealyMachine(system), true, bits),
        );
        const effectOutputs = yield* Stream.runCollect(
          MealyMachine.behaviorEffect(
            DeterministicAutomaton.toMealyMachineEffect(effectful),
            true,
            bits,
          ),
        );

        expect([outputs, effectOutputs]).toStrictEqual([
          Array.scan(flips, true, (even, flip) => (flip ? !even : even)).slice(0, -1),
          Array.scan(flips, true, (even, flip) => (flip ? !even : even)).slice(0, -1),
        ]);
      }),
  );

  it.effect.prop(
    'maps the outputs and the inputs of an automaton with effects and keeps its effects',
    [Schema.Array(Schema.Boolean)],
    ([flips]) =>
      Effect.gen(function* () {
        const system = DeterministicAutomaton.makeEffect({
          structure: (even: boolean) => ({
            output: even,
            next: (bit: 0 | 1) => Effect.succeed(bit === 1 ? !even : even),
          }),
        });
        const mapped = pipe(
          system,
          DeterministicAutomaton.mapInput((flip: boolean) => (flip ? 1 : 0)),
          DeterministicAutomaton.mapOutput((even) => (even ? 'even' : 'odd')),
        );

        const outputs = yield* Stream.runCollect(
          DeterministicAutomaton.behaviorEffect(mapped, true, Stream.fromIterable(flips)),
        );

        expectTypeOf(mapped).toEqualTypeOf<
          DeterministicAutomaton.DeterministicAutomaton<
            boolean,
            'even' | 'odd',
            boolean,
            EffectFunctor.EffectFunctor<never, never>
          >
        >();
        expect(outputs).toStrictEqual(
          Array.scan(flips, true, (even, flip) => (flip ? !even : even)).map((even) =>
            even ? 'even' : 'odd',
          ),
        );
      }),
  );
});
