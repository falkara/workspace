import { Effect, Function, Option, Stream } from 'effect';

import type * as Theory from '#src/Coalgebra/SequenceCoalgebra.theory';
import type * as BinaryProductFunctor from '#src/Functor/BinaryProductFunctor';
import type * as EffectFunctor from '#src/Functor/EffectFunctor';

export { make, type SequenceCoalgebra } from '#src/Coalgebra/SequenceCoalgebra.theory';

/** The coalgebra that maps every output of a sequence coalgebra by a function, upon the state space of the coalgebra. */
export const mapOutput: Theory.MapOutput = Function.dual(
  2,
  <Output, MappedOutput, State>(
    coalgebra: Theory.SequenceCoalgebra<Output, State>,
    f: (output: Output) => MappedOutput,
  ): Theory.SequenceCoalgebra<MappedOutput, State> => ({
    structure: (state) =>
      Option.map(coalgebra.structure(state), (step) => ({
        output: f(step.output),
        next: step.next,
      })),
  }),
);

/** The coalgebra that maps every output of a sequence coalgebra whose every step is an effect by a function, upon the state space of the coalgebra. */
export const mapOutputEffect: {
  <Output, MappedOutput, State, E, R>(
    coalgebra: Theory.SequenceCoalgebra<Output, State, EffectFunctor.EffectFunctor<E, R>>,
    f: (output: Output) => MappedOutput,
  ): Theory.SequenceCoalgebra<MappedOutput, State, EffectFunctor.EffectFunctor<E, R>>;
  <Output, MappedOutput>(
    f: (output: Output) => MappedOutput,
  ): <State, E, R>(
    coalgebra: Theory.SequenceCoalgebra<Output, State, EffectFunctor.EffectFunctor<E, R>>,
  ) => Theory.SequenceCoalgebra<MappedOutput, State, EffectFunctor.EffectFunctor<E, R>>;
} = Function.dual(
  2,
  <Output, MappedOutput, State, E, R>(
    coalgebra: Theory.SequenceCoalgebra<Output, State, EffectFunctor.EffectFunctor<E, R>>,
    f: (output: Output) => MappedOutput,
  ): Theory.SequenceCoalgebra<MappedOutput, State, EffectFunctor.EffectFunctor<E, R>> => ({
    structure: (state) =>
      Effect.map(coalgebra.structure(state), (step) =>
        Option.map(step, (some) => ({ output: f(some.output), next: some.next })),
      ),
  }),
);

/**
 * Creates a `SequenceCoalgebra` whose every step is an effect, from its field `structure`, taking its types from the annotations of the parameters of the field and from the effects it gives.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.1
 */
export const makeEffect = <Output, State, E, R>(
  fields: Theory.SequenceCoalgebra<Output, State, EffectFunctor.EffectFunctor<E, R>>,
) => fields;

/**
 * The steps of a sequence coalgebra whose every step is an effect, which gives from every state the sequence of the steps that the coalgebra takes from the state on until it gives nothing, each an output with the next state, and fails where a step fails.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const stepsEffect = <Output, State, E, R>(
  coalgebra: Theory.SequenceCoalgebra<Output, State, EffectFunctor.EffectFunctor<E, R>>,
  state: State,
): Stream.Stream<BinaryProductFunctor.Product<Output, State>, E, R> =>
  Stream.unfold(state, (current) =>
    Effect.map(coalgebra.structure(current), (step) =>
      Option.getOrUndefined(Option.map(step, (some) => [some, some.next] as const)),
    ),
  );

/**
 * The behavior of a sequence coalgebra whose every step is an effect, which gives from every state the sequence of the outputs that the coalgebra gives from the state on until it gives nothing, and fails where a step fails.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const behaviorEffect = <Output, State, E, R>(
  coalgebra: Theory.SequenceCoalgebra<Output, State, EffectFunctor.EffectFunctor<E, R>>,
  state: State,
): Stream.Stream<Output, E, R> => Stream.map(stepsEffect(coalgebra, state), (step) => step.output);

/**
 * The steps of a sequence coalgebra, which gives from every state the sequence of the steps that the coalgebra takes from the state on until it gives nothing, each an output with the next state, the behavior of the coalgebra whose output is the whole step.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const steps: Theory.Steps = (coalgebra, state) =>
  stepsEffect(
    makeEffect({ structure: (current) => Effect.succeed(coalgebra.structure(current)) }),
    state,
  );

/**
 * The behavior of a sequence coalgebra, which gives from every state the sequence of the outputs that the coalgebra gives from the state on until it gives nothing.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const behavior: Theory.Behavior = (coalgebra, state) =>
  Stream.map(steps(coalgebra, state), (step) => step.output);
