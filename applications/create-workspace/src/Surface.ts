import PackageJson from '#package.json' with { type: 'json' };
import { Package } from '@falkara/cli-kernel';
import { Create } from '@falkara/cli-workspace';
import { Layer } from 'effect';
import { Command } from 'effect/unstable/cli';

/**
 * The command tree this binary exposes.
 */
export const createWorkspace = Command.make(
  Package.binary(PackageJson.bin),
  Create.flags,
  Create.handler,
).pipe(
  Command.withDescription(Create.description),
  Command.provide(Layer.succeed(Create.Consenting, { ask: 'last' })),
);
