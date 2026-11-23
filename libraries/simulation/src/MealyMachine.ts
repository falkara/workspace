import * as Theory from '#src/MealyMachine.theory';

/**
 * A Mealy machine, which gives from every state upon every input an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export type MealyMachine<A, B, V> = Theory.MealyMachine<A, B, V>;

/**
 * Creates a Mealy machine, which gives from every state upon every input an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export const mealyMachine = Theory.mealyMachine;
