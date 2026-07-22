#!/usr/bin/env node

// Imported by submodule rather than the package root. The root barrel eagerly
// loads the whole platform, undici included, which this CLI never uses:
// ~300ms of startup against ~170ms for these two submodules.
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import * as NodeServices from '@effect/platform-node/NodeServices';
import { Create, Report, Telemetry, Ui } from '@falkara/workspace';
import { Effect, Layer } from 'effect';
import { Command } from 'effect/unstable/cli';
// Inlined as a bare string literal at bundle time, so the shipped binary
// resolves nothing at runtime and `--version` cannot drift from the package.
import PackageJson from '../package.json' with { type: 'json' };

/**
 * The zero-install entry point, reached as `bun create @falkara/workspace`.
 *
 * This package exists only because `bun create` and `npm create` resolve to a
 * `create-` prefixed package name and nothing else; the command itself lives in
 * `@falkara/workspace`, where the product CLI mounts it as `workspace create`.
 */
const command = Create.makeCommand('create-workspace', 'create-workspace');

// `Capabilities` needs no layer: it is a reference with a default derived
// from the process, overridable per run in tests.
const MainLayer = Ui.layer.pipe(Layer.provideMerge(NodeServices.layer));

Command.run(command, { version: PackageJson.version }).pipe(
  Effect.tapErrorTag('UnderSpecified', Report.underSpecified),
  // Outside everything the command runs: the exporter only flushes when its
  // scope closes, so a layer closing before the root span ended would drop the
  // one trace it exists to send.
  Effect.provide(Telemetry.layer({ name: 'create-workspace', version: PackageJson.version })),
  Effect.provide(MainLayer),
  NodeRuntime.runMain,
);
