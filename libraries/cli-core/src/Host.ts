import { Context } from 'effect';
import { homedir } from 'node:os';

/**
 * The machine and runtime a run happens on.
 *
 * A `Reference` rather than a `Service`: every field has a correct answer that
 * consults nothing fallible, so there is an honest default and no layer to
 * wire. It is a service at all so that the parts of the CLI which *branch* on
 * the host — where the config directory lives, what a span says about the run —
 * can be exercised for a host the test is not running on. Reading
 * `process.platform` at each of those branches instead would put the one
 * decision worth testing out of a test's reach.
 *
 * `homeDirectory` comes from `node:os` rather than `$HOME`, because on a machine
 * where that is unset `homedir()` still answers from the password database.
 */
export interface Machine {
  /**
   * As `process.platform` reports it: `darwin`, `win32`, `linux`, and so on.
   */
  readonly platform: string;
  readonly architecture: string;
  readonly runtimeVersion: string;
  readonly homeDirectory: string;
}

export const Machine = Context.Reference<Machine>('@falkara/cli-core/Host/Machine', {
  defaultValue: (): Machine => ({
    platform: process.platform,
    architecture: process.arch,
    runtimeVersion: process.versions.node,
    homeDirectory: homedir(),
  }),
});
