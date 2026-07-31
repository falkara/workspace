import { Data, Effect, Option, Runtime, Terminal } from 'effect';
import { Prompt } from 'effect/unstable/cli';
import { Capabilities } from '#src/Capabilities.ts';
import type { Guiding } from '#src/Guidance.ts';

/**
 * A run that cannot proceed because an answer is missing and cannot be asked
 * for.
 *
 * A domain error rather than the CLI framework's `UserError`: the library knows
 * *which* answer is missing, which is the useful part. Keeping it tagged also
 * makes the condition reachable in tests without matching on prose.
 */
export class UnderSpecified
  extends Data.TaggedError('UnderSpecified')<{
    /** The answer that could be neither derived nor asked for. */
    readonly answer: string;
  }>
  implements Guiding
{
  /**
   * Already reported as guidance by the time it reaches the runtime, so
   * `runMain` must not also log it as an unhandled failure.
   *
   * The exit code needs no marker: a user mistake exits `1`, which is what
   * `Runtime.defaultTeardown` uses for an unmarked failure anyway.
   */
  override readonly [Runtime.errorReported] = false;

  /** What the user has to change, phrased for the answer that was missing. */
  get guidance(): string {
    return (
      `Cannot ask for ${this.answer}: not a terminal. ` +
      `Re-run with --yes to accept the defaults, or pass --${this.answer}.`
    );
  }
}

/**
 * Where an answer came from.
 *
 * Carried rather than inferred afterwards, because it cannot be inferred
 * afterwards: `--yes` says prompts were *skipped*, not that they would
 * otherwise have happened, and a run that supplied every flag asks nothing with
 * or without it.
 */
export type Source = 'flag' | 'prompt' | 'default';

/** A value the run settled on, and how it was settled. */
export interface Answer<A> {
  readonly value: A;
  readonly source: Source;
}

/**
 * An answer is taken from its flag, else from the default when `--yes` was
 * given, else from a prompt.
 *
 * When none of those apply the run is under-specified and cannot be completed:
 * guessing would scaffold something nobody asked for, and prompting into a pipe
 * would hang. Failing with instructions is the only honest outcome.
 *
 * @param skipPrompts Whether the run was told to take the defaults rather than ask.
 */
export const asking =
  (skipPrompts: boolean) =>
  <A>(options: {
    /** The answer's name, used when reporting that it could not be asked for. */
    readonly label: string;
    readonly flag: Option.Option<A>;
    readonly prompt: Prompt.Prompt<A>;
    readonly fallback: A;
  }): Effect.Effect<
    Answer<A>,
    Terminal.QuitError | UnderSpecified,
    Prompt.Environment | Capabilities
  > =>
    Option.match(options.flag, {
      onSome: (value) => Effect.succeed<Answer<A>>({ value, source: 'flag' }),
      onNone: () =>
        Effect.gen(function* () {
          if (skipPrompts) {
            return { value: options.fallback, source: 'default' } as const;
          }
          // Read rather than passed in: threading the same capability through every call is how one of them ends up disagreeing with the others.
          const { canPrompt } = yield* Capabilities;
          if (canPrompt) {
            return { value: yield* options.prompt, source: 'prompt' } as const;
          }
          return yield* Effect.fail(new UnderSpecified({ answer: options.label }));
        }),
    });
