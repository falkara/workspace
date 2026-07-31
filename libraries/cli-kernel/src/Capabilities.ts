import { Config, Context, Effect, Layer, Option } from 'effect';
import * as Env from '#src/Env.ts';
import * as Host from '#src/Host.ts';

/**
 * What the surrounding terminal permits.
 *
 * All three answers come from the same place because they are the same question
 * asked three times, and letting them drift apart is how a CLI ends up drawing
 * a spinner into a log file, waiting for input that can never arrive, or
 * leaving escape bytes in a build artefact.
 */
export interface Permissions {
  /** Whether a question can be asked and answered. */
  readonly canPrompt: boolean;
  /** Whether output is watched by someone, so pacing it means anything. */
  readonly canAnimate: boolean;
  /** Whether styling will be rendered rather than stored as bytes. */
  readonly canColour: boolean;
}

/**
 * A `Service` rather than a `Reference`: the answer depends on the environment,
 * and a `Reference` would have to carry a default computed without it. Every
 * default available here is wrong somewhere — assuming colour corrupts a log,
 * assuming none makes an interactive run drab — so the answer is resolved once,
 * by {@link layer}, and everything downstream reads it.
 */
export class Capabilities extends Context.Service<Capabilities, Permissions>()(
  '@falkara/cli-kernel/Capabilities',
) {}

/** A terminal with a person in front of it. */
export const interactive: Permissions = {
  canPrompt: true,
  canAnimate: true,
  canColour: true,
};

/** A pipe, a log, or CI. */
export const plain: Permissions = {
  canPrompt: false,
  canAnimate: false,
  canColour: false,
};

/** Fixes the answer, for tests and for callers that already know. */
export const layerOf = (permissions: Permissions): Layer.Layer<Capabilities> =>
  Layer.succeed(Capabilities)(permissions);

/**
 * Whether the caller has asked for colour regardless of where output lands.
 *
 * `FORCE_COLOR=0` is how the same convention says no, and is treated as not
 * forcing rather than as forcing nothing.
 */
const forcesColour = (value: Option.Option<string>): boolean =>
  Option.match(value, {
    onNone: () => false,
    onSome: (raw) => {
      const normalised = raw.trim().toLowerCase();
      return normalised !== '0' && normalised !== 'false';
    },
  });

/**
 * Resolves what this terminal permits.
 *
 * `NO_COLOR` beats `FORCE_COLOR`: the two conventions do not say which wins, so
 * the tie goes to the one asking for less. Someone who exported `NO_COLOR`
 * globally and `FORCE_COLOR` for one tool years ago should not be surprised by
 * escape bytes.
 *
 * `TERM=dumb` disables all three, not merely colour. Cursor movement is what
 * the animated presentation is built out of, and a prompt cannot redraw itself
 * on a terminal that cannot move the cursor either.
 *
 * TTY-ness comes from `Host.Streams` rather than from `process`, so that this
 * resolution — the part with the branches actually worth checking — can be run
 * for a terminal the test does not have.
 */
const resolve: Effect.Effect<Permissions, Config.ConfigError> = Effect.gen(function* () {
  const noColour = yield* Env.optional('NO_COLOR');
  const forceColour = yield* Env.optional('FORCE_COLOR');
  const term = yield* Env.optional('TERM');
  const streams = yield* Host.Streams;

  const dumb = Option.match(term, { onNone: () => false, onSome: (value) => value === 'dumb' });
  const writes = streams.outputIsTerminal && !dumb;
  const reads = streams.inputIsTerminal;

  return {
    canPrompt: writes && reads,
    canAnimate: writes,
    canColour: Option.isNone(noColour) && !dumb && (forcesColour(forceColour) || writes),
  };
});

/** Resolves what this terminal permits, from the process and the environment. */
export const layer: Layer.Layer<Capabilities, Config.ConfigError> =
  Layer.effect(Capabilities)(resolve);
