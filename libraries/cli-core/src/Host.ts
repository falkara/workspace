import { Effect } from 'effect';
import { homedir } from 'node:os';

/**
 * The machine a run happens on.
 *
 * Passed as a value wherever the CLI branches on the host, so each branch can
 * be tested from a machine it is not for. `homeDirectory` comes from `node:os`
 * rather than `$HOME`, which `homedir()` still answers when that is unset.
 *
 * Should Effect resolve platform directories upstream, the config-directory
 * consumer goes and the span facts can be gathered inline; this module goes
 * with them.
 *
 * @see https://github.com/Effect-TS/effect/issues/7559
 */
export interface Machine {
  readonly platform: string;
  readonly architecture: string;
  readonly runtimeVersion: string;
  readonly homeDirectory: string;
}

/**
 * The machine this process runs on.
 */
export const current: Effect.Effect<Machine> = Effect.sync(() => ({
  platform: process.platform,
  architecture: process.arch,
  runtimeVersion: process.versions.node,
  homeDirectory: homedir(),
}));
