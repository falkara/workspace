#!/usr/bin/env node
import { NodeRuntime } from '@effect/platform-node';

import { program } from '#src/Program';

NodeRuntime.runMain(program);
