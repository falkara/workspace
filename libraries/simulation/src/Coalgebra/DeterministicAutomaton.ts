import { Effect, Function, type HKT, Stream } from 'effect';

import type * as Theory from '#src/Coalgebra/DeterministicAutomaton.theory';
import type * as MealyMachine from '#src/Coalgebra/MealyMachine';
import type * as Functor from '#src/Functor';
import type * as EffectFunctor from '#src/Functor/EffectFunctor';

export { type DeterministicAutomaton, make } from '#src/Coalgebra/DeterministicAutomaton.theory';

/** The automaton that maps every output of a deterministic automaton by a function, upon the state space of the automaton. */
export const mapOutput: {
  <Input, Output, MappedOutput, State, Monad extends HKT.TypeLambda = Functor.Id>(
    automaton: Theory.DeterministicAutomaton<Input, Output, State, Monad>,
    f: (output: Output) => MappedOutput,
  ): Theory.DeterministicAutomaton<Input, MappedOutput, State, Monad>;
  <Output, MappedOutput>(
    f: (output: Output) => MappedOutput,
  ): <Input, State, Monad extends HKT.TypeLambda = Functor.Id>(
    automaton: Theory.DeterministicAutomaton<Input, Output, State, Monad>,
  ) => Theory.DeterministicAutomaton<Input, MappedOutput, State, Monad>;
} = Function.dual(
  2,
  <Input, Output, MappedOutput, State, Monad extends HKT.TypeLambda>(
    automaton: Theory.DeterministicAutomaton<Input, Output, State, Monad>,
    f: (output: Output) => MappedOutput,
  ): Theory.DeterministicAutomaton<Input, MappedOutput, State, Monad> => ({
    structure: (state) => {
      const { output, next } = automaton.structure(state);
      return { output: f(output), next };
    },
  }),
);

/** The automaton that maps every input by a function before a deterministic automaton takes it, upon the state space of the automaton. */
export const mapInput: {
  <Input, MappedInput, Output, State, Monad extends HKT.TypeLambda = Functor.Id>(
    automaton: Theory.DeterministicAutomaton<Input, Output, State, Monad>,
    f: (input: MappedInput) => Input,
  ): Theory.DeterministicAutomaton<MappedInput, Output, State, Monad>;
  <Input, MappedInput>(
    f: (input: MappedInput) => Input,
  ): <Output, State, Monad extends HKT.TypeLambda = Functor.Id>(
    automaton: Theory.DeterministicAutomaton<Input, Output, State, Monad>,
  ) => Theory.DeterministicAutomaton<MappedInput, Output, State, Monad>;
} = Function.dual(
  2,
  <Input, MappedInput, Output, State, Monad extends HKT.TypeLambda>(
    automaton: Theory.DeterministicAutomaton<Input, Output, State, Monad>,
    f: (input: MappedInput) => Input,
  ): Theory.DeterministicAutomaton<MappedInput, Output, State, Monad> => ({
    structure: (state) => {
      const { output, next } = automaton.structure(state);
      return { output, next: (input) => next(f(input)) };
    },
  }),
);

/** The Mealy machine that a deterministic automaton runs as, which gives upon every input the output of the state and the state that the input leads to, upon the state space of the automaton. */
export const toMealyMachine: Theory.ToMealyMachine = (automaton) => ({
  structure: (state) => (input) => {
    const { output, next } = automaton.structure(state);
    return { output, next: next(input) };
  },
});

/** The Mealy machine that a deterministic automaton whose every transition is an effect runs as, which gives upon every input the output of the state and the state that the input leads to, upon the state space of the automaton. */
export const toMealyMachineEffect = <Input, Output, State, E, R>(
  automaton: Theory.DeterministicAutomaton<Input, Output, State, EffectFunctor.EffectFunctor<E, R>>,
): MealyMachine.MealyMachine<Input, Output, State, EffectFunctor.EffectFunctor<E, R>> => ({
  structure: (state) => (input) => {
    const { output, next } = automaton.structure(state);
    return Effect.map(next(input), (following) => ({ output, next: following }));
  },
});

/**
 * Creates a `DeterministicAutomaton` whose every transition is an effect, from its field `structure`, taking its types from the annotations of the parameters of the field and from the effects it gives.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.3
 */
export const makeEffect = <Input, Output, State, E, R>(
  fields: Theory.DeterministicAutomaton<Input, Output, State, EffectFunctor.EffectFunctor<E, R>>,
) => fields;

/**
 * The behavior of a deterministic automaton whose every transition is an effect, which gives from every state upon a stream of inputs the stream of the outputs of the state and of every state that the inputs lead to one after another, and fails where a transition or the inputs fail.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export function behaviorEffect<Input, Output, State, E2, R2, E = never, R = never>(
  automaton: Theory.DeterministicAutomaton<
    Input,
    Output,
    State,
    EffectFunctor.EffectFunctor<E2, R2>
  >,
  state: State,
  inputs: Stream.Stream<Input, E, R>,
): Stream.Stream<Output, E | E2, R | R2>;
export function behaviorEffect<Input, Output, State, E2, R2>(
  automaton: Theory.DeterministicAutomaton<
    Input,
    Output,
    State,
    EffectFunctor.EffectFunctor<E2, R2>
  >,
  state: State,
): <E = never, R = never>(
  inputs: Stream.Stream<Input, E, R>,
) => Stream.Stream<Output, E | E2, R | R2>;
export function behaviorEffect<Input, Output, State, E2, R2, E, R>(
  automaton: Theory.DeterministicAutomaton<
    Input,
    Output,
    State,
    EffectFunctor.EffectFunctor<E2, R2>
  >,
  state: State,
  inputs?: Stream.Stream<Input, E, R>,
):
  | Stream.Stream<Output, E | E2, R | R2>
  | ((inputs: Stream.Stream<Input, E, R>) => Stream.Stream<Output, E | E2, R | R2>) {
  // Without the inputs, the behavior waits for them, so that a stream of inputs pipes into it.
  if (inputs === undefined) return (piped) => behaviorEffect(automaton, state, piped);
  return inputs.pipe(
    Stream.mapAccumEffect(
      () => state,
      (current, input) => {
        const { output, next } = automaton.structure(current);
        return Effect.map(next(input), (following) => [following, [output]] as const);
      },
      // The state that the last input leads to gives its output once the inputs end.
      { onHalt: (current) => [automaton.structure(current).output] },
    ),
  );
}

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
  // A transition without effects runs at once, without an effect for every input.
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
