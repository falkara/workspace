// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.MealyMachine`, so every change by hand is lost when the generator runs.
import type { HKT, Stream } from 'effect';

import type * as Coalgebra from '#src/Coalgebra.theory';
import type * as Module from '#src/Coalgebra/MealyMachine';
import type * as Functor from '#src/Functor.theory';
import type * as BinaryProductFunctor from '#src/Functor/BinaryProductFunctor.theory';
import type * as ExponentFunctor from '#src/Functor/ExponentFunctor.theory';

/**
 * A Mealy machine, which gives from every state upon every input an output and the next state in a monad.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Exercise 2.3.2
 */
export interface MealyMachine<
  in Input,
  in out Output,
  in out State,
  out Monad extends HKT.TypeLambda = Functor.Id,
> extends Coalgebra.Coalgebra<
  Functor.Comp<
    Functor.Comp<BinaryProductFunctor.BinaryProductFunctor<Output>, Monad>,
    ExponentFunctor.ExponentFunctor<Input>
  >,
  State
> {
  /** The function that gives the next step of the system from a state. */
  readonly structure: (
    state: State,
  ) => (
    input: Input,
  ) => HKT.Kind<Monad, never, never, never, { readonly output: Output; readonly next: State }>;
}

/**
 * Creates a `MealyMachine` from its field `structure`, taking its types from the annotations of the parameters of the field or else from the type arguments.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Exercise 2.3.2
 */
export const make = <Input, Output, State>(fields: MealyMachine<Input, Output, State>) => fields;

/**
 * The behavior of a Mealy machine, which gives from every state upon a stream of inputs the stream of the outputs that the machine gives upon the inputs one after another.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export interface Behavior {
  <Input, Output, State, E = never, R = never>(
    machine: MealyMachine<Input, Output, State>,
    state: State,
    inputs: Stream.Stream<Input, E, R>,
  ): Stream.Stream<Output, E, R>;
  <Input, Output, State>(
    machine: MealyMachine<Input, Output, State>,
    state: State,
  ): <E = never, R = never>(inputs: Stream.Stream<Input, E, R>) => Stream.Stream<Output, E, R>;
}

/**
 * The steps of a Mealy machine, which gives from every state upon a stream of inputs the stream of the steps that the machine takes upon the inputs one after another, each an output with the next state, the behavior of the machine whose output is the whole step.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export interface Steps {
  <Input, Output, State, E = never, R = never>(
    machine: MealyMachine<Input, Output, State>,
    state: State,
    inputs: Stream.Stream<Input, E, R>,
  ): Stream.Stream<{ readonly output: Output; readonly next: State }, E, R>;
  <Input, Output, State>(
    machine: MealyMachine<Input, Output, State>,
    state: State,
  ): <E = never, R = never>(
    inputs: Stream.Stream<Input, E, R>,
  ) => Stream.Stream<{ readonly output: Output; readonly next: State }, E, R>;
}

/** The machine that maps every output of a Mealy machine by a function, upon the state space of the machine. */
export interface MapOutput {
  <Input, Output, MappedOutput, State>(
    machine: MealyMachine<Input, Output, State>,
    f: (output: Output) => MappedOutput,
  ): MealyMachine<Input, MappedOutput, State>;
  <Output, MappedOutput>(
    f: (output: Output) => MappedOutput,
  ): <Input, State>(
    machine: MealyMachine<Input, Output, State>,
  ) => MealyMachine<Input, MappedOutput, State>;
}

/** The machine that maps every input by a function before a Mealy machine takes it, upon the state space of the machine. */
export interface MapInput {
  <Input, MappedInput, Output, State>(
    machine: MealyMachine<Input, Output, State>,
    f: (input: MappedInput) => Input,
  ): MealyMachine<MappedInput, Output, State>;
  <Input, MappedInput>(
    f: (input: MappedInput) => Input,
  ): <Output, State>(
    machine: MealyMachine<Input, Output, State>,
  ) => MealyMachine<MappedInput, Output, State>;
}

/** The machine that feeds every output of a Mealy machine into another as its input, upon the pairs of the states of the two machines. */
export interface Series {
  <Input, Middle, Output, FirstState, SecondState>(
    first: MealyMachine<Input, Middle, FirstState>,
    second: MealyMachine<Middle, Output, SecondState>,
  ): MealyMachine<Input, Output, readonly [FirstState, SecondState]>;
  <Middle, Output, SecondState>(
    second: MealyMachine<Middle, Output, SecondState>,
  ): <Input, FirstState>(
    first: MealyMachine<Input, Middle, FirstState>,
  ) => MealyMachine<Input, Output, readonly [FirstState, SecondState]>;
}

/** The machine that runs two Mealy machines side by side, each upon its part of every input, upon the pairs of the states of the two machines. */
export interface Parallel {
  <FirstInput, FirstOutput, SecondInput, SecondOutput, FirstState, SecondState>(
    first: MealyMachine<FirstInput, FirstOutput, FirstState>,
    second: MealyMachine<SecondInput, SecondOutput, SecondState>,
  ): MealyMachine<
    readonly [FirstInput, SecondInput],
    readonly [FirstOutput, SecondOutput],
    readonly [FirstState, SecondState]
  >;
  <SecondInput, SecondOutput, SecondState>(
    second: MealyMachine<SecondInput, SecondOutput, SecondState>,
  ): <FirstInput, FirstOutput, FirstState>(
    first: MealyMachine<FirstInput, FirstOutput, FirstState>,
  ) => MealyMachine<
    readonly [FirstInput, SecondInput],
    readonly [FirstOutput, SecondOutput],
    readonly [FirstState, SecondState]
  >;
}

/** A contract of the functions of the theory that the module `Coalgebra/MealyMachine` of the package implements. */
interface Contract {
  /**
   * The behavior of a Mealy machine, which gives from every state upon a stream of inputs the stream of the outputs that the machine gives upon the inputs one after another.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
   */
  readonly behavior: Behavior;
  /**
   * The steps of a Mealy machine, which gives from every state upon a stream of inputs the stream of the steps that the machine takes upon the inputs one after another, each an output with the next state, the behavior of the machine whose output is the whole step.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
   */
  readonly steps: Steps;
  /** The machine that maps every output of a Mealy machine by a function, upon the state space of the machine. */
  readonly mapOutput: MapOutput;
  /** The machine that maps every input by a function before a Mealy machine takes it, upon the state space of the machine. */
  readonly mapInput: MapInput;
  /** The machine that feeds every output of a Mealy machine into another as its input, upon the pairs of the states of the two machines. */
  readonly series: Series;
  /** The machine that runs two Mealy machines side by side, each upon its part of every input, upon the pairs of the states of the two machines. */
  readonly parallel: Parallel;
}

/** A check of the module `Coalgebra/MealyMachine` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
