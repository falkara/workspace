// Written by the generator of the theory from `Falkara.Simulation.DeterministicAutomaton`, so every change by hand is lost when the generator runs.

/**
 * A deterministic automaton, which gives from every state an output and the next state upon every input.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export interface DeterministicAutomaton<in A, out B, in out V> {
  /** structure morphism of the coalgebra */
  readonly str: (value: V) => readonly [B, (value: A) => V];
}

/**
 * Creates a deterministic automaton, which gives from every state an output and the next state upon every input.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export const deterministicAutomaton = <A, B, V>(
  fields: DeterministicAutomaton<A, B, V>,
): DeterministicAutomaton<A, B, V> => fields;
