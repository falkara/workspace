import { Array, Cause, Channel, Effect, Result, type Stream } from 'effect';

import type * as Theory from '#src/Coalgebra/ResumptionCoalgebra.theory';
import * as SequenceCoalgebra from '#src/Coalgebra/SequenceCoalgebra';
import type * as BinaryProductFunctor from '#src/Functor/BinaryProductFunctor';
import type * as EffectFunctor from '#src/Functor/EffectFunctor';

export { make, type ResumptionCoalgebra } from '#src/Coalgebra/ResumptionCoalgebra.theory';

/**
 * Creates a `ResumptionCoalgebra` whose every step is an effect, from its field `structure`, taking its types from the annotations of the parameters of the field and from the effects it gives.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.2
 */
export const makeEffect = <Output, Done, State, E, R>(
  fields: Theory.ResumptionCoalgebra<Output, Done, State, EffectFunctor.EffectFunctor<E, R>>,
) => fields;

/** The sequence coalgebra that a resumption coalgebra runs as without its result, which gives nothing where the resumption coalgebra gives a result, upon the state space of the coalgebra. */
export const toSequenceCoalgebra: Theory.ToSequenceCoalgebra = (coalgebra) => ({
  structure: (state) => Result.getSuccess(coalgebra.structure(state)),
});

/** The sequence coalgebra that a resumption coalgebra whose every step is an effect runs as without its result, which gives nothing where the resumption coalgebra gives a result, upon the state space of the coalgebra. */
export const toSequenceCoalgebraEffect = <Output, Done, State, E, R>(
  coalgebra: Theory.ResumptionCoalgebra<Output, Done, State, EffectFunctor.EffectFunctor<E, R>>,
): SequenceCoalgebra.SequenceCoalgebra<Output, State, EffectFunctor.EffectFunctor<E, R>> => ({
  structure: (state) => Effect.map(coalgebra.structure(state), Result.getSuccess),
});

/**
 * The channel of a resumption coalgebra whose every step is an effect, which emits from every state the outputs that the coalgebra gives from the state on, ends with the result that the coalgebra gives at last, and fails where a step fails.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const channelEffect = <Output, Done, State, E, R>(
  coalgebra: Theory.ResumptionCoalgebra<Output, Done, State, EffectFunctor.EffectFunctor<E, R>>,
  state: State,
): Channel.Channel<Array.NonEmptyReadonlyArray<Output>, E, Done, unknown, unknown, unknown, R> =>
  Channel.fromPull(
    Effect.sync(() => {
      // The pull keeps the state that the last step leads to, as every pull takes one step.
      let current = state;
      return Effect.flatMap(
        Effect.suspend(() => coalgebra.structure(current)),
        Result.match({
          onFailure: (done) => Cause.done(done),
          onSuccess: (step) => {
            current = step.next;
            return Effect.succeed(Array.of(step.output));
          },
        }),
      );
    }),
  );

/**
 * The channel of a resumption coalgebra, which emits from every state the outputs that the coalgebra gives from the state on and ends with the result that the coalgebra gives at last.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const channel = <Output, Done, State>(
  coalgebra: Theory.ResumptionCoalgebra<Output, Done, State>,
  state: State,
): Channel.Channel<Array.NonEmptyReadonlyArray<Output>, never, Done> =>
  channelEffect(
    makeEffect({ structure: (current: State) => Effect.succeed(coalgebra.structure(current)) }),
    state,
  );

/**
 * The steps of a resumption coalgebra whose every step is an effect, which gives from every state the sequence of the steps that the coalgebra takes from the state on until it gives a result, each an output with the next state, and fails where a step fails.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const stepsEffect = <Output, Done, State, E, R>(
  coalgebra: Theory.ResumptionCoalgebra<Output, Done, State, EffectFunctor.EffectFunctor<E, R>>,
  state: State,
): Stream.Stream<BinaryProductFunctor.Product<Output, State>, E, R> =>
  SequenceCoalgebra.stepsEffect(toSequenceCoalgebraEffect(coalgebra), state);

/**
 * The behavior of a resumption coalgebra whose every step is an effect, which gives from every state the sequence of the outputs that the coalgebra gives from the state on until it gives a result, and fails where a step fails.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const behaviorEffect = <Output, Done, State, E, R>(
  coalgebra: Theory.ResumptionCoalgebra<Output, Done, State, EffectFunctor.EffectFunctor<E, R>>,
  state: State,
): Stream.Stream<Output, E, R> =>
  SequenceCoalgebra.behaviorEffect(toSequenceCoalgebraEffect(coalgebra), state);

/**
 * The steps of a resumption coalgebra, which gives from every state the sequence of the steps that the coalgebra takes from the state on until it gives a result, each an output with the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const steps: Theory.Steps = (coalgebra, state) =>
  SequenceCoalgebra.steps(toSequenceCoalgebra(coalgebra), state);

/**
 * The behavior of a resumption coalgebra, which gives from every state the sequence of the outputs that the coalgebra gives from the state on until it gives a result.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export const behavior: Theory.Behavior = (coalgebra, state) =>
  SequenceCoalgebra.behavior(toSequenceCoalgebra(coalgebra), state);
