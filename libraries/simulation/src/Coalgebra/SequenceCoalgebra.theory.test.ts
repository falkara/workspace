// Written by the translator from `Falkara.Simulation.Coalgebra.SequenceCoalgebra`, so every change by hand is lost when the translator runs.
import { describe, expect, it } from '@effect/vitest';
import { Effect, Schema, Stream } from 'effect';

import * as SequenceCoalgebra from '#src/Coalgebra/SequenceCoalgebra';

describe('Coalgebra/SequenceCoalgebra', () => {
  /** A schema of the table of a function from three values, its value at each of them. */
  const tableOf = <Value extends Schema.Constraint>(value: Value) =>
    Schema.Tuple([value, value, value]);

  /** Running a sequence coalgebra gives the outputs of its steps. */
  it.prop(
    'SequenceCoalgebra.behavior_eq_map_steps',
    {
      coalgebraTable: tableOf(
        Schema.Option(
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ),
      ),
      state: Schema.Literals([0, 1, 2]),
    },
    ({ coalgebraTable, state }) => {
      const coalgebra = SequenceCoalgebra.make({
        structure: (state: 0 | 1 | 2) => coalgebraTable[state],
      });
      const actual = Effect.runSync(
        Stream.runCollect(Stream.take(SequenceCoalgebra.behavior(coalgebra, state), 6)),
      );
      const expected = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            Stream.map(SequenceCoalgebra.steps(coalgebra, state), (value) => value.output),
            6,
          ),
        ),
      );
      expect(actual).toEqual(expected);
    },
  );

  /** Running a sequence coalgebra with mapped outputs gives the outputs of running it, mapped. */
  it.prop(
    'SequenceCoalgebra.behavior_mapOutput',
    {
      coalgebraTable: tableOf(
        Schema.Option(
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ),
      ),
      f: tableOf(Schema.Literals([0, 1, 2])),
      state: Schema.Literals([0, 1, 2]),
    },
    ({ coalgebraTable, f, state }) => {
      const coalgebra = SequenceCoalgebra.make({
        structure: (state: 0 | 1 | 2) => coalgebraTable[state],
      });
      const actual = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            SequenceCoalgebra.behavior(
              SequenceCoalgebra.mapOutput(coalgebra, (output: 0 | 1 | 2) => f[output]),
              state,
            ),
            6,
          ),
        ),
      );
      const expected = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            Stream.map(
              SequenceCoalgebra.behavior(coalgebra, state),
              (output: 0 | 1 | 2) => f[output],
            ),
            6,
          ),
        ),
      );
      expect(actual).toEqual(expected);
    },
  );
});
