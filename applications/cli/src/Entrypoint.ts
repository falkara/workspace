#!/usr/bin/env node

import { NodeRuntime } from '@effect/platform-node';
import PackageManifest from '#package.json' with { type: 'json' };
import { surface } from '#src/Surface.ts';
import { Binary } from '@falkara/cli-core';

NodeRuntime.runMain(Binary.make(surface, PackageManifest));
