import { Context, Effect, Layer, Option, Path } from 'effect';
import * as Env from '#src/Env.ts';
import * as Host from '#src/Host.ts';

/**
 * Where the CLI keeps the little state that outlives a single run.
 *
 * A `Service` rather than a `Reference`, for the same reason as
 * `Capabilities`: there is no answer that does not consult the environment, so
 * there is no honest default to carry. Tests provide {@link layerOf} pointing
 * at a scratch directory.
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

const absolute = Effect.fnUntraced(function* (name: string) {
  const path = yield* Path.Path;
  const configured = yield* Env.optional(name);
  return Option.filter(configured, (value) => path.isAbsolute(value));
});

// Effect has no notion of a platform config directory, so the convention is spelled out here rather than assumed. `XDG_CONFIG_HOME` wins everywhere it is set to an absolute path, because a user who exports it has said explicitly where their config belongs; only after that does the host's own convention apply.
// The XDG Base Directory Specification requires an absolute path in these variables and has a relative one treated as invalid and ignored. Honoring one would resolve the directory against the working directory instead, so a decision recorded under one directory would be unreadable from the next and a user who declined would be asked again after every `cd`.
// The host is read from `Host.Machine` rather than from `process`, so that each of these branches can be taken in a test on a machine that is none of them — a platform-dependent path is exactly the thing that cannot be checked by running it once, on one platform. Paths are joined through the `Path` service rather than `node:path`, so the one part of this that Effect does model goes through Effect.
const resolve: Effect.Effect<string, never, Path.Path> = Effect.gen(function* () {
  const path = yield* Path.Path;
  const machine = yield* Host.Machine;

  const xdg = yield* absolute('XDG_CONFIG_HOME');
  if (Option.isSome(xdg)) {
    return path.join(xdg.value, 'falkara');
  }

  if (machine.platform === 'win32') {
    const appData = yield* absolute('APPDATA');
    if (Option.isSome(appData)) {
      return path.join(appData.value, 'falkara');
    }
  }

  if (machine.platform === 'darwin') {
    return path.join(machine.homeDirectory, 'Library', 'Application Support', 'falkara');
  }

  return path.join(machine.homeDirectory, '.config', 'falkara');
});

/**
 * Resolves the config directory from the environment and the host.
 */
export const layer: Layer.Layer<ConfigDirectory, never, Path.Path> =
  Layer.effect(ConfigDirectory)(resolve);
