#!/usr/bin/env node

import { NodeRuntime } from '@effect/platform-node';
import { Effect } from 'effect';

NodeRuntime.runMain(Effect.void);
