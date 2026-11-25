import { Effect, Function, type HKT, Stream } from 'effect';

import type * as MealyMachine from '#src/Coalgebra/MealyMachine';
import type * as Theory from '#src/Coalgebra/StreamCoalgebra.theory';
import type * as Functor from '#src/Functor';
import type * as BinaryProductFunctor from '#src/Functor/BinaryProductFunctor';
import type * as EffectFunctor from '#src/Functor/EffectFunctor';

export { make, type StreamCoalgebra } from '#src/Coalgebra/StreamCoalgebra.theory';

/** The coalgebra that maps every output of a stream coalgebra by a function, upon the state space of the coalgebra. */
export const mapOutput: Theory.MapOutput = Function.dual(
  2,
  <Output, MappedOutput, State>(
    coalgebra: Theory.StreamCoalgebra<Output, State>,
    f: (output: Output) => MappedOutput,
  ): Theory.StreamCoalgebra<MappedOutput, State> => ({
    structure: (state) => {
      const step = coalgebra.structure(state);
      return { output: f(step.output), next: step.next };
    },
  }),
);

/** The coalgebra that maps every output of a stream coalgebra whose every step is an effect by a function, upon the state space of the coalgebra. */
export const mapOutputEffect: {
  <Output, MappedOutput, State, E, R>(
    coalgebra: Theory.StreamCoalgebra<Output, State, EffectFunctor.EffectFunctor<E, R>>,
    f: (output: Output) => MappedOutput,
  ): Theory.StreamCoalgebra<MappedOutput, State, EffectFunctor.EffectFunctor<E, R>>;
  <Output, MappedOutput>(
    f: (output: Output) => MappedOutput,
  ): <State, E, R>(
    coalgebra: Theory.StreamCoalgebra<Output, State, EffectFunctor.EffectFunctor<E, R>>,
  ) => Theory.StreamCoalgebra<MappedOutput, State, EffectFunctor.EffectFunctor<E, R>>;
} = Function.dual(
  2,
  <Output, MappedOutput, State, E, R>(
    coalgebra: Theory.StreamCoalgebra<Output, State, EffectFunctor.EffectFunctor<E, R>>,
    f: (output: Output) => MappedOutput,
  ): Theory.StreamCoalgebra<MappedOutput, State, EffectFunctor.EffectFunctor<E, R>> => ({
    structure: (state) =>
      Effect.map(coalgebra.structure(state), (step) => ({
        output: f(step.output),
        next: step.next,
      })),
  }),
);

/** The Mealy machine that a stream coalgebra runs as, which takes inputs that carry nothing and gives upon every one of them the step of the coalgebra, upon the state space of the coalgebra. */
export const toMealyMachine = <Output, State, Monad extends HKT.TypeLambda = Functor.Id>(
  coalgebra: Theory.StreamCoalgebra<Output, State, Monad>,
): MealyMachine.MealyMachine<void, Output, State, Monad> => ({
  structure: (state) => () => coalgebra.structure(state),
});

/**
 * Creates a `StreamCoalgebra` whose every step is an effect, from its field `structure`, taking its types from the annotations of the parameters of the field and from the effects it gives.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Corollary 2.3.6.1
 */
export const makeEffect = <Output, State, E, R>(
  fields: Theory.StreamCoalgebra<Output, State, EffectFunctor.EffectFunctor<E, R>>,
) => fields;

/**
 * The steps of a stream coalgebra whose every step is an effect, which gives from every state the stream of the steps that the coalgebra takes from the state on, each an output with the next state, and fails where a step fails.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const stepsEffect = <Output, State, E, R>(
  coalgebra: Theory.StreamCoalgebra<Output, State, EffectFunctor.EffectFunctor<E, R>>,
  state: State,
): Stream.Stream<BinaryProductFunctor.Product<Output, State>, E, R> =>
  Stream.unfold(state, (current) =>
    Effect.map(coalgebra.structure(current), (step) => [step, step.next] as const),
  );

/**
 * The behavior of a stream coalgebra whose every step is an effect, which gives from every state the stream of the outputs that the coalgebra gives from the state on, and fails where a step fails.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const behaviorEffect = <Output, State, E, R>(
  coalgebra: Theory.StreamCoalgebra<Output, State, EffectFunctor.EffectFunctor<E, R>>,
  state: State,
): Stream.Stream<Output, E, R> => Stream.map(stepsEffect(coalgebra, state), (step) => step.output);

/**
 * The steps of a stream coalgebra, which gives from every state the stream of the steps that the coalgebra takes from the state on, each an output with the next state, the behavior of the coalgebra whose output is the whole step.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const steps: Theory.Steps = (coalgebra, state) =>
  stepsEffect(
    makeEffect({ structure: (current) => Effect.succeed(coalgebra.structure(current)) }),
    state,
  );

/**
 * The behavior of a stream coalgebra, which gives from every state the stream of the outputs that the coalgebra gives from the state on.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const behavior: Theory.Behavior = (coalgebra, state) =>
  Stream.map(steps(coalgebra, state), (step) => step.output);
