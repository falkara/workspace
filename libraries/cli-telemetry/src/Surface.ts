import * as Decision from '#src/Decision.ts';
import { Command } from 'effect/unstable/cli';

/**
 * What the group of these commands says it is for.
 */
export const description = 'Show and change whether usage data is sent.';

/**
 * Reports the decision, when it was made, and where it is recorded.
 */
export const show = Command.make('show', {}, () => Decision.report).pipe(
  Command.withDescription('Show whether usage data is sent, and where that is recorded.'),
);

/**
 * Sets out what is sent, what never is, and under what identifier.
 *
 * Separate from {@link show} because it answers a different question: `show`
 * reports a setting that changes when the user changes it, this reports what is
 * collected, which changes when Falkara changes it. It is also readable before
 * any decision exists, and when the recorded one cannot be parsed.
 */
export const explain = Command.make('explain', {}, () => Decision.explain).pipe(
  Command.withDescription('Explain what is sent, what is never sent, and under what identifier.'),
);

/**
 * Starts sending usage data.
 */
export const enable = Command.make('enable', {}, () => Decision.acknowledge(true)).pipe(
  Command.withDescription('Start sending usage data.'),
);

/**
 * Stops sending usage data.
 *
 * Withdrawing has to be exactly as easy as granting, which is why this sits
 * beside {@link enable} rather than behind a flag on it.
 */
export const disable = Command.make('disable', {}, () => Decision.acknowledge(false)).pipe(
  Command.withDescription('Stop sending usage data.'),
);
