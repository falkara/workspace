import { Console } from 'effect';
import type { UnderSpecified } from './Errors.ts';

/**
 * Renders an under-specified run as a user mistake rather than a crash.
 *
 * `Command.run` renders parse-time errors itself, but an error raised inside a
 * handler reaches the runtime's reporter and is printed as a defect, stack
 * trace and all. Entry points pass this to
 * `Effect.tapErrorTag('UnderSpecified', …)`, which keeps the tag resolvable
 * against each binary's own error channel while the wording stays defined once.
 *
 * Reporting only: the failure is left in the error channel so the run still
 * fails, and `Runtime.defaultTeardown` derives the exit code from it. Catching
 * it here would turn a failed run into a successful one that merely printed a
 * complaint, which is what forces the process exit code to be set by hand.
 */
export const underSpecified = (error: UnderSpecified) => Console.error(`\n  ${error.guidance}\n`);
