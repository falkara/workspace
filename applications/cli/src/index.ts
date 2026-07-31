#!/usr/bin/env node

import PackageJson from '#package.json' with { type: 'json' };
import { falkara } from '#src/Surface.ts';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import { Guidance, Kernel, Package } from '@falkara/cli-kernel';
import { Effect } from 'effect';
import { Command } from 'effect/unstable/cli';

Command.run(falkara, { version: PackageJson.version }).pipe(
  Effect.tapErrorTag('UnderSpecified', Guidance.report),
  Effect.tapErrorTag('Occupied', Guidance.report),
  Effect.provide(
    Kernel.layerFor({ name: Package.binary(PackageJson.bin), version: PackageJson.version }),
  ),
  NodeRuntime.runMain,
);
