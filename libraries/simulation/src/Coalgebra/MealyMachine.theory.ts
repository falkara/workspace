// Written by the generator of the theory from `Falkara.Simulation.Coalgebra.MealyMachine`, so every change by hand is lost when the generator runs.
import type { Coalgebra } from '#src/Coalgebra.theory';
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
