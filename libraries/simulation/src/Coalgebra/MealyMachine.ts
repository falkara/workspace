import { Effect, Function, type HKT, Stream } from 'effect';

import type * as Theory from '#src/Coalgebra/MealyMachine.theory';
import type * as Functor from '#src/Functor';
import type * as BinaryProductFunctor from '#src/Functor/BinaryProductFunctor';
import type * as EffectFunctor from '#src/Functor/EffectFunctor';

export { type MealyMachine, make } from '#src/Coalgebra/MealyMachine.theory';

/** The machine that maps every output of a Mealy machine by a function, upon the state space of the machine. */
export const mapOutput: Theory.MapOutput = Function.dual(
  2,
  <Input, Output, MappedOutput, State>(
    machine: Theory.MealyMachine<Input, Output, State>,
    f: (output: Output) => MappedOutput,
  ): Theory.MealyMachine<Input, MappedOutput, State> => ({
    structure: (state) => (input) => {
      const step = machine.structure(state)(input);
      return { output: f(step.output), next: step.next };
    },
  }),
);

/** The machine that maps every output of a Mealy machine whose every step is an effect by a function, upon the state space of the machine. */
export const mapOutputEffect: {
  <Input, Output, MappedOutput, State, E, R>(
    machine: Theory.MealyMachine<Input, Output, State, EffectFunctor.EffectFunctor<E, R>>,
    f: (output: Output) => MappedOutput,
  ): Theory.MealyMachine<Input, MappedOutput, State, EffectFunctor.EffectFunctor<E, R>>;
  <Output, MappedOutput>(
    f: (output: Output) => MappedOutput,
  ): <Input, State, E, R>(
    machine: Theory.MealyMachine<Input, Output, State, EffectFunctor.EffectFunctor<E, R>>,
  ) => Theory.MealyMachine<Input, MappedOutput, State, EffectFunctor.EffectFunctor<E, R>>;
} = Function.dual(
  2,
  <Input, Output, MappedOutput, State, E, R>(
    machine: Theory.MealyMachine<Input, Output, State, EffectFunctor.EffectFunctor<E, R>>,
    f: (output: Output) => MappedOutput,
  ): Theory.MealyMachine<Input, MappedOutput, State, EffectFunctor.EffectFunctor<E, R>> => ({
    structure: (state) => (input) =>
      Effect.map(machine.structure(state)(input), (step) => ({
        output: f(step.output),
        next: step.next,
      })),
  }),
);

/** The machine that maps every input by a function before a Mealy machine takes it, upon the state space of the machine. */
export const mapInput: {
  <Input, MappedInput, Output, State, Monad extends HKT.TypeLambda = Functor.Id>(
    machine: Theory.MealyMachine<Input, Output, State, Monad>,
    f: (input: MappedInput) => Input,
  ): Theory.MealyMachine<MappedInput, Output, State, Monad>;
  <Input, MappedInput>(
    f: (input: MappedInput) => Input,
  ): <Output, State, Monad extends HKT.TypeLambda = Functor.Id>(
    machine: Theory.MealyMachine<Input, Output, State, Monad>,
  ) => Theory.MealyMachine<MappedInput, Output, State, Monad>;
} = Function.dual(
  2,
  <Input, MappedInput, Output, State, Monad extends HKT.TypeLambda>(
    machine: Theory.MealyMachine<Input, Output, State, Monad>,
    f: (input: MappedInput) => Input,
  ): Theory.MealyMachine<MappedInput, Output, State, Monad> => ({
    structure: (state) => (input) => machine.structure(state)(f(input)),
  }),
);

/** The machine that feeds every output of a Mealy machine into another as its input, upon the pairs of the states of the two machines. */
export const series: Theory.Series = Function.dual(
  2,
  <Input, Middle, Output, FirstState, SecondState>(
    first: Theory.MealyMachine<Input, Middle, FirstState>,
    second: Theory.MealyMachine<Middle, Output, SecondState>,
  ): Theory.MealyMachine<Input, Output, readonly [FirstState, SecondState]> => ({
    structure:
      ([firstState, secondState]) =>
      (input) => {
        const firstStep = first.structure(firstState)(input);
        const secondStep = second.structure(secondState)(firstStep.output);
        return { output: secondStep.output, next: [firstStep.next, secondStep.next] as const };
      },
  }),
);

