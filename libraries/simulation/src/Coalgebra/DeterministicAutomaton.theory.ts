// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.DeterministicAutomaton`, so every change by hand is lost when the generator runs.
import type { Stream } from 'effect';

import type * as Coalgebra from '#src/Coalgebra.theory';
import type * as Module from '#src/Coalgebra/DeterministicAutomaton';
import type * as Functor from '#src/Functor.theory';
import type * as BinaryProductFunctor from '#src/Functor/BinaryProductFunctor.theory';
import type * as ExponentFunctor from '#src/Functor/ExponentFunctor.theory';

/**
 * A deterministic automaton, which gives from every state an output and the next state upon every input.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.3
 */
export interface DeterministicAutomaton<
  in Input,
  out Output,
  in out State,
> extends Coalgebra.Coalgebra<
  Functor.Comp<
    ExponentFunctor.ExponentFunctor<Input>,
    BinaryProductFunctor.BinaryProductFunctor<Output>
  >,
  State
> {
  /**
   * The coalgebra structure on the state space.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 1.4.5
   */
  readonly structure: (state: State) => {
    readonly output: Output;
    readonly next: (input: Input) => State;
  };
}

/**
 * Creates a `DeterministicAutomaton` from its field `structure`, taking its types from the annotations of the parameters of the field or else from the type arguments.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.3
 */
export const make = <Input, Output, State>(fields: DeterministicAutomaton<Input, Output, State>) =>
  fields;

/**
 * The behavior of a deterministic automaton, which gives from every state upon a stream of inputs the stream of the outputs of the state and of every state that the inputs lead to one after another.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export interface Behavior {
  <Input, Output, State, E = never, R = never>(
    automaton: DeterministicAutomaton<Input, Output, State>,
    state: State,
    inputs: Stream.Stream<Input, E, R>,
  ): Stream.Stream<Output, E, R>;
  <Input, Output, State>(
    automaton: DeterministicAutomaton<Input, Output, State>,
    state: State,
  ): <E = never, R = never>(inputs: Stream.Stream<Input, E, R>) => Stream.Stream<Output, E, R>;
}

/** A contract of the functions of the theory that the module `Coalgebra/DeterministicAutomaton` of the package implements. */
interface Contract {
  /**
   * The behavior of a deterministic automaton, which gives from every state upon a stream of inputs the stream of the outputs of the state and of every state that the inputs lead to one after another.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
   */
  readonly behavior: Behavior;
}

/** A check of the module `Coalgebra/DeterministicAutomaton` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
