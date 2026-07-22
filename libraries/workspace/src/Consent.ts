import {
  Clock,
  Console,
  Crypto,
  Effect,
  FileSystem,
  Option,
  Path,
  PlatformError,
  Schema,
} from 'effect';
import { Command, Prompt } from 'effect/unstable/cli';
import { Capabilities } from './Capabilities.ts';
import { ConfigDirectory } from './Paths.ts';

/**
 * Where to read the full account of what is collected. Shown in the prompt, so
 * consent is informed rather than merely obtained.
 */
// TODO: publish this page before the first release that ships telemetry.
export const privacyPolicy = 'https://falkara.com/privacy';

/**
 * A decision the user made about telemetry, once.
 *
 * `installId` distinguishes one installation from another so a single user
 * running the CLI ten times is not counted as ten users. It is a random v4
 * UUID: v7 would encode the time of install into the identifier, which is more
 * than an anonymous counter needs to say.
 */
const Decision = Schema.Struct({
  granted: Schema.Boolean,
  decidedAt: Schema.String,
  installId: Schema.String,
});

export type Decision = typeof Decision.Type;

const fileName = 'telemetry.json';

const decisionFile = Effect.gen(function* () {
  const path = yield* Path.Path;
  const directory = yield* ConfigDirectory;
  return { directory, file: path.join(directory, fileName) };
});

/** ENOENT surfaces as a nested reason rather than its own tagged error. */
const isMissing = (error: PlatformError.PlatformError) => error.reason._tag === 'NotFound';

/**
 * The decision on disk, if one was ever made.
 *
 * A missing file means the question has not been asked yet and is the ordinary
 * first-run case, so it becomes `None`. Anything else — an unreadable file, a
 * corrupt one — is left to fail: silently treating a damaged decision as "no
 * consent recorded" would re-ask a user who already answered.
 */
export const stored: Effect.Effect<
  Option.Option<Decision>,
  PlatformError.PlatformError | Schema.SchemaError,
  FileSystem.FileSystem | Path.Path
> = Effect.gen(function* () {
  const fileSystem = yield* FileSystem.FileSystem;
  const { file } = yield* decisionFile;

  // Read and catch rather than `exists` then read: the latter is a race and an
  // extra syscall on every run. Only the read is guarded, so a file that is
  // present but unreadable still fails rather than reading as "never asked".
  const contents = yield* fileSystem.readFileString(file).pipe(
    Effect.map(Option.some),
    Effect.catchIf(isMissing, () => Effect.succeedNone),
  );

  if (Option.isNone(contents)) {
    return Option.none();
  }

  return Option.some(yield* Schema.decodeEffect(Schema.fromJsonString(Decision))(contents.value));
});

const persist = (decision: Decision) =>
  Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem;
    const { directory, file } = yield* decisionFile;
    yield* fileSystem.makeDirectory(directory, { recursive: true });
    yield* fileSystem.writeFileString(file, `${JSON.stringify(decision, null, 2)}\n`);
  });

/**
 * What the user is agreeing to, stated in full.
 *
 * Every claim here is enforced by construction rather than by care: only an
 * error's tag is ever recorded, so there is no free text in which a path or a
 * workspace name could travel.
 */
const notice = [
  '  Falkara can send anonymous usage data to help us find what breaks.',
  '',
  '    Sent      which command ran, whether it succeeded, how long it took,',
  '              the kind of error when it fails, and the Falkara, Node and',
  '              operating system versions.',
  '    Never     file contents, file paths, workspace names, or anything you',
  '              type. Error messages are not sent, only the kind of error.',
  '',
  `  Change this any time with \`falkara telemetry\`. Details: ${privacyPolicy}`,
  '',
].join('\n');

/**
 * Records a decision, keeping the installation's identity across changes of
 * mind so that toggling telemetry twice does not read as two installations.
 */
export const decide = (granted: boolean) =>
  Effect.gen(function* () {
    const existing = yield* stored;
    const crypto = yield* Crypto.Crypto;
    const now = yield* Clock.currentTimeMillis;

    const installId = Option.isSome(existing)
      ? existing.value.installId
      : yield* crypto.randomUUIDv4;

    const decision: Decision = {
      granted,
      decidedAt: new Date(now).toISOString(),
      installId,
    };

    yield* persist(decision);
    return decision;
  });

/**
 * Asks, records the answer, and reports it.
 *
 * Defaults to declining: consent that comes from someone hitting return is not
 * consent. Only reached when a terminal is present, so the answer is always a
 * person's.
 */
const ask = Effect.gen(function* () {
  const granted = yield* Prompt.confirm({
    message: 'Send anonymous usage data?',
    initial: false,
  });

  yield* decide(granted);
  return granted;
});

/**
 * Ensures the question has been put to the user, and answers whether telemetry
 * is permitted from here on.
 *
 * Asked once and only where there is someone to answer: a pipe or a CI job is
 * told nothing and records nothing, and crucially no decision is written for
 * them, so the question survives until it reaches a terminal. A refusal that
 * the user never actually gave would be the one outcome worse than not asking.
 */
export const ensureAsked = Effect.gen(function* () {
  const existing = yield* stored;
  if (Option.isSome(existing)) {
    return existing.value.granted;
  }

  const { canPrompt } = yield* Capabilities;
  if (!canPrompt) {
    return false;
  }

  // Written as output rather than logged: this is copy the user has to read
  // before answering, not a diagnostic that a log level may filter away.
  yield* Console.log(notice);
  return yield* ask;
});

/**
 * Reports the current setting, and where it is recorded.
 *
 * "Not answered yet" is a distinct state from "declined", and is reported as
 * such: a CI run that was never asked has not refused anything.
 */
const report = Effect.gen(function* () {
  const existing = yield* stored;
  const { file } = yield* decisionFile;

  yield* Option.match(existing, {
    onNone: () =>
      Console.log(
        '\n  Telemetry: not answered yet.\n' +
          '  You will be asked the next time you run this in a terminal.\n',
      ),
    onSome: (decision) =>
      Console.log(
        `\n  Telemetry: ${decision.granted ? 'enabled' : 'disabled'}` +
          ` since ${decision.decidedAt}.\n` +
          `  Recorded in ${file}\n`,
      ),
  });
});

const acknowledge = (granted: boolean) =>
  Effect.andThen(
    decide(granted),
    Console.log(`\n  Telemetry ${granted ? 'enabled' : 'disabled'}. Details: ${privacyPolicy}\n`),
  );

/**
 * Builds the command that manages the recorded decision.
 *
 * Withdrawing has to be exactly as easy as granting, so the setting is
 * reachable and reversible without arguments to remember: running the command
 * bare reports where things stand, and two subcommands change it.
 */
export const makeCommand = <const Name extends string>(commandName: Name, invocation: string) => {
  const enable = Command.make('enable', {}, () => acknowledge(true)).pipe(
    Command.withDescription('Start sending anonymous usage data.'),
  );

  const disable = Command.make('disable', {}, () => acknowledge(false)).pipe(
    Command.withDescription('Stop sending anonymous usage data.'),
  );

  return Command.make(commandName, {}, () => report).pipe(
    Command.withDescription(
      'Show whether anonymous usage data is being sent, and turn it on or off.',
    ),
    Command.withSubcommands([enable, disable]),
    Command.withExamples([
      { command: invocation, description: 'Show the current setting.' },
      { command: `${invocation} disable`, description: 'Stop sending usage data.' },
    ]),
  );
};