/** The machine that feeds every output of a Mealy machine whose every step is an effect into another as its input, upon the pairs of the states of the two machines, running the effect of the first machine before the effect of the second. */
export const seriesEffect: {
  <Input, Middle, Output, FirstState, SecondState, E, R, E2, R2>(
    first: Theory.MealyMachine<Input, Middle, FirstState, EffectFunctor.EffectFunctor<E, R>>,
    second: Theory.MealyMachine<Middle, Output, SecondState, EffectFunctor.EffectFunctor<E2, R2>>,
  ): Theory.MealyMachine<
    Input,
    Output,
    readonly [FirstState, SecondState],
    EffectFunctor.EffectFunctor<E | E2, R | R2>
  >;
  <Middle, Output, SecondState, E2, R2>(
    second: Theory.MealyMachine<Middle, Output, SecondState, EffectFunctor.EffectFunctor<E2, R2>>,
  ): <Input, FirstState, E, R>(
    first: Theory.MealyMachine<Input, Middle, FirstState, EffectFunctor.EffectFunctor<E, R>>,
  ) => Theory.MealyMachine<
    Input,
    Output,
    readonly [FirstState, SecondState],
    EffectFunctor.EffectFunctor<E | E2, R | R2>
  >;
} = Function.dual(
  2,
  <Input, Middle, Output, FirstState, SecondState, E, R, E2, R2>(
    first: Theory.MealyMachine<Input, Middle, FirstState, EffectFunctor.EffectFunctor<E, R>>,
    second: Theory.MealyMachine<Middle, Output, SecondState, EffectFunctor.EffectFunctor<E2, R2>>,
  ): Theory.MealyMachine<
    Input,
    Output,
    readonly [FirstState, SecondState],
    EffectFunctor.EffectFunctor<E | E2, R | R2>
  > => ({
    structure:
      ([firstState, secondState]) =>
      (input) =>
        Effect.flatMap(first.structure(firstState)(input), (firstStep) =>
          Effect.map(second.structure(secondState)(firstStep.output), (secondStep) => ({
            output: secondStep.output,
            next: [firstStep.next, secondStep.next] as const,
          })),
        ),
  }),
);

/** The machine that runs two Mealy machines side by side, each upon its part of every input, upon the pairs of the states of the two machines. */
export const parallel: Theory.Parallel = Function.dual(
  2,
  <FirstInput, FirstOutput, SecondInput, SecondOutput, FirstState, SecondState>(
    first: Theory.MealyMachine<FirstInput, FirstOutput, FirstState>,
    second: Theory.MealyMachine<SecondInput, SecondOutput, SecondState>,
  ): Theory.MealyMachine<
    readonly [FirstInput, SecondInput],
    readonly [FirstOutput, SecondOutput],
    readonly [FirstState, SecondState]
  > => ({
    structure:
      ([firstState, secondState]) =>
      ([firstInput, secondInput]) => {
        const firstStep = first.structure(firstState)(firstInput);
        const secondStep = second.structure(secondState)(secondInput);
        return {
          output: [firstStep.output, secondStep.output] as const,
          next: [firstStep.next, secondStep.next] as const,
        };
      },
  }),
);

