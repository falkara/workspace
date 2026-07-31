import { Layer } from 'effect';
import { Command } from 'effect/unstable/cli';
import * as Create from '#src/Create.ts';

/**
 * Scaffolding, as the product CLI mounts it.
 *
 * The telemetry question comes before the others here, because a user who
 * installed the CLI is settling how the whole tool behaves rather than getting
 * one workspace made.
 */
export const create = Command.make('create', Create.flags, Create.handler).pipe(
  Command.withDescription(Create.description),
  Command.provide(
    Layer.succeed(Create.Consenting, { ask: 'first', settings: 'falkara telemetry show' }),
  ),
  Command.withExamples([
    { command: 'falkara workspace create', description: 'Answer every question interactively.' },
    { command: 'falkara workspace create --yes', description: 'Take every default, ask nothing.' },
    {
      command: 'falkara workspace create -n storefront -p npm --no-install',
      description: 'Fully non-interactive, skipping dependency installation.',
    },
    {
      command: 'falkara workspace create -n storefront --dry-run',
      description: 'List the files it would write, and write none of them.',
    },
  ]),
);
