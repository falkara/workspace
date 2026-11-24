// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.SequenceCoalgebra`, so every change by hand is lost when the generator runs.
import type { Option, Stream } from 'effect';

import type * as Coalgebra from '#src/Coalgebra.theory';
import type * as Module from '#src/Coalgebra/SequenceCoalgebra';
import type * as Functor from '#src/Functor.theory';
import type * as BinaryProductFunctor from '#src/Functor/BinaryProductFunctor.theory';

/**
 * A sequence coalgebra, which gives from every state either nothing or an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.1
 */
export interface SequenceCoalgebra<out Output, in out State> extends Coalgebra.Coalgebra<
  Functor.Comp<BinaryProductFunctor.BinaryProductFunctor<Output>, Option.OptionTypeLambda>,
  State
> {}

/**
 * Creates a `SequenceCoalgebra` from its field `structure`.
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

/** A contract of the functions of the theory that the module `Coalgebra/SequenceCoalgebra` of the package implements. */
interface Contract {
  /**
   * The behavior of a sequence coalgebra, which gives from every state the sequence of the outputs that the coalgebra gives from the state on until it gives nothing.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
   */
  readonly behavior: Behavior;
}

/** A check of the module `Coalgebra/SequenceCoalgebra` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
