// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.SequenceCoalgebra`, so every change by hand is lost when the generator runs.
import type { Option } from 'effect';

import type { Coalgebra } from '#src/Coalgebra.theory';
import type { FunctorComp } from '#src/Functor.theory';
import type { BinaryProductFunctor } from '#src/Functor/BinaryProductFunctor.theory';

/**
 * A sequence coalgebra, which gives from every state either nothing or an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.1
 */
export interface SequenceCoalgebra<out Output, in out State> extends Coalgebra<
  FunctorComp<BinaryProductFunctor<Output>, Option.OptionTypeLambda>,
  State
> {}

/**
 * Creates a `SequenceCoalgebra` from its field `structure`.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.1
 */
export const sequenceCoalgebra = <Output, State>(fields: SequenceCoalgebra<Output, State>) =>
  fields;