/** The machine that runs two Mealy machines whose every step is an effect side by side, each upon its part of every input, upon the pairs of the states of the two machines, running the effect of the first machine before the effect of the second. */
export const parallelEffect: {
  <FirstInput, FirstOutput, SecondInput, SecondOutput, FirstState, SecondState, E, R, E2, R2>(
    first: Theory.MealyMachine<
      FirstInput,
      FirstOutput,
      FirstState,
      EffectFunctor.EffectFunctor<E, R>
    >,
    second: Theory.MealyMachine<
      SecondInput,
      SecondOutput,
      SecondState,
      EffectFunctor.EffectFunctor<E2, R2>
    >,
  ): Theory.MealyMachine<
    readonly [FirstInput, SecondInput],
    readonly [FirstOutput, SecondOutput],
    readonly [FirstState, SecondState],
    EffectFunctor.EffectFunctor<E | E2, R | R2>
  >;
  <SecondInput, SecondOutput, SecondState, E2, R2>(
    second: Theory.MealyMachine<
      SecondInput,
      SecondOutput,
      SecondState,
      EffectFunctor.EffectFunctor<E2, R2>
    >,
  ): <FirstInput, FirstOutput, FirstState, E, R>(
    first: Theory.MealyMachine<
      FirstInput,
      FirstOutput,
      FirstState,
      EffectFunctor.EffectFunctor<E, R>
    >,
  ) => Theory.MealyMachine<
    readonly [FirstInput, SecondInput],
    readonly [FirstOutput, SecondOutput],
    readonly [FirstState, SecondState],
    EffectFunctor.EffectFunctor<E | E2, R | R2>
  >;
} = Function.dual(
  2,
  <FirstInput, FirstOutput, SecondInput, SecondOutput, FirstState, SecondState, E, R, E2, R2>(
    first: Theory.MealyMachine<
      FirstInput,
      FirstOutput,
      FirstState,
      EffectFunctor.EffectFunctor<E, R>
    >,
    second: Theory.MealyMachine<
      SecondInput,
      SecondOutput,
      SecondState,
      EffectFunctor.EffectFunctor<E2, R2>
    >,
  ): Theory.MealyMachine<
    readonly [FirstInput, SecondInput],
    readonly [FirstOutput, SecondOutput],
    readonly [FirstState, SecondState],
    EffectFunctor.EffectFunctor<E | E2, R | R2>
  > => ({
    structure:
      ([firstState, secondState]) =>
      ([firstInput, secondInput]) =>
        Effect.zipWith(
          first.structure(firstState)(firstInput),
          second.structure(secondState)(secondInput),
          (firstStep, secondStep) => ({
            output: [firstStep.output, secondStep.output] as const,
            next: [firstStep.next, secondStep.next] as const,
          }),
        ),
  }),
);

/**
 * Creates a `MealyMachine` whose every step is an effect, from its field `structure`, taking its types from the annotations of the parameters of the field and from the effects it gives.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Exercise 2.3.2
 */
export const makeEffect = <Input, Output, State, E, R>(
  fields: Theory.MealyMachine<Input, Output, State, EffectFunctor.EffectFunctor<E, R>>,
) => fields;

