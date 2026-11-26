// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.DeterministicAutomaton`, so every change by hand is lost when the generator runs.
import type { HKT, Stream } from 'effect';

import type * as Coalgebra from '#src/Coalgebra.theory';
import type * as Module from '#src/Coalgebra/DeterministicAutomaton';
import type * as MealyMachine from '#src/Coalgebra/MealyMachine.theory';
import type * as Functor from '#src/Functor.theory';
import type * as BinaryProductFunctor from '#src/Functor/BinaryProductFunctor.theory';
import type * as ExponentFunctor from '#src/Functor/ExponentFunctor.theory';

/**
 * A deterministic automaton, which gives from every state an output and the next state upon every input in a monad.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.3
 */
export interface DeterministicAutomaton<
  in Input,
  out Output,
  in out State,
  out Monad extends HKT.TypeLambda = Functor.Id,
> extends Coalgebra.Coalgebra<
  Functor.Comp<
    Functor.Comp<Monad, ExponentFunctor.ExponentFunctor<Input>>,
    BinaryProductFunctor.BinaryProductFunctor<Output>
  >,
  State
> {
  /** The coalgebra structure on the state space. */
  readonly structure: (state: State) => {
    readonly output: Output;
    readonly next: (input: Input) => HKT.Kind<Monad, never, never, never, State>;
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

/** The automaton that maps every output of a deterministic automaton by a function, upon the state space of the automaton. */
export interface MapOutput {
  <Input, Output, MappedOutput, State>(
    automaton: DeterministicAutomaton<Input, Output, State>,
    f: (output: Output) => MappedOutput,
  ): DeterministicAutomaton<Input, MappedOutput, State>;
  <Output, MappedOutput>(
    f: (output: Output) => MappedOutput,
  ): <Input, State>(
    automaton: DeterministicAutomaton<Input, Output, State>,
  ) => DeterministicAutomaton<Input, MappedOutput, State>;
}

/** The automaton that maps every input by a function before a deterministic automaton takes it, upon the state space of the automaton. */
export interface MapInput {
  <Input, MappedInput, Output, State>(
    automaton: DeterministicAutomaton<Input, Output, State>,
    f: (input: MappedInput) => Input,
  ): DeterministicAutomaton<MappedInput, Output, State>;
  <Input, MappedInput>(
    f: (input: MappedInput) => Input,
  ): <Output, State>(
    automaton: DeterministicAutomaton<Input, Output, State>,
  ) => DeterministicAutomaton<MappedInput, Output, State>;
}

/** The Mealy machine that a deterministic automaton runs as, which gives upon every input the output of the state and the state that the input leads to, upon the state space of the automaton. */
export type ToMealyMachine = <Input, Output, State>(
  automaton: DeterministicAutomaton<Input, Output, State>,
) => MealyMachine.MealyMachine<Input, Output, State>;

/** A contract of the functions of the theory that the module `Coalgebra/DeterministicAutomaton` of the package implements. */
interface Contract {
  /**
   * The behavior of a deterministic automaton, which gives from every state upon a stream of inputs the stream of the outputs of the state and of every state that the inputs lead to one after another.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
   */
  readonly behavior: Behavior;
  /** The automaton that maps every output of a deterministic automaton by a function, upon the state space of the automaton. */
  readonly mapOutput: MapOutput;
  /** The automaton that maps every input by a function before a deterministic automaton takes it, upon the state space of the automaton. */
  readonly mapInput: MapInput;
  /** The Mealy machine that a deterministic automaton runs as, which gives upon every input the output of the state and the state that the input leads to, upon the state space of the automaton. */
  readonly toMealyMachine: ToMealyMachine;
}

/** A check of the module `Coalgebra/DeterministicAutomaton` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
