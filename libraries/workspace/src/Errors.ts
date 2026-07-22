import { Data, Runtime } from 'effect';

/**
 * A run that cannot proceed because an answer is missing and cannot be asked
 * for.
 *
 * A domain error rather than the CLI framework's `UserError`: the library
 * knows *which* answer is missing, which is the useful part, and how that gets
 * rendered is the entry point's business. Keeping it tagged also makes the
 * condition reachable in tests without matching on prose.
 */
export class UnderSpecified extends Data.TaggedError('UnderSpecified')<{
  /** The answer that could be neither derived nor asked for. */
  readonly answer: string;
}> {
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
