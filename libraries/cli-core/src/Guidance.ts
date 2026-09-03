import { Console, Effect, Predicate } from 'effect';
import { CliError, CliOutput } from 'effect/unstable/cli';

/**
 * Marks a failure as one the user can act on.
 *
 * A key of its own rather than the presence of `guidance`, so a stray field of
 * that name on a dependency's error is never rendered as Falkara's advice.
 */
export const TypeId = '~@falkara/cli-core/Guidance/Guiding';

/**
 * A failure that carries what the user has to change.
 *
 * Effect renders only its own `UserError` class this way; should it render by
 * protocol instead, this module dissolves into `CliError`.
 *
 * @see https://github.com/Effect-TS/effect/issues/7887
 */
export interface Guiding {
  readonly [TypeId]: typeof TypeId;
  readonly guidance: string;
}

/**
 * Whether a failure carries guidance.
 *
 * @param error The failure to inspect.
 */
export const isGuiding = (error: unknown): error is Guiding => Predicate.hasProperty(error, TypeId);

// Formatted as the `UserError` it amounts to, so guidance takes the formatter's colour and shape; the wrapper is discarded and the original failure continues, tag intact.
const report = (error: Guiding) =>
  Effect.flatMap(CliOutput.Formatter, (formatter) =>
    Console.error(
      formatter.formatError(new CliError.UserError({ cause: error, userMessage: error.guidance })),
    ),
  );

/**
 * Reports a run's failure as a user mistake, where the failure says what to
 * change.
 *
 * Reporting only: the failure stays in the error channel so the run still
 * fails and the teardown derives the exit code from it.
 *
 * @param effect The run whose failures are reported.
 */
export const reporting = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
  Effect.tapError(effect, (error) => (isGuiding(error) ? report(error) : Effect.void));
