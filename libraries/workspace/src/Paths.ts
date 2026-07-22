import { Context } from 'effect';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Where the CLI keeps the little state that outlives a single run.
 *
 * Effect has no notion of a platform config directory, so the convention is
 * spelled out here rather than assumed. `XDG_CONFIG_HOME` wins everywhere it is
 * set, because a user who exports it has said explicitly where their config
 * belongs; only after that does the host's own convention apply.
 */
const defaultDirectory = (): string => {
  const xdg = process.env['XDG_CONFIG_HOME'];
  if (xdg !== undefined && xdg !== '') {
    return join(xdg, 'falkara');
  }

  if (process.platform === 'win32') {
    const appData = process.env['APPDATA'];
    if (appData !== undefined && appData !== '') {
      return join(appData, 'falkara');
    }
  }

  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'falkara');
  }

  return join(homedir(), '.config', 'falkara');
};

/**
 * A `Reference` rather than a `Service`: there is always a correct answer, and
 * tests override it with `Effect.provideService` to point at a scratch
 * directory instead of the real one.
 */
export const ConfigDirectory = Context.Reference<string>('@falkara/workspace/ConfigDirectory', {
  defaultValue: defaultDirectory,
});
