import { Effect, Option, Runtime, Schema, Terminal } from 'effect';
import { Prompt } from 'effect/unstable/cli';
import { Capabilities } from '#src/Capabilities.ts';
import * as Guidance from '#src/Guidance.ts';

/**
 * A run that cannot proceed because an answer is missing and cannot be asked
 * for.
 *
 * A domain error rather than the CLI framework's `UserError`: the library knows
 * *which* answer is missing, which is the useful part. Keeping it tagged also
 * makes the condition reachable in tests without matching on prose.
 */
export class UnderSpecified
  extends Schema.TaggedError<UnderSpecified>('@falkara/cli-core/Ask/UnderSpecified')(
    'UnderSpecified',
    {
      /**
       * The answer that could be neither derived nor asked for.
       */
      answer: Schema.String,
    },
  )
  implements Guidance.Guiding
{
  /**
   * Marks this value as a failure carrying guidance, for the reporter that
   * renders it.
   */
  readonly [Guidance.TypeId] = Guidance.TypeId;

  /**
   * Already reported as guidance by the time it reaches the runtime, so
   * `runMain` must not also log it as an unhandled failure.
   *
   * The exit code needs no marker: a user mistake exits `1`, which is what
   * `Runtime.defaultTeardown` uses for an unmarked failure anyway.
   */
  override readonly [Runtime.errorReported] = false;

  /**
   * What the user has to change, phrased for the answer that was missing.
   */
  get guidance(): string {
    return `Cannot ask for ${this.answer}: not a terminal. ` + `Pass --${this.answer} instead.`;
  }
}

/**
 * Where an answer came from.
 *
 * Carried rather than inferred afterwards, so that a run can report whether
 * anyone was asked anything without re-deriving it from which flags happened
 * to be present.
 */
export type Source = 'flag' | 'prompt';

/**
 * A value the run settled on, and how it was settled.
 */
export interface Answer<A> {
  readonly value: A;
  readonly source: Source;
}

/**
 * An answer is taken from its flag, else from a prompt.
 *
 * When neither applies the run is under-specified and cannot be completed:
 * guessing would scaffold something nobody asked for, and prompting into a pipe
 * would hang. Failing with instructions is the only honest outcome.
 *
 * @param options The answer being settled, and every way it may be settled.
 */
export const asking = <A>(options: {
  /**
   * The answer's name, used when reporting that it could not be asked for.
   */
  readonly label: string;
  readonly flag: Option.Option<A>;
  readonly prompt: Prompt.Prompt<A>;
}): Effect.Effect<
  Answer<A>,
  Terminal.QuitError | UnderSpecified,
  Prompt.Environment | Capabilities
> =>
  Option.match(options.flag, {
    onSome: (value) => Effect.succeed<Answer<A>>({ value, source: 'flag' }),
    onNone: () =>
      Effect.gen(function* () {
        // Read rather than passed in: threading the same capability through every call is how one of them ends up disagreeing with the others.
        const { canPrompt } = yield* Capabilities;
        if (canPrompt) {
          return { value: yield* options.prompt, source: 'prompt' } as const;
        }
        return yield* Effect.fail(new UnderSpecified({ answer: options.label }));
      }),
  });
