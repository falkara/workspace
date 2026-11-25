import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Effect, Exit, Option, pipe, Schema, Stream } from 'effect';

import * as SequenceCoalgebra from '#src/Coalgebra/SequenceCoalgebra';

describe('SequenceCoalgebra', () => {
  it('infers the outputs and the state space from the coalgebra structure', () => {
    const system = SequenceCoalgebra.make({
      structure: (state: number) =>
        state > 0 ? Option.some({ output: String(state), next: state - 1 }) : Option.none(),
    });

    expectTypeOf(system).toEqualTypeOf<SequenceCoalgebra.SequenceCoalgebra<string, number>>();
  });

  it.effect.prop(
    'gives in its behavior the output of every step until the coalgebra gives nothing',
    [Schema.Int],
    ([seed]) =>
      Effect.gen(function* () {
        const start = Math.abs(seed) % 10;
        const system = SequenceCoalgebra.make({
          structure: (state: number) =>
            state > 0 ? Option.some({ output: String(state), next: state - 1 }) : Option.none(),
        });

        const outputs = yield* Stream.runCollect(SequenceCoalgebra.behavior(system, start));

        expect(outputs).toStrictEqual(
          Array.from({ length: start }, (_, index) => String(start - index)),
        );
      }),
  );

  it.effect.prop(
    'gives in its steps every output with the next state until the coalgebra gives nothing',
    [Schema.Int],
    ([seed]) =>
      Effect.gen(function* () {
        const start = Math.abs(seed) % 10;
        const system = SequenceCoalgebra.make({
          structure: (state: number) =>
            state > 0 ? Option.some({ output: String(state), next: state - 1 }) : Option.none(),
        });

        const steps = yield* Stream.runCollect(SequenceCoalgebra.steps(system, start));

        expect(steps).toStrictEqual(
          Array.from({ length: start }, (_, index) => ({
            output: String(start - index),
            next: start - index - 1,
          })),
        );
      }),
  );

  it.effect.prop(
    'gives the outputs of its effects until a step fails or the coalgebra gives nothing',
    [Schema.Int, Schema.Boolean],
    ([seed, fails]) =>
      Effect.gen(function* () {
        const start = Math.abs(seed) % 10;
        const system = SequenceCoalgebra.makeEffect({
          structure: (state: number) =>
            state > 0
              ? Effect.succeedSome({ output: String(state), next: state - 1 })
              : fails
                ? Effect.fail('Exhausted' as const)
                : Effect.succeedNone,
        });

        const outputs: string[] = [];
        const exit = yield* Effect.exit(
          Stream.runForEach(SequenceCoalgebra.behaviorEffect(system, start), (output) =>
            Effect.sync(() => outputs.push(output)),
          ),
        );

        expect([outputs, exit]).toStrictEqual([
          Array.from({ length: start }, (_, index) => String(start - index)),
          fails ? Exit.fail('Exhausted') : Exit.void,
        ]);
      }),
  );

  it.effect.prop('maps the outputs of its behavior', [Schema.Int], ([seed]) =>
    Effect.gen(function* () {
      const start = Math.abs(seed) % 10;
      const system = SequenceCoalgebra.make({
        structure: (state: number) =>
          state > 0 ? Option.some({ output: state, next: state - 1 }) : Option.none(),
      });
      const effectful = SequenceCoalgebra.makeEffect({
        structure: (state: number) =>
          state > 0 ? Effect.succeedSome({ output: state, next: state - 1 }) : Effect.succeedNone,
      });

      const outputs = yield* Stream.runCollect(
        SequenceCoalgebra.behavior(
          pipe(
            system,
            SequenceCoalgebra.mapOutput((output) => `${output}`),
          ),
          start,
        ),
      );
      const effectOutputs = yield* Stream.runCollect(
        SequenceCoalgebra.behaviorEffect(
          pipe(
            effectful,
            SequenceCoalgebra.mapOutputEffect((output) => `${output}`),
          ),
          start,
        ),
      );

      expect([outputs, effectOutputs]).toStrictEqual([
        Array.from({ length: start }, (_, index) => `${start - index}`),
        Array.from({ length: start }, (_, index) => `${start - index}`),
      ]);
    }),
  );
});