/**
 * The steps of a Mealy machine whose every step is an effect, which gives from every state upon a stream of inputs the stream of the steps that the machine takes upon the inputs one after another, each an output with the next state, and fails where a step or the inputs fail.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export function stepsEffect<Input, Output, State, E2, R2, E = never, R = never>(
  machine: Theory.MealyMachine<Input, Output, State, EffectFunctor.EffectFunctor<E2, R2>>,
  state: State,
  inputs: Stream.Stream<Input, E, R>,
): Stream.Stream<BinaryProductFunctor.Product<Output, State>, E | E2, R | R2>;
export function stepsEffect<Input, Output, State, E2, R2>(
  machine: Theory.MealyMachine<Input, Output, State, EffectFunctor.EffectFunctor<E2, R2>>,
  state: State,
): <E = never, R = never>(
  inputs: Stream.Stream<Input, E, R>,
) => Stream.Stream<BinaryProductFunctor.Product<Output, State>, E | E2, R | R2>;
export function stepsEffect<Input, Output, State, E2, R2, E, R>(
  machine: Theory.MealyMachine<Input, Output, State, EffectFunctor.EffectFunctor<E2, R2>>,
  state: State,
  inputs?: Stream.Stream<Input, E, R>,
):
  | Stream.Stream<BinaryProductFunctor.Product<Output, State>, E | E2, R | R2>
  | ((
      inputs: Stream.Stream<Input, E, R>,
    ) => Stream.Stream<BinaryProductFunctor.Product<Output, State>, E | E2, R | R2>) {
  // Without the inputs, the steps wait for them, so that a stream of inputs pipes into them.
  if (inputs === undefined) return (piped) => stepsEffect(machine, state, piped);
  return inputs.pipe(
    Stream.mapAccumEffect(
      () => state,
      (current, input) =>
        Effect.map(machine.structure(current)(input), (step) => [step.next, [step]] as const),
    ),
  );
}

/**
 * The behavior of a Mealy machine whose every step is an effect, which gives from every state upon a stream of inputs the stream of the outputs that the machine gives upon the inputs one after another, and fails where a step or the inputs fail.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export function behaviorEffect<Input, Output, State, E2, R2, E = never, R = never>(
  machine: Theory.MealyMachine<Input, Output, State, EffectFunctor.EffectFunctor<E2, R2>>,
  state: State,
  inputs: Stream.Stream<Input, E, R>,
): Stream.Stream<Output, E | E2, R | R2>;
export function behaviorEffect<Input, Output, State, E2, R2>(
  machine: Theory.MealyMachine<Input, Output, State, EffectFunctor.EffectFunctor<E2, R2>>,
  state: State,
): <E = never, R = never>(
  inputs: Stream.Stream<Input, E, R>,
) => Stream.Stream<Output, E | E2, R | R2>;
export function behaviorEffect<Input, Output, State, E2, R2, E, R>(
  machine: Theory.MealyMachine<Input, Output, State, EffectFunctor.EffectFunctor<E2, R2>>,
  state: State,
  inputs?: Stream.Stream<Input, E, R>,
):
  | Stream.Stream<Output, E | E2, R | R2>
  | ((inputs: Stream.Stream<Input, E, R>) => Stream.Stream<Output, E | E2, R | R2>) {
  // Without the inputs, the behavior waits for them, so that a stream of inputs pipes into it.
  if (inputs === undefined) return (piped) => behaviorEffect(machine, state, piped);
  return Stream.map(stepsEffect(machine, state, inputs), (step) => step.output);
}

/**
 * The steps of a Mealy machine, which gives from every state upon a stream of inputs the stream of the steps that the machine takes upon the inputs one after another, each an output with the next state, the behavior of the machine whose output is the whole step.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export function steps<Input, Output, State, E = never, R = never>(
  machine: Theory.MealyMachine<Input, Output, State>,
  state: State,
  inputs: Stream.Stream<Input, E, R>,
): Stream.Stream<BinaryProductFunctor.Product<Output, State>, E, R>;
export function steps<Input, Output, State>(
  machine: Theory.MealyMachine<Input, Output, State>,
  state: State,
): <E = never, R = never>(
  inputs: Stream.Stream<Input, E, R>,
) => Stream.Stream<BinaryProductFunctor.Product<Output, State>, E, R>;
export function steps<Input, Output, State, E, R>(
  machine: Theory.MealyMachine<Input, Output, State>,
  state: State,
  inputs?: Stream.Stream<Input, E, R>,
):
  | Stream.Stream<BinaryProductFunctor.Product<Output, State>, E, R>
  | ((
      inputs: Stream.Stream<Input, E, R>,
    ) => Stream.Stream<BinaryProductFunctor.Product<Output, State>, E, R>) {
  // Without the inputs, the steps wait for them, so that a stream of inputs pipes into them.
  if (inputs === undefined) return (piped) => steps(machine, state, piped);
  // A step without effects runs at once, without an effect for every input.
  return inputs.pipe(
    Stream.mapAccum(
      () => state,
      (current, input) => {
        const step = machine.structure(current)(input);
        return [step.next, [step]] as const;
      },
    ),
  );
}

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
  return Stream.map(steps(machine, state, inputs), (step) => step.output);
}
