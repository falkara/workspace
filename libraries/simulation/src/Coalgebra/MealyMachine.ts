import { Stream } from 'effect';

import type * as Theory from '#src/Coalgebra/MealyMachine.theory';

export { type MealyMachine, mealyMachine } from '#src/Coalgebra/MealyMachine.theory';

/**
 * The behavior of a Mealy machine, which gives from every state upon a stream of inputs the stream of the outputs that the machine gives upon the inputs one after another.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const mealyMachineBehavior = <Input, Output, State, E = never, R = never>(
  machine: Theory.MealyMachine<Input, Output, State>,
  state: State,
  inputs: Stream.Stream<Input, E, R>,
): Stream.Stream<Output, E, R> =>
  inputs.pipe(
    Stream.mapAccum(
      () => state,
      (current, input) => {
        const [output, next] = machine.structure(current)(input);
        return [next, [output]] as const;
      },
    ),
  );
