import * as Theory from '#src/DeterministicAutomaton.theory';

/**
 * A deterministic automaton, which gives from every state an output and the next state upon every input.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export type DeterministicAutomaton<A, B, V> = Theory.DeterministicAutomaton<A, B, V>;

/**
 * Creates a deterministic automaton, which gives from every state an output and the next state upon every input.
 *
 * @see https://doi.org/10.1017/CBO9781316823187
 */
export const deterministicAutomaton = Theory.deterministicAutomaton;
