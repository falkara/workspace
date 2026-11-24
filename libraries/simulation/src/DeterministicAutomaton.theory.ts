// Written by the generator of the theory from `Falkara.Simulation.DeterministicAutomaton`, so every change by hand is lost when the generator runs.
/**
 * A deterministic automaton, which gives from every state an output and the next state upon every input.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.3
 */
export interface DeterministicAutomaton<in Input, out Output, in out State> {
  /**
   * The coalgebra structure on the state space.
   *
   * @see https://doi.org/10.1017/CBO9781316823187 Definition 1.4.5
   */
  readonly structure: (state: State) => readonly [Output, (input: Input) => State];
}

/**
 * Creates a `DeterministicAutomaton` from its field `structure`.
 *
 * @see https://doi.org/10.1017/CBO9781316823187 Section 2.2.3
 */
export const deterministicAutomaton = <Input, Output, State>(
  fields: DeterministicAutomaton<Input, Output, State>,
): DeterministicAutomaton<Input, Output, State> => fields;
