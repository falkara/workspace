#!/usr/bin/env node

// Imported by submodule rather than the package root. The root barrel eagerly
// loads the whole platform, undici included, which this CLI never uses:
// ~300ms of startup against ~170ms for these two submodules.
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import * as NodeServices from '@effect/platform-node/NodeServices';
import { Consent, Create, Report, Telemetry, Ui } from '@falkara/workspace';
import { Effect, Layer } from 'effect';
import { Command } from 'effect/unstable/cli';
// Inlined as a bare string literal at bundle time, so the shipped binary
// resolves nothing at runtime and `--version` cannot drift from the package.
import PackageJson from '../package.json' with { type: 'json' };

const create = Create.makeCommand('create', 'falkara workspace create');

/**
 * Groups everything that acts on a workspace. Running the group on its own is
 * not an action, so it points at what is available instead.
 */
const workspace = Command.make('workspace').pipe(
  Command.withDescription('Create and manage Falkara workspaces.'),
  Command.withSubcommands([create]),
);

const telemetry = Consent.makeCommand('telemetry', 'falkara telemetry');

const falkara = Command.make('falkara').pipe(
  Command.withDescription('The Falkara command line interface.'),
  Command.withSubcommands([workspace, telemetry]),
);

// `Capabilities` needs no layer: it is a reference with a default derived
// from the process, overridable per run in tests.
const MainLayer = Ui.layer.pipe(Layer.provideMerge(NodeServices.layer));

Command.run(falkara, { version: PackageJson.version }).pipe(
  Effect.tapErrorTag('UnderSpecified', Report.underSpecified),
  // Outside everything the command runs: the exporter only flushes when its
  // scope closes, so a layer closing before the root span ended would drop the
  // one trace it exists to send.
  Effect.provide(Telemetry.layer({ name: 'falkara', version: PackageJson.version })),
  Effect.provide(MainLayer),
  NodeRuntime.runMain,
);
