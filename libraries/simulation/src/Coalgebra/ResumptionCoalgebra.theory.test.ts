// Written by the translator from `Falkara.Simulation.Coalgebra.ResumptionCoalgebra`, so every change by hand is lost when the translator runs.
import { describe, expect, it } from '@effect/vitest';
import { Effect, Schema, Stream } from 'effect';

import * as ResumptionCoalgebra from '#src/Coalgebra/ResumptionCoalgebra';

describe('Coalgebra/ResumptionCoalgebra', () => {
  /** A schema of the table of a function from three values, its value at each of them. */
  const tableOf = <Value extends Schema.Constraint>(value: Value) =>
    Schema.Tuple([value, value, value]);

  /** Running a resumption coalgebra gives the outputs of its steps. */
  it.prop(
    'ResumptionCoalgebra.behavior_eq_map_steps',
    {
      coalgebraTable: tableOf(
        Schema.Result(
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Literals([0, 1, 2]),
        ),
      ),
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
