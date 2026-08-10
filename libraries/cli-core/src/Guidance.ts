import { Console, Effect, Predicate } from 'effect';
import { CliError, CliOutput } from 'effect/unstable/cli';

/**
 * The property that marks a failure as one a user can act on.
 *
 * A key of its own rather than the presence of `guidance` alone, because a
 * failure from anywhere in the dependency tree may carry a field of that name,
 * and rendering it as advice would put words in Falkara's mouth that it never
 * wrote.
 */
export const TypeId = '~@falkara/cli-core/Guidance/Guiding';

/**
 * A failure that carries what the user has to change.
 *
 * The property a failure needs to be reportable as a mistake rather than as a
 * crash, so that the wording lives with the condition that raised it and the
 * rendering stays defined once for all of them.
 */
export interface Guiding {
  readonly [TypeId]: typeof TypeId;
  /**
   * What the user has to change, phrased for the condition that raised it.
   */
  readonly guidance: string;
}

/**
 * Whether a failure carries guidance.
 *
 * @param error The failure to inspect.
 */
export const isGuiding = (error: unknown): error is Guiding => Predicate.hasProperty(error, TypeId);

// Rendered through the installed `CliOutput.Formatter`, so guidance obeys the same colour and shape as the framework's own errors. `formatError` takes a `CliError`, so the guidance is carried across as a `UserError`'s `userMessage` — which is what a guiding failure is, stated in the vocabulary the formatter reads.
// The wrapper never reaches the error channel: it is built to be formatted and discarded, and the original failure continues unchanged so its tag still reaches the span and the teardown.
const report = (error: Guiding) =>
  Effect.flatMap(CliOutput.Formatter, (formatter) =>
    Console.error(
      formatter.formatError(new CliError.UserError({ cause: error, userMessage: error.guidance })),
    ),
  );

/**
 * Reports whatever a run failed with as a user mistake, where the failure says
 * what to change.
 *
 * Decided on the failure itself rather than on a list of tags, so that a
 * condition added later is reported by every binary without either of them
 * being told about the other.
 *
 * Reporting only: the failure is left in the error channel so the run still
 * fails, and `Runtime.defaultTeardown` derives the exit code from it. Catching
 * it here would turn a failed run into a successful one that merely printed a
 * complaint, which is what forces the process exit code to be set by hand.
 *
 * @param effect The run whose failures are reported.
 */
export const reporting = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
  Effect.tapError(effect, (error) => (isGuiding(error) ? report(error) : Effect.void));
