import { Consent } from '@falkara/cli-core';
import { Console, DateTime, Effect } from 'effect';

/**
 * Reports the current setting, and where it is recorded.
 *
 * "Not answered yet" is a distinct state from "declined", and is reported as
 * such: a CI run that was never asked has not refused anything.
 */
export const report = Effect.gen(function* () {
  const existing = yield* Consent.recorded;
  const { file } = yield* Consent.decisionFile;

  switch (existing._tag) {
    case 'Absent':
      return yield* Console.log(
        '\n  Telemetry: not answered yet.\n' +
          '  You will be asked the next time you run this in a terminal.\n',
      );
    case 'Present':
      return yield* Console.log(
        `\n  Telemetry: ${existing.decision.granted ? 'enabled' : 'disabled'}` +
          ` since ${DateTime.formatIso(existing.decision.decidedAt)}.\n` +
          `  Recorded in ${file}\n`,
      );
    // Said plainly and with the way out, rather than raised: this command is the one place the file itself is the subject, so a reader here wants to know what to do about it, not to be shown where the parse gave up.
    case 'Unreadable':
      return yield* Console.log(
        '\n  Telemetry: nothing usable recorded.\n' +
          `  ${file} could not be read.\n` +
          '  Nothing is being sent. Run `enable` or `disable` to record it afresh.\n',
      );
  }
});

/**
 * Sets out what leaves this machine, and under what identifier.
 *
 * The categories are the same lines the consent prompt shows, so what someone
 * reads here is what they agreed to. The installation identifier is added
 * because it is the only recorded value that travels with a report, and the
 * question this answers is what exactly is sent.
 */
// Three states, not two: a file that cannot be read may well hold an identifier, and saying none exists would be a guess about a file this command has just failed to parse.
const identity = (recorded: Consent.Recorded): string => {
  switch (recorded._tag) {
    case 'Present':
      return `  Reports are attributed to installation ${recorded.decision.installId}.`;
    case 'Absent':
      return '  No installation identifier exists yet; one is created when you decide.';
    case 'Unreadable':
      return '  An installation identifier may exist, but the file could not be read.';
  }
};

export const explain = Effect.gen(function* () {
  const recorded = yield* Consent.recorded;

  return yield* Console.log(
    [
      '',
      ...Consent.collected,
      '',
      identity(recorded),
      `  Details: ${Consent.privacyPolicy}`,
      '',
    ].join('\n'),
  );
});

/**
 * Records the decision and says what it now is.
 *
 * @param granted Whether usage data may be sent from now on.
 */
export const acknowledge = (granted: boolean) =>
  Effect.andThen(
    Consent.decide(granted),
    Console.log(
      `\n  Telemetry ${granted ? 'enabled' : 'disabled'}. Details: ${Consent.privacyPolicy}\n`,
    ),
  );
