import { Context } from 'effect';

/**
 * What the surrounding terminal permits.
 *
 * Both answers come from the same place because they are the same question
 * asked twice, and letting them drift apart is how a CLI ends up drawing a
 * spinner into a log file or waiting for input that can never arrive.
 *
 * A `Reference` rather than a `Service`: there is always a correct answer, so
 * entry points get it without wiring a layer, and tests override it with
 * `Effect.provideService` instead of building one.
 */
export interface Capabilities {
  /** Whether a question can be asked and answered. */
  readonly canPrompt: boolean;
  /** Whether output is watched by someone, so pacing it means anything. */
  readonly canAnimate: boolean;
}

export const Capabilities = Context.Reference<Capabilities>('@falkara/workspace/Capabilities', {
  defaultValue: () => ({
    // Asking needs an answer to arrive on stdin and the question to be visible
    // on stdout; animating only needs the latter.
    canPrompt: process.stdin.isTTY === true && process.stdout.isTTY === true,
    canAnimate: process.stdout.isTTY === true,
  }),
});

/** A terminal with a person in front of it. */
export const interactive: Capabilities = { canPrompt: true, canAnimate: true };

/** A pipe, a log, or CI. */
export const plain: Capabilities = { canPrompt: false, canAnimate: false };
