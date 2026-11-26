// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.ResumptionCoalgebra`, so every change by hand is lost when the generator runs.
import type { HKT, Result, Stream } from 'effect';

import type * as Coalgebra from '#src/Coalgebra.theory';
import type * as Module from '#src/Coalgebra/ResumptionCoalgebra';
import type * as SequenceCoalgebra from '#src/Coalgebra/SequenceCoalgebra.theory';
import type * as Functor from '#src/Functor.theory';
import type * as BinaryCoproductFunctor from '#src/Functor/BinaryCoproductFunctor.theory';
import type * as BinaryProductFunctor from '#src/Functor/BinaryProductFunctor.theory';

/**
 * A resumption coalgebra, which gives from every state either a result or an output and the next state in a monad.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.1
 */
export interface ResumptionCoalgebra<
  in out Output,
  in out Done,
  in out State,
  out Monad extends HKT.TypeLambda = Functor.Id,
> extends Coalgebra.Coalgebra<
  Functor.Comp<
    Functor.Comp<
      BinaryProductFunctor.BinaryProductFunctor<Output>,
      BinaryCoproductFunctor.BinaryCoproductFunctor<Done>
    >,
    Monad
  >,
  State
> {
  /** The function that gives the next step of the system from a state. */
  readonly structure: (
    state: State,
  ) => HKT.Kind<
    Monad,
    never,
    never,
    never,
    Result.Result<{ readonly output: Output; readonly next: State }, Done>
  >;
}

/**
 * Creates a resumption coalgebra from the function that gives from every state either a result or an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.1
 */
export const make = <Output, Done, State>(fields: ResumptionCoalgebra<Output, Done, State>) =>
  fields;

/** The sequence coalgebra that a resumption coalgebra runs as without its result, which gives nothing where the resumption coalgebra gives a result, upon the state space of the coalgebra. */
export type ToSequenceCoalgebra = <Output, Done, State>(
  coalgebra: ResumptionCoalgebra<Output, Done, State>,
) => SequenceCoalgebra.SequenceCoalgebra<Output, State>;

/**
 * The behavior of a resumption coalgebra, which gives from every state the sequence of the outputs that the coalgebra gives from the state on until it gives a result.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export type Behavior = <Output, Done, State>(
  coalgebra: ResumptionCoalgebra<Output, Done, State>,
  state: State,
) => Stream.Stream<Output>;

/**
 * The steps of a resumption coalgebra, which gives from every state the sequence of the steps that the coalgebra takes from the state on until it gives a result, each an output with the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export type Steps = <Output, Done, State>(
  coalgebra: ResumptionCoalgebra<Output, Done, State>,
  state: State,
) => Stream.Stream<{ readonly output: Output; readonly next: State }>;

/** A contract of the functions of the theory that the module `Coalgebra/ResumptionCoalgebra` of the package implements. */
interface Contract {
  /** The sequence coalgebra that a resumption coalgebra runs as without its result, which gives nothing where the resumption coalgebra gives a result, upon the state space of the coalgebra. */
  readonly toSequenceCoalgebra: ToSequenceCoalgebra;
  /**
   * The behavior of a resumption coalgebra, which gives from every state the sequence of the outputs that the coalgebra gives from the state on until it gives a result.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
   */
  readonly behavior: Behavior;
  /**
   * The steps of a resumption coalgebra, which gives from every state the sequence of the steps that the coalgebra takes from the state on until it gives a result, each an output with the next state.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
   */
  readonly steps: Steps;
}

/** A check of the module `Coalgebra/ResumptionCoalgebra` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
