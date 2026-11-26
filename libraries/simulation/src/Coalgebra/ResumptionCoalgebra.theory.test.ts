// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.ResumptionCoalgebra`, so every change by hand is lost when the generator runs.
import { describe, expect, it } from '@effect/vitest';
import { Effect, Schema, Stream } from 'effect';

import * as ResumptionCoalgebra from '#src/Coalgebra/ResumptionCoalgebra';

describe('Coalgebra/ResumptionCoalgebra', () => {
  /** Running a resumption coalgebra gives the outputs of its steps. */
  it.prop(
    'ResumptionCoalgebra.behavior_eq_map_steps',
    {
      coalgebraTable: Schema.Tuple([
        Schema.Result(
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Literals([0, 1, 2]),
        ),
        Schema.Result(
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Literals([0, 1, 2]),
        ),
        Schema.Result(
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Literals([0, 1, 2]),
        ),
      ]),
      state: Schema.Literals([0, 1, 2]),
    },
    ({ coalgebraTable, state }) => {
      const coalgebra = ResumptionCoalgebra.make({
        structure: (state: 0 | 1 | 2) => coalgebraTable[state],
      });
      const actual = Effect.runSync(
        Stream.runCollect(Stream.take(ResumptionCoalgebra.behavior(coalgebra, state), 6)),
      );
      const expected = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            Stream.map(ResumptionCoalgebra.steps(coalgebra, state), (value) => value.output),
            6,
          ),
        ),
      );
      expect(actual).toEqual(expected);
    },
  );
});
