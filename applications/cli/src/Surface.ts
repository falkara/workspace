import PackageJson from '#package.json' with { type: 'json' };
import { Consent } from '@falkara/cli-consent';
import { Package } from '@falkara/cli-kernel';
import { Workspace } from '@falkara/cli-workspace';
import { Command } from 'effect/unstable/cli';

const workspace = Command.make('workspace').pipe(
  Command.withDescription('Create and manage Falkara Workspace projects.'),
  Command.withSubcommands([Workspace.create]),
);

const telemetry = Command.make('telemetry').pipe(
  Command.withDescription('Manage what Falkara CLI reports about how it is used.'),
  Command.withSubcommands([Consent.show, Consent.enable, Consent.disable]),
  Command.withExamples([
    { command: 'falkara telemetry show', description: 'Show the current setting.' },
    { command: 'falkara telemetry enable', description: 'Start sending usage data.' },
    { command: 'falkara telemetry disable', description: 'Stop sending usage data.' },
  ]),
);

/**
 * The command tree this binary exposes.
 */
export const falkara = Command.make(Package.binary(PackageJson.bin)).pipe(
  Command.withDescription(PackageJson.description),
  Command.withSubcommands([workspace, telemetry]),
);
