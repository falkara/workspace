// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.StreamCoalgebra`, so every change by hand is lost when the generator runs.
import type { Stream } from 'effect';

import type { Coalgebra } from '#src/Coalgebra.theory';
import type * as Module from '#src/Coalgebra/StreamCoalgebra';
import type { BinaryProductFunctor } from '#src/Functor/BinaryProductFunctor.theory';

/**
 * A stream coalgebra, which gives from every state an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Corollary 2.3.6.1
 */
export interface StreamCoalgebra<out Output, in out State> extends Coalgebra<
  BinaryProductFunctor<Output>,
  State
> {}

/**
 * Creates a `StreamCoalgebra` from its field `structure`.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Corollary 2.3.6.1
 */
export const streamCoalgebra = <Output, State>(fields: StreamCoalgebra<Output, State>) => fields;

/**
 * The behavior of a stream coalgebra, which gives from every state the stream of the outputs that the coalgebra gives from the state on.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export type StreamCoalgebraBehavior = <Output, State>(
  coalgebra: StreamCoalgebra<Output, State>,
  state: State,
) => Stream.Stream<Output>;

/** A contract of the functions of the theory that the module `Coalgebra/StreamCoalgebra` of the package implements. */
interface Contract {
  /**
   * The behavior of a stream coalgebra, which gives from every state the stream of the outputs that the coalgebra gives from the state on.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
   */
  readonly streamCoalgebraBehavior: StreamCoalgebraBehavior;
}

/** A check of the module `Coalgebra/StreamCoalgebra` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
