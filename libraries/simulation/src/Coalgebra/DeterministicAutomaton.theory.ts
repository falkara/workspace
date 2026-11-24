// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.DeterministicAutomaton`, so every change by hand is lost when the generator runs.
import type { Stream } from 'effect';

import type { Coalgebra } from '#src/Coalgebra.theory';
import type * as Module from '#src/Coalgebra/DeterministicAutomaton';
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

/**
 * The behavior of a deterministic automaton, which gives from every state upon a stream of inputs the stream of the outputs of the state and of every state that the inputs lead to one after another.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export type DeterministicAutomatonBehavior = <Input, Output, State>(
  automaton: DeterministicAutomaton<Input, Output, State>,
  state: State,
  inputs: Stream.Stream<Input>,
) => Stream.Stream<Output>;

/** A contract of the functions of the theory that the module `Coalgebra/DeterministicAutomaton` of the package implements. */
interface Contract {
  /**
   * The behavior of a deterministic automaton, which gives from every state upon a stream of inputs the stream of the outputs of the state and of every state that the inputs lead to one after another.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
   */
  readonly deterministicAutomatonBehavior: DeterministicAutomatonBehavior;
}

/** A check of the module `Coalgebra/DeterministicAutomaton` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
