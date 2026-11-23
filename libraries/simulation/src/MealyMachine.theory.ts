// Written by the generator of the theory from `Falkara.Simulation.MealyMachine`, so every change by hand is lost when the generator runs.

/**
 * A Mealy machine, which gives from every state upon every input an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export interface MealyMachine<in A, out B, in out V> {
  /** structure morphism of the coalgebra */
  readonly str: (value: V) => (value: A) => readonly [B, V];
}

/**
 * Creates a Mealy machine, which gives from every state upon every input an output and the next state.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export const mealyMachine = <A, B, V>(fields: MealyMachine<A, B, V>): MealyMachine<A, B, V> =>
  fields;
