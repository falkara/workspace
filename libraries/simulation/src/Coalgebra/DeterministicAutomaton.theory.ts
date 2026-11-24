// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.DeterministicAutomaton`, so every change by hand is lost when the generator runs.
import type { Coalgebra } from '#src/Coalgebra.theory';
import type { FunctorComp } from '#src/Functor.theory';
import type { BinaryProductFunctor } from '#src/Functor/BinaryProductFunctor.theory';
import type { Coyoneda } from '#src/Functor/Coyoneda.theory';

/**
 * A deterministic automaton, which gives from every state an output and the next state upon every input.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.3
 */
export interface DeterministicAutomaton<in Input, out Output, in out State> extends Coalgebra<
  FunctorComp<Coyoneda<Input>, BinaryProductFunctor<Output>>,
  State
> {}

/**
 * Creates a `DeterministicAutomaton` from its field `structure`.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.3
 */
export const deterministicAutomaton = <Input, Output, State>(
  fields: DeterministicAutomaton<Input, Output, State>,
) => fields;
