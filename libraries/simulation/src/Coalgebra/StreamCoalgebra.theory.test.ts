// Written by the translator from `Falkara.Simulation.Coalgebra.StreamCoalgebra`, so every change by hand is lost when the translator runs.
import { describe, expect, it } from '@effect/vitest';
import { Effect, Schema, Stream } from 'effect';

import * as MealyMachine from '#src/Coalgebra/MealyMachine';
import * as StreamCoalgebra from '#src/Coalgebra/StreamCoalgebra';

describe('Coalgebra/StreamCoalgebra', () => {
  /** Running a stream coalgebra from a state gives first the output of the state and then what running it from the next state gives. */
  it.prop(
    'StreamCoalgebra.behavior_eq',
    {
      coalgebraTable: Schema.Tuple([
        Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
      ]),
      state: Schema.Literals([0, 1, 2]),
    },
    ({ coalgebraTable, state }) => {
      const coalgebra = StreamCoalgebra.make({
        structure: (state: 0 | 1 | 2) => coalgebraTable[state],
      });
      const actual = Effect.runSync(
        Stream.runCollect(Stream.take(StreamCoalgebra.behavior(coalgebra, state), 6)),
      );
      const expected = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            Stream.prepend(StreamCoalgebra.behavior(coalgebra, coalgebra.structure(state).next), [
              coalgebra.structure(state).output,
            ]),
            6,
          ),
        ),
      );
      expect(actual).toHaveLength(6);
      expect(actual).toEqual(expected);
    },
  );

  /** Running a stream coalgebra gives the outputs of its steps. */
  it.prop(
    'StreamCoalgebra.behavior_eq_map_steps',
    {
      coalgebraTable: Schema.Tuple([
        Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
      ]),
      state: Schema.Literals([0, 1, 2]),
    },
    ({ coalgebraTable, state }) => {
      const coalgebra = StreamCoalgebra.make({
        structure: (state: 0 | 1 | 2) => coalgebraTable[state],
      });
      const actual = Effect.runSync(
        Stream.runCollect(Stream.take(StreamCoalgebra.behavior(coalgebra, state), 6)),
      );
      const expected = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            Stream.map(StreamCoalgebra.steps(coalgebra, state), (value) => value.output),
            6,
          ),
        ),
      );
      expect(actual).toHaveLength(6);
      expect(actual).toEqual(expected);
    },
  );

  /** Running a stream coalgebra with mapped outputs gives the outputs of running it, mapped. */
  it.prop(
    'StreamCoalgebra.behavior_mapOutput',
    {
      coalgebraTable: Schema.Tuple([
        Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
      ]),
      f: Schema.Tuple([
        Schema.Literals([0, 1, 2]),
        Schema.Literals([0, 1, 2]),
        Schema.Literals([0, 1, 2]),
      ]),
      state: Schema.Literals([0, 1, 2]),
    },
    ({ coalgebraTable, f, state }) => {
      const coalgebra = StreamCoalgebra.make({
        structure: (state: 0 | 1 | 2) => coalgebraTable[state],
      });
      const actual = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            StreamCoalgebra.behavior(
              StreamCoalgebra.mapOutput(coalgebra, (output: 0 | 1 | 2) => f[output]),
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
              StreamCoalgebra.behavior(coalgebra, state),
              (output: 0 | 1 | 2) => f[output],
            ),
            6,
          ),
        ),
      );
      expect(actual).toHaveLength(6);
      expect(actual).toEqual(expected);
    },
  );

  /** Running the Mealy machine of a stream coalgebra upon any inputs gives what running the coalgebra gives. */
  it.prop(
    'StreamCoalgebra.behavior_toMealyMachine',
    {
      coalgebraTable: Schema.Tuple([
        Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
      ]),
      state: Schema.Literals([0, 1, 2]),
      inputs: Schema.Array(Schema.Void),
    },
    ({ coalgebraTable, state, inputs }) => {
      const coalgebra = StreamCoalgebra.make({
        structure: (state: 0 | 1 | 2) => coalgebraTable[state],
      });
      const actual = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            MealyMachine.behavior(
              StreamCoalgebra.toMealyMachine(coalgebra),
              state,
              Stream.fromIterable(inputs),
            ),
            inputs.length,
          ),
        ),
      );
      const expected = Effect.runSync(
        Stream.runCollect(Stream.take(StreamCoalgebra.behavior(coalgebra, state), inputs.length)),
      );
      expect(actual).toHaveLength(inputs.length);
      expect(actual).toEqual(expected);
    },
  );
});
