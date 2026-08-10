import { Telemetry } from '@falkara/cli-telemetry';
import type { Binary } from '@falkara/cli-core';
import { Create } from '@falkara/cli-workspace';
import { Command } from 'effect/unstable/cli';

const telemetry = Command.make('telemetry').pipe(
  Command.withDescription(Telemetry.description),
  Command.withSubcommands([Telemetry.show, Telemetry.explain, Telemetry.enable, Telemetry.disable]),
);

const create = (binary: Binary.Manifest) =>
  Command.make('create', Create.flags, Create.handler).pipe(
    Command.withDescription(Create.description),
    Command.provide(Create.consenting({ ask: 'first', settings: `${binary.name} telemetry show` })),
  );

const workspace = (binary: Binary.Manifest) =>
  Command.make('workspace').pipe(
    Command.withDescription('Create and manage Falkara Workspace projects.'),
    Command.withSubcommands([create(binary)]),
  );

/**
 * The command tree this binary exposes.
 *
 * @param binary Names and describes the root command.
 */
export const surface = (binary: Binary.Manifest) =>
  Command.make(binary.name).pipe(
    Command.withDescription(binary.description),
    Command.withSubcommands([telemetry, workspace(binary)]),
  );
