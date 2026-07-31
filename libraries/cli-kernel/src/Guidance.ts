import { Console } from 'effect';

/**
 * A failure that carries what the user has to change.
 *
 * The property a failure needs to be reportable as a mistake rather than as a
 * crash, so that the wording lives with the condition that raised it and the
 * rendering stays defined once for all of them.
 */
export interface Guiding {
  /** What the user has to change, phrased for the condition that raised it. */
  readonly guidance: string;
}

/**
 * Renders a failure as a user mistake rather than a crash.
 *
 * `Command.run` renders parse-time errors itself, but an error raised inside a
 * handler reaches the runtime's reporter and is printed as a defect, stack
 * trace and all. Entry points pass this to `Effect.tapErrorTag`, which keeps
 * the tag resolvable against each binary's own error channel.
 *
 * Reporting only: the failure is left in the error channel so the run still
 * fails, and `Runtime.defaultTeardown` derives the exit code from it. Catching
 * it here would turn a failed run into a successful one that merely printed a
 * complaint, which is what forces the process exit code to be set by hand.
 *
 * @param error The failure to render.
 */
export const report = (error: Guiding) => Console.error(`\n  ${error.guidance}\n`);
