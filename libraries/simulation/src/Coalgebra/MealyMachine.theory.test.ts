// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.MealyMachine`, so every change by hand is lost when the generator runs.
import { describe, expect, it } from '@effect/vitest';
import { Effect, Schema, Stream } from 'effect';

import * as MealyMachine from '#src/Coalgebra/MealyMachine';

describe('Coalgebra/MealyMachine', () => {
  /** Running a Mealy machine upon inputs gives first its output upon the first input and then what running it from the next state gives upon the rest of the inputs. */
  it.prop(
    'MealyMachine.behavior_eq',
    {
      machineTable: Schema.Tuple([
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
      ]),
      state: Schema.Literals([0, 1, 2]),
      inputs: Schema.NonEmptyArray(Schema.Literals([0, 1, 2])),
    },
    ({ machineTable, state, inputs }) => {
      const machine = MealyMachine.make({
        structure: (state: 0 | 1 | 2) => (input: 0 | 1 | 2) => machineTable[state][input],
      });
      const step = machine.structure(state);
      const actual = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            MealyMachine.behavior(machine, state, Stream.fromIterable(inputs)),
            inputs.length,
          ),
        ),
      );
      const expected = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            Stream.prepend(
              MealyMachine.behavior(
                machine,
                step(inputs[0]).next,
                Stream.drop(Stream.fromIterable(inputs), 1),
              ),
              [step(inputs[0]).output],
            ),
            inputs.length,
          ),
        ),
      );
      expect(actual).toHaveLength(inputs.length);
      expect(actual).toEqual(expected);
    },
  );

  /** Running a Mealy machine gives the outputs of its steps. */
  it.prop(
    'MealyMachine.behavior_eq_map_steps',
    {
      machineTable: Schema.Tuple([
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
      ]),
      state: Schema.Literals([0, 1, 2]),
      inputs: Schema.Array(Schema.Literals([0, 1, 2])),
    },
    ({ machineTable, state, inputs }) => {
      const machine = MealyMachine.make({
        structure: (state: 0 | 1 | 2) => (input: 0 | 1 | 2) => machineTable[state][input],
      });
      const actual = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            MealyMachine.behavior(machine, state, Stream.fromIterable(inputs)),
            inputs.length,
          ),
        ),
      );
      const expected = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            Stream.map(
              MealyMachine.steps(machine, state, Stream.fromIterable(inputs)),
              (value) => value.output,
            ),
            inputs.length,
          ),
        ),
      );
      expect(actual).toHaveLength(inputs.length);
      expect(actual).toEqual(expected);
    },
  );

  /** Running a Mealy machine with mapped outputs gives the outputs of running it, mapped. */
  it.prop(
    'MealyMachine.behavior_mapOutput',
    {
      machineTable: Schema.Tuple([
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
      ]),
      f: Schema.Tuple([
        Schema.Literals([0, 1, 2]),
        Schema.Literals([0, 1, 2]),
        Schema.Literals([0, 1, 2]),
      ]),
      state: Schema.Literals([0, 1, 2]),
      inputs: Schema.Array(Schema.Literals([0, 1, 2])),
    },
    ({ machineTable, f, state, inputs }) => {
      const machine = MealyMachine.make({
        structure: (state: 0 | 1 | 2) => (input: 0 | 1 | 2) => machineTable[state][input],
      });
      const actual = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            MealyMachine.behavior(
              MealyMachine.mapOutput(machine, (output: 0 | 1 | 2) => f[output]),
              state,
              Stream.fromIterable(inputs),
            ),
            inputs.length,
          ),
        ),
      );
      const expected = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            Stream.map(
              MealyMachine.behavior(machine, state, Stream.fromIterable(inputs)),
              (output: 0 | 1 | 2) => f[output],
            ),
            inputs.length,
          ),
        ),
      );
      expect(actual).toHaveLength(inputs.length);
      expect(actual).toEqual(expected);
    },
  );

  /** Running a Mealy machine with mapped inputs gives what running it upon the mapped inputs gives. */
  it.prop(
    'MealyMachine.behavior_mapInput',
    {
      machineTable: Schema.Tuple([
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
      ]),
      f: Schema.Tuple([
        Schema.Literals([0, 1, 2]),
        Schema.Literals([0, 1, 2]),
        Schema.Literals([0, 1, 2]),
      ]),
      state: Schema.Literals([0, 1, 2]),
      inputs: Schema.Array(Schema.Literals([0, 1, 2])),
    },
    ({ machineTable, f, state, inputs }) => {
      const machine = MealyMachine.make({
        structure: (state: 0 | 1 | 2) => (input: 0 | 1 | 2) => machineTable[state][input],
      });
      const actual = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            MealyMachine.behavior(
              MealyMachine.mapInput(machine, (input: 0 | 1 | 2) => f[input]),
              state,
              Stream.fromIterable(inputs),
            ),
            inputs.length,
          ),
        ),
      );
      const expected = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            MealyMachine.behavior(
              machine,
              state,
              Stream.map(Stream.fromIterable(inputs), (input: 0 | 1 | 2) => f[input]),
            ),
            inputs.length,
          ),
        ),
      );
      expect(actual).toHaveLength(inputs.length);
      expect(actual).toEqual(expected);
    },
  );

  /** Running two Mealy machines in series gives what running the second upon the outputs of the first gives. */
  it.prop(
    'MealyMachine.behavior_series',
    {
      firstTable: Schema.Tuple([
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
      ]),
      secondTable: Schema.Tuple([
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
      ]),
      firstState: Schema.Literals([0, 1, 2]),
      secondState: Schema.Literals([0, 1, 2]),
      inputs: Schema.Array(Schema.Literals([0, 1, 2])),
    },
    ({ firstTable, secondTable, firstState, secondState, inputs }) => {
      const first = MealyMachine.make({
        structure: (state: 0 | 1 | 2) => (input: 0 | 1 | 2) => firstTable[state][input],
      });
      const second = MealyMachine.make({
        structure: (state: 0 | 1 | 2) => (middle: 0 | 1 | 2) => secondTable[state][middle],
      });
      const actual = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            MealyMachine.behavior(
              MealyMachine.series(first, second),
              [firstState, secondState],
              Stream.fromIterable(inputs),
            ),
            inputs.length,
          ),
        ),
      );
      const expected = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            MealyMachine.behavior(
              second,
              secondState,
              MealyMachine.behavior(first, firstState, Stream.fromIterable(inputs)),
            ),
            inputs.length,
          ),
        ),
      );
      expect(actual).toHaveLength(inputs.length);
      expect(actual).toEqual(expected);
    },
  );

  /** Running two Mealy machines side by side gives the pairs of what each gives upon its part of the inputs. */
  it.prop(
    'MealyMachine.behavior_parallel',
    {
      firstTable: Schema.Tuple([
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
      ]),
      secondTable: Schema.Tuple([
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
        Schema.Tuple([
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
          Schema.Struct({ output: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }),
        ]),
      ]),
      firstState: Schema.Literals([0, 1, 2]),
      secondState: Schema.Literals([0, 1, 2]),
      inputs: Schema.Array(Schema.Tuple([Schema.Literals([0, 1, 2]), Schema.Literals([0, 1, 2])])),
    },
    ({ firstTable, secondTable, firstState, secondState, inputs }) => {
      const first = MealyMachine.make({
        structure: (state: 0 | 1 | 2) => (firstInput: 0 | 1 | 2) => firstTable[state][firstInput],
      });
      const second = MealyMachine.make({
        structure: (state: 0 | 1 | 2) => (secondInput: 0 | 1 | 2) =>
          secondTable[state][secondInput],
      });
      const actual = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            MealyMachine.behavior(
              MealyMachine.parallel(first, second),
              [firstState, secondState],
              Stream.fromIterable(inputs),
            ),
            inputs.length,
          ),
        ),
      );
      const expected = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            Stream.zip(
              MealyMachine.behavior(
                first,
                firstState,
                Stream.map(Stream.fromIterable(inputs), (value) => value[0]),
              ),
              MealyMachine.behavior(
                second,
                secondState,
                Stream.map(Stream.fromIterable(inputs), (value) => value[1]),
              ),
            ),
            inputs.length,
          ),
        ),
      );
      expect(actual).toHaveLength(inputs.length);
      expect(actual).toEqual(expected);
    },
  );
});
