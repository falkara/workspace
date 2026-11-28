// Written by the translator from `Falkara.Simulation.Coalgebra.DeterministicAutomaton`, so every change by hand is lost when the translator runs.
import { describe, expect, it } from '@effect/vitest';
import { Effect, Schema, Stream } from 'effect';

import * as DeterministicAutomaton from '#src/Coalgebra/DeterministicAutomaton';
import * as MealyMachine from '#src/Coalgebra/MealyMachine';

describe('Coalgebra/DeterministicAutomaton', () => {
  /** A schema of the table of a function from three values, its value at each of them. */
  const tableOf = <Value extends Schema.Constraint>(value: Value) =>
    Schema.Tuple([value, value, value]);

  /** Running a deterministic automaton upon inputs gives first the output of its state and then what running it from the state that the first input leads to gives upon the rest of the inputs. */
  it.prop(
    'DeterministicAutomaton.behavior_eq',
    {
      automatonTable: tableOf(
        Schema.Struct({
          output: Schema.Literals([0, 1, 2]),
          next: tableOf(Schema.Literals([0, 1, 2])),
        }),
      ),
      state: Schema.Literals([0, 1, 2]),
      inputs: Schema.NonEmptyArray(Schema.Literals([0, 1, 2])),
    },
    ({ automatonTable, state, inputs }) => {
      const automaton = DeterministicAutomaton.make({
        structure: (state: 0 | 1 | 2) => ({
          output: automatonTable[state].output,
          next: (input: 0 | 1 | 2) => automatonTable[state].next[input],
        }),
      });
      const step = automaton.structure(state);
      const actual = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            DeterministicAutomaton.behavior(automaton, state, Stream.fromIterable(inputs)),
            inputs.length,
          ),
        ),
      );
      const expected = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            Stream.prepend(
              DeterministicAutomaton.behavior(
                automaton,
                step.next(inputs[0]),
                Stream.drop(Stream.fromIterable(inputs), 1),
              ),
              [step.output],
            ),
            inputs.length,
          ),
        ),
      );
      expect(actual).toHaveLength(inputs.length);
      expect(actual).toEqual(expected);
    },
  );

  /** Running a deterministic automaton with mapped outputs gives the outputs of running it, mapped. */
  it.prop(
    'DeterministicAutomaton.behavior_mapOutput',
    {
      automatonTable: tableOf(
        Schema.Struct({
          output: Schema.Literals([0, 1, 2]),
          next: tableOf(Schema.Literals([0, 1, 2])),
        }),
      ),
      f: tableOf(Schema.Literals([0, 1, 2])),
      state: Schema.Literals([0, 1, 2]),
      inputs: Schema.Array(Schema.Literals([0, 1, 2])),
    },
    ({ automatonTable, f, state, inputs }) => {
      const automaton = DeterministicAutomaton.make({
        structure: (state: 0 | 1 | 2) => ({
          output: automatonTable[state].output,
          next: (input: 0 | 1 | 2) => automatonTable[state].next[input],
        }),
      });
      const actual = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            DeterministicAutomaton.behavior(
              DeterministicAutomaton.mapOutput(automaton, (output: 0 | 1 | 2) => f[output]),
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
              DeterministicAutomaton.behavior(automaton, state, Stream.fromIterable(inputs)),
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

  /** Running a deterministic automaton with mapped inputs gives what running it upon the mapped inputs gives. */
  it.prop(
    'DeterministicAutomaton.behavior_mapInput',
    {
      automatonTable: tableOf(
        Schema.Struct({
          output: Schema.Literals([0, 1, 2]),
          next: tableOf(Schema.Literals([0, 1, 2])),
        }),
      ),
      f: tableOf(Schema.Literals([0, 1, 2])),
      state: Schema.Literals([0, 1, 2]),
      inputs: Schema.Array(Schema.Literals([0, 1, 2])),
    },
    ({ automatonTable, f, state, inputs }) => {
      const automaton = DeterministicAutomaton.make({
        structure: (state: 0 | 1 | 2) => ({
          output: automatonTable[state].output,
          next: (input: 0 | 1 | 2) => automatonTable[state].next[input],
        }),
      });
      const actual = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            DeterministicAutomaton.behavior(
              DeterministicAutomaton.mapInput(automaton, (input: 0 | 1 | 2) => f[input]),
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
            DeterministicAutomaton.behavior(
              automaton,
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

  /** Running the Mealy machine of a deterministic automaton gives what running the automaton gives. */
  it.prop(
    'DeterministicAutomaton.behavior_toMealyMachine',
    {
      automatonTable: tableOf(
        Schema.Struct({
          output: Schema.Literals([0, 1, 2]),
          next: tableOf(Schema.Literals([0, 1, 2])),
        }),
      ),
      state: Schema.Literals([0, 1, 2]),
      inputs: Schema.Array(Schema.Literals([0, 1, 2])),
    },
    ({ automatonTable, state, inputs }) => {
      const automaton = DeterministicAutomaton.make({
        structure: (state: 0 | 1 | 2) => ({
          output: automatonTable[state].output,
          next: (input: 0 | 1 | 2) => automatonTable[state].next[input],
        }),
      });
      const actual = Effect.runSync(
        Stream.runCollect(
          Stream.take(
            MealyMachine.behavior(
              DeterministicAutomaton.toMealyMachine(automaton),
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
            DeterministicAutomaton.behavior(automaton, state, Stream.fromIterable(inputs)),
            inputs.length,
          ),
        ),
      );
      expect(actual).toHaveLength(inputs.length);
      expect(actual).toEqual(expected);
    },
  );
});
