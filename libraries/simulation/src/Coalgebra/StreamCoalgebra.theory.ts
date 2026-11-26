// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.StreamCoalgebra`, so every change by hand is lost when the generator runs.
import type { HKT, Stream } from 'effect';

import type * as Coalgebra from '#src/Coalgebra.theory';
import type * as MealyMachine from '#src/Coalgebra/MealyMachine.theory';
import type * as Module from '#src/Coalgebra/StreamCoalgebra';
import type * as Functor from '#src/Functor.theory';
import type * as BinaryProductFunctor from '#src/Functor/BinaryProductFunctor.theory';

/**
 * A stream coalgebra, which gives from every state an output and the next state in a monad.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Corollary 2.3.6.1
 */
export interface StreamCoalgebra<
  in out Output,
  in out State,
  out Monad extends HKT.TypeLambda = Functor.Id,
> extends Coalgebra.Coalgebra<
  Functor.Comp<BinaryProductFunctor.BinaryProductFunctor<Output>, Monad>,
  State
> {
  /** The function that gives the next step of the system from a state. */
  readonly structure: (
    state: State,
  ) => HKT.Kind<Monad, never, never, never, { readonly output: Output; readonly next: State }>;
}

/**
 * Creates a `StreamCoalgebra` from its field `structure`, taking its types from the annotations of the parameters of the field or else from the type arguments.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Corollary 2.3.6.1
 */
export const make = <Output, State>(fields: StreamCoalgebra<Output, State>) => fields;

/**
 * The behavior of a stream coalgebra, which gives from every state the stream of the outputs that the coalgebra gives from the state on.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export type Behavior = <Output, State>(
  coalgebra: StreamCoalgebra<Output, State>,
  state: State,
) => Stream.Stream<Output>;

/**
 * The steps of a stream coalgebra, which gives from every state the stream of the steps that the coalgebra takes from the state on, each an output with the next state, the behavior of the coalgebra whose output is the whole step.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export type Steps = <Output, State>(
  coalgebra: StreamCoalgebra<Output, State>,
  state: State,
) => Stream.Stream<{ readonly output: Output; readonly next: State }>;

/** The coalgebra that maps every output of a stream coalgebra by a function, upon the state space of the coalgebra. */
export interface MapOutput {
  <Output, MappedOutput, State>(
    coalgebra: StreamCoalgebra<Output, State>,
    f: (output: Output) => MappedOutput,
  ): StreamCoalgebra<MappedOutput, State>;
  <Output, MappedOutput>(
    f: (output: Output) => MappedOutput,
  ): <State>(coalgebra: StreamCoalgebra<Output, State>) => StreamCoalgebra<MappedOutput, State>;
}

/** The Mealy machine that a stream coalgebra runs as, which takes inputs that carry nothing and gives upon every one of them the step of the coalgebra, upon the state space of the coalgebra. */
export type ToMealyMachine = <Output, State>(
  coalgebra: StreamCoalgebra<Output, State>,
) => MealyMachine.MealyMachine<void, Output, State>;

/** A contract of the functions of the theory that the module `Coalgebra/StreamCoalgebra` of the package implements. */
interface Contract {
  /**
   * The behavior of a stream coalgebra, which gives from every state the stream of the outputs that the coalgebra gives from the state on.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
   */
  readonly behavior: Behavior;
  /**
   * The steps of a stream coalgebra, which gives from every state the stream of the steps that the coalgebra takes from the state on, each an output with the next state, the behavior of the coalgebra whose output is the whole step.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
   */
  readonly steps: Steps;
  /** The coalgebra that maps every output of a stream coalgebra by a function, upon the state space of the coalgebra. */
  readonly mapOutput: MapOutput;
  /** The Mealy machine that a stream coalgebra runs as, which takes inputs that carry nothing and gives upon every one of them the step of the coalgebra, upon the state space of the coalgebra. */
  readonly toMealyMachine: ToMealyMachine;
}

/** A check of the module `Coalgebra/StreamCoalgebra` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
