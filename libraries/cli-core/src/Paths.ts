import { Config, Context, Effect, Layer, Option, Path } from 'effect';
import * as Host from '#src/Host.ts';

/**
 * Where the CLI keeps the little state that outlives a single run.
 *
 * A `Service` rather than a `Reference`: there is no answer that does not
 * consult the environment, so there is no honest default. Tests provide
 * {@link layerOf} pointing at a scratch directory.
 *
 * Effect has no notion of a platform config directory, so the convention is
 * spelled out here; should it resolve one upstream, this module dissolves
 * into it.
 *
 * @see https://github.com/Effect-TS/effect/issues/7559
 */
export class ConfigDirectory extends Context.Service<ConfigDirectory, string>()(
  '@falkara/cli-core/ConfigDirectory',
) {}

/**
 * Fixes the directory, for tests and for callers that already know.
 *
 * @param directory Where state is to be kept.
 */
export const layerOf = (directory: string): Layer.Layer<ConfigDirectory> =>
  Layer.succeed(ConfigDirectory)(directory);

// The XDG specification requires an absolute path and has a relative one ignored: honoring it would resolve against the working directory, so a decision recorded under one directory would be unreadable from the next.
const absolute = Effect.fnUntraced(function* (name: string) {
  const path = yield* Path.Path;
  const configured = yield* Effect.orDie(Config.option(Config.String(name)));
  return Option.filter(configured, (value) => path.isAbsolute(value));
});

// `XDG_CONFIG_HOME` wins on every platform, because a user who exports it has said where their config belongs; only then does the host's own convention apply.
const resolveOn = Effect.fnUntraced(function* (machine: Host.Machine) {
  const path = yield* Path.Path;

  const xdg = yield* absolute('XDG_CONFIG_HOME');
  if (Option.isSome(xdg)) {
    return path.join(xdg.value, 'falkara');
  }

  if (machine.platform === 'win32') {
    const appData = yield* absolute('APPDATA');
    return Option.match(appData, {
      onNone: () => path.join(machine.homeDirectory, 'AppData', 'Roaming', 'falkara'),
      onSome: (value) => path.join(value, 'falkara'),
    });
  }

  if (machine.platform === 'darwin') {
    return path.join(machine.homeDirectory, 'Library', 'Application Support', 'falkara');
  }

  return path.join(machine.homeDirectory, '.config', 'falkara');
});

/**
 * Resolves the config directory from the environment, for the given host.
 *
 * @param machine The host whose convention applies.
 */
export const layerOn = (machine: Host.Machine): Layer.Layer<ConfigDirectory, never, Path.Path> =>
  Layer.effect(ConfigDirectory)(resolveOn(machine));

/**
 * Resolves the config directory from the environment and the host.
 */
export const layer: Layer.Layer<ConfigDirectory, never, Path.Path> = Layer.effect(ConfigDirectory)(
  Effect.flatMap(Host.current, resolveOn),
);
