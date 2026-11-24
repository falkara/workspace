// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.StreamCoalgebra`, so every change by hand is lost when the generator runs.
import type { Coalgebra } from '#src/Coalgebra.theory';
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
