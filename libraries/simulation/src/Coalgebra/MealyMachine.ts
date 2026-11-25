import { Stream } from 'effect';

import type * as Theory from '#src/Coalgebra/MealyMachine.theory';

export { type MealyMachine, make } from '#src/Coalgebra/MealyMachine.theory';

/**
 * The behavior of a Mealy machine, which gives from every state upon a stream of inputs the stream of the outputs that the machine gives upon the inputs one after another.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export function behavior<Input, Output, State, E = never, R = never>(
  machine: Theory.MealyMachine<Input, Output, State>,
  state: State,
  inputs: Stream.Stream<Input, E, R>,
): Stream.Stream<Output, E, R>;
export function behavior<Input, Output, State>(
  machine: Theory.MealyMachine<Input, Output, State>,
  state: State,
): <E = never, R = never>(inputs: Stream.Stream<Input, E, R>) => Stream.Stream<Output, E, R>;
export function behavior<Input, Output, State, E, R>(
  machine: Theory.MealyMachine<Input, Output, State>,
  state: State,
  inputs?: Stream.Stream<Input, E, R>,
):
  | Stream.Stream<Output, E, R>
  | ((inputs: Stream.Stream<Input, E, R>) => Stream.Stream<Output, E, R>) {
  // Without the inputs, the behavior waits for them, so that a stream of inputs pipes into it.
  if (inputs === undefined) return (piped) => behavior(machine, state, piped);
  return inputs.pipe(
    Stream.mapAccum(
      () => state,
      (current, input) => {
        const { output, next } = machine.structure(current)(input);
        return [next, [output]] as const;
      },
    ),
  );
}
