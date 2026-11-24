// Written by the generator of the theory from `Falkara.Simulation.MealyMachine`, so every change by hand is lost when the generator runs.
/**
 * A Mealy machine, which gives from every state upon every input an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Exercise 2.3.2
 */
export interface MealyMachine<in Input, out Output, in out State> {
  /**
   * The coalgebra structure on the state space.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 1.4.5
   */
  readonly structure: (state: State) => (input: Input) => readonly [Output, State];
}

/**
 * Creates a `MealyMachine` from its field `structure`.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Exercise 2.3.2
 */
export const mealyMachine = <Input, Output, State>(
  fields: MealyMachine<Input, Output, State>,
): MealyMachine<Input, Output, State> => fields;
