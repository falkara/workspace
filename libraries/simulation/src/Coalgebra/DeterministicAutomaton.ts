import { Stream } from 'effect';

import type * as Theory from '#src/Coalgebra/DeterministicAutomaton.theory';

export { type DeterministicAutomaton, make } from '#src/Coalgebra/DeterministicAutomaton.theory';

/**
 * The behavior of a deterministic automaton, which gives from every state upon a stream of inputs the stream of the outputs of the state and of every state that the inputs lead to one after another.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export function behavior<Input, Output, State, E = never, R = never>(
  automaton: Theory.DeterministicAutomaton<Input, Output, State>,
  state: State,
  inputs: Stream.Stream<Input, E, R>,
): Stream.Stream<Output, E, R>;
export function behavior<Input, Output, State>(
  automaton: Theory.DeterministicAutomaton<Input, Output, State>,
  state: State,
): <E = never, R = never>(inputs: Stream.Stream<Input, E, R>) => Stream.Stream<Output, E, R>;
export function behavior<Input, Output, State, E, R>(
  automaton: Theory.DeterministicAutomaton<Input, Output, State>,
  state: State,
  inputs?: Stream.Stream<Input, E, R>,
):
  | Stream.Stream<Output, E, R>
  | ((inputs: Stream.Stream<Input, E, R>) => Stream.Stream<Output, E, R>) {
  // Without the inputs, the behavior waits for them, so that a stream of inputs pipes into it.
  if (inputs === undefined) return (piped) => behavior(automaton, state, piped);
  return inputs.pipe(
    Stream.mapAccum(
      () => state,
      (current, input) => {
        const { output, next } = automaton.structure(current);
        return [next(input), [output]] as const;
      },
      // The state that the last input leads to gives its output once the inputs end.
      { onHalt: (current) => [automaton.structure(current).output] },
    ),
  );
}
