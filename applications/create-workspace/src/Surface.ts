import type { Binary } from '@falkara/cli-core';
import { Create } from '@falkara/cli-workspace';
import { Command } from 'effect/unstable/cli';

/**
 * The command tree this binary exposes.
 *
 * Mounts `Create` at the root rather than as a subcommand, because `npm create
 * @falkara/workspace` runs this binary directly and a verb would have to be
 * typed after `--`. Only where it sits differs; the flags and the handler are
 * `Create`'s own, so a scaffold here answers as it does anywhere.
 *
 * @param binary Names and describes the root command.
 */
export const surface = (binary: Binary.Manifest) =>
  Command.make(binary.name, Create.flags, Create.handler).pipe(
    Command.withDescription(binary.description),
    Command.provide(Create.consenting({ ask: 'last' })),
  );
