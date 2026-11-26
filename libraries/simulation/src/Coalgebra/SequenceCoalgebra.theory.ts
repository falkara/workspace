// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.SequenceCoalgebra`, so every change by hand is lost when the generator runs.
import type { HKT, Option, Stream } from 'effect';

import type * as Coalgebra from '#src/Coalgebra.theory';
import type * as Module from '#src/Coalgebra/SequenceCoalgebra';
import type * as Functor from '#src/Functor.theory';
import type * as BinaryProductFunctor from '#src/Functor/BinaryProductFunctor.theory';

/**
 * A sequence coalgebra, which gives from every state either nothing or an output and the next state in a monad.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.1
 */
export interface SequenceCoalgebra<
  in out Output,
  in out State,
  out Monad extends HKT.TypeLambda = Functor.Id,
> extends Coalgebra.Coalgebra<
  Functor.Comp<
    Functor.Comp<BinaryProductFunctor.BinaryProductFunctor<Output>, Option.OptionTypeLambda>,
    Monad
  >,
  State
> {
  /** The coalgebra structure on the state space. */
  readonly structure: (
    state: State,
  ) => HKT.Kind<
    Monad,
    never,
    never,
    never,
    Option.Option<{ readonly output: Output; readonly next: State }>
  >;
}

/**
 * Creates a `SequenceCoalgebra` from its field `structure`, taking its types from the annotations of the parameters of the field or else from the type arguments.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.1
 */
export const make = <Output, State>(fields: SequenceCoalgebra<Output, State>) => fields;

/**
 * The behavior of a sequence coalgebra, which gives from every state the sequence of the outputs that the coalgebra gives from the state on until it gives nothing.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export type Behavior = <Output, State>(
  coalgebra: SequenceCoalgebra<Output, State>,
  state: State,
) => Stream.Stream<Output>;

/**
 * The steps of a sequence coalgebra, which gives from every state the sequence of the steps that the coalgebra takes from the state on until it gives nothing, each an output with the next state, the behavior of the coalgebra whose output is the whole step.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export type Steps = <Output, State>(
  coalgebra: SequenceCoalgebra<Output, State>,
  state: State,
) => Stream.Stream<{ readonly output: Output; readonly next: State }>;

/** The coalgebra that maps every output of a sequence coalgebra by a function, upon the state space of the coalgebra. */
export interface MapOutput {
  <Output, MappedOutput, State>(
    coalgebra: SequenceCoalgebra<Output, State>,
    f: (output: Output) => MappedOutput,
  ): SequenceCoalgebra<MappedOutput, State>;
  <Output, MappedOutput>(
    f: (output: Output) => MappedOutput,
  ): <State>(coalgebra: SequenceCoalgebra<Output, State>) => SequenceCoalgebra<MappedOutput, State>;
}

/** A contract of the functions of the theory that the module `Coalgebra/SequenceCoalgebra` of the package implements. */
interface Contract {
  /**
   * The behavior of a sequence coalgebra, which gives from every state the sequence of the outputs that the coalgebra gives from the state on until it gives nothing.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
   */
  readonly behavior: Behavior;
  /**
   * The steps of a sequence coalgebra, which gives from every state the sequence of the steps that the coalgebra takes from the state on until it gives nothing, each an output with the next state, the behavior of the coalgebra whose output is the whole step.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
   */
  readonly steps: Steps;
  /** The coalgebra that maps every output of a sequence coalgebra by a function, upon the state space of the coalgebra. */
  readonly mapOutput: MapOutput;
}

/** A check of the module `Coalgebra/SequenceCoalgebra` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
