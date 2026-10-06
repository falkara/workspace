import { Config, Context, Effect, Layer, Option, Stdio } from 'effect';

/**
 * What the surrounding terminal permits.
 *
 * One answer for all three, because they are the same question asked three
 * times, and letting them drift apart is how a CLI draws a spinner into a log
 * file or leaves escape bytes in a build artefact.
 */
export interface Permissions {
  readonly canPrompt: boolean;
  readonly canAnimate: boolean;
  readonly canColour: boolean;
}

/**
 * What this run's terminal permits.
 *
 * A `Service` rather than a `Reference`: there is no honest default, so the
 * answer is resolved once by {@link layer} and everything downstream reads it.
 *
 * Effect detects nothing of this itself; should it adopt capability detection
 * upstream, this module dissolves into it.
 *
 * @see https://github.com/Effect-TS/effect/issues/7556
 */
export class Capabilities extends Context.Service<Capabilities, Permissions>()(
  '@falkara/cli-core/Capabilities',
) {}

// `FORCE_COLOR=0` is how the same convention says no, and is treated as not forcing rather than as forcing nothing.
const forcesColour = (value: Option.Option<string>): boolean =>
  Option.match(value, {
    onNone: () => false,
    onSome: (raw) => {
      const normalised = raw.trim().toLowerCase();
      return normalised !== '0' && normalised !== 'false';
    },
  });

// An empty variable reads as unset, which is how a shell clears what it cannot delete. A provider fault is not something a CLI can recover from, so it dies.
const environment = Config.all({
  noColour: Config.option(Config.String('NO_COLOR')),
  forceColour: Config.option(Config.String('FORCE_COLOR')),
  term: Config.option(Config.String('TERM')),
});

// `NO_COLOR` beats `FORCE_COLOR`: the conventions do not say which wins, so the tie goes to the one asking for less.
// `TERM=dumb` disables all three, not merely colour: a terminal that cannot move the cursor can neither animate nor redraw a prompt.
const resolve: Effect.Effect<Permissions, never, Stdio.Stdio> = Effect.gen(function* () {
  const { noColour, forceColour, term } = yield* Effect.orDie(environment);
  const stdio = yield* Stdio.Stdio;

  const dumb = Option.match(term, { onNone: () => false, onSome: (value) => value === 'dumb' });
  const writes = (yield* stdio.stdoutIsTerminal) && !dumb;
  const reads = yield* stdio.stdinIsTerminal;

  return {
    canPrompt: writes && reads,
    canAnimate: writes,
    canColour: Option.isNone(noColour) && !dumb && (forcesColour(forceColour) || writes),
  };
});

/**
 * Resolves what this terminal permits, from the streams and the environment.
 */
export const layer: Layer.Layer<Capabilities, never, Stdio.Stdio> =
  Layer.effect(Capabilities)(resolve);
