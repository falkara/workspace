import { Command } from 'effect/unstable/cli';
import * as Decision from '#src/Decision.ts';

/**
 * Reports the decision and where it is recorded.
 */
export const show = Command.make('show', {}, () => Decision.report).pipe(
  Command.withDescription('Show whether anonymous usage data is being sent.'),
);

/**
 * Starts sending usage data.
 */
export const enable = Command.make('enable', {}, () => Decision.acknowledge(true)).pipe(
  Command.withDescription('Start sending anonymous usage data.'),
);

/**
 * Stops sending usage data.
 *
 * Withdrawing has to be exactly as easy as granting, which is why this sits
 * beside {@link enable} rather than behind a flag on it.
 */
export const disable = Command.make('disable', {}, () => Decision.acknowledge(false)).pipe(
  Command.withDescription('Stop sending anonymous usage data.'),
);
