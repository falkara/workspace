// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.MealyMachine`, so every change by hand is lost when the generator runs.
import type { Stream } from 'effect';

import type { Coalgebra } from '#src/Coalgebra.theory';
import type * as Module from '#src/Coalgebra/MealyMachine';
import type { FunctorComp } from '#src/Functor.theory';
import type { BinaryProductFunctor } from '#src/Functor/BinaryProductFunctor.theory';
import type { Coyoneda } from '#src/Functor/Coyoneda.theory';

/**
 * A Mealy machine, which gives from every state upon every input an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Exercise 2.3.2
 */
export interface MealyMachine<in Input, out Output, in out State> extends Coalgebra<
  FunctorComp<BinaryProductFunctor<Output>, Coyoneda<Input>>,
  State
> {}

/**
 * Creates a `MealyMachine` from its field `structure`.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Exercise 2.3.2
 */
export const mealyMachine = <Input, Output, State>(fields: MealyMachine<Input, Output, State>) =>
  fields;

/**
 * The behavior of a Mealy machine, which gives from every state upon a stream of inputs the stream of the outputs that the machine gives upon the inputs one after another.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
 */
export type MealyMachineBehavior = <Input, Output, State>(
  machine: MealyMachine<Input, Output, State>,
  state: State,
  inputs: Stream.Stream<Input>,
) => Stream.Stream<Output>;

/** A contract of the functions of the theory that the module `Coalgebra/MealyMachine` of the package implements. */
interface Contract {
  /**
   * The behavior of a Mealy machine, which gives from every state upon a stream of inputs the stream of the outputs that the machine gives upon the inputs one after another.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 2.3.1
   */
  readonly mealyMachineBehavior: MealyMachineBehavior;
}

/** A check of the module `Coalgebra/MealyMachine` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
