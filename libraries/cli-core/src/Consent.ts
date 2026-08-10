import {
  Console,
  Crypto,
  DateTime,
  Effect,
  FileSystem,
  Option,
  Path,
  PlatformError,
  Schema,
} from 'effect';
import { Prompt } from 'effect/unstable/cli';
import { Capabilities } from '#src/Capabilities.ts';
import { ConfigDirectory } from '#src/Paths.ts';

/**
 * Where to read the full account of what is collected. Shown in the prompt, so
 * consent is informed rather than merely obtained.
 */
export const privacyPolicy = 'https://falkara.com/privacy';

// `installId` distinguishes one installation from another so a single user running the CLI ten times is not counted as ten users. It is a random v4 UUID: v7 would encode the time of install into the identifier, which is more than an anonymous counter needs to say.
// `decidedAt` is an instant, not a string that happens to look like one. The schema owns the encoding in both directions, so a file whose timestamp is unparseable is rejected on read rather than carried around and printed back at the user as though it meant something.
const Decision = Schema.Struct({
  granted: Schema.Boolean,
  decidedAt: Schema.DateTimeUtcFromString,
  installId: Schema.String,
});

/**
 * A decision the user made about telemetry, once.
 */
export type Decision = typeof Decision.Type;

const decodeDecision = Schema.decodeEffect(Schema.fromJsonString(Decision));
const encodeDecision = Schema.encodeEffect(Decision);

const fileName = 'telemetry.json';

/**
 * Where the decision is kept, and the directory it lives in.
 */
export const decisionFile = Effect.gen(function* () {
  const path = yield* Path.Path;
  const directory = yield* ConfigDirectory;
  return { directory, file: path.join(directory, fileName) };
});

// ENOENT surfaces as a nested reason rather than its own tagged error.
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
  FileSystem.FileSystem | Path.Path | ConfigDirectory
> = Effect.gen(function* () {
  const fileSystem = yield* FileSystem.FileSystem;
  const { file } = yield* decisionFile;

  // Read and catch rather than `exists` then read: the latter is a race and an extra syscall on every run. Only the read is guarded, so a file that is present but unreadable still fails rather than reading as "never asked".
  const contents = yield* fileSystem.readFileString(file).pipe(
    Effect.map(Option.some),
    Effect.catchIf(isMissing, () => Effect.succeedNone),
  );

  if (Option.isNone(contents)) {
    return Option.none();
  }

  return Option.some(yield* decodeDecision(contents.value));
});

/**
 * What the file turned out to say.
 *
 * Three states, because there are three, and collapsing them loses the one that
 * matters: a decision that cannot be read is not the same as one that says no,
 * and neither is the same as never having been asked. Every caller below has a
 * different right answer for `Unreadable`, which is only possible while it is
 * still distinguishable.
 */
export type Recorded =
  | { readonly _tag: 'Absent' }
  | { readonly _tag: 'Present'; readonly decision: Decision }
  | { readonly _tag: 'Unreadable' };

/**
 * {@link stored}, with the ways it can fail folded into the answer.
 *
 * `stored` is the honest primitive and keeps failing, because the command that
 * is *about* this file should be able to say what is wrong with it. Everything
 * else reads it through here: whether usage data may be sent is not a question
 * any other command is entitled to fail over.
 */
export const recorded: Effect.Effect<
  Recorded,
  never,
  FileSystem.FileSystem | Path.Path | ConfigDirectory
> = stored.pipe(
  Effect.map(
    Option.match({
      onNone: (): Recorded => ({ _tag: 'Absent' }),
      onSome: (decision): Recorded => ({ _tag: 'Present', decision }),
    }),
  ),
  Effect.catchCause(() => Effect.succeed<Recorded>({ _tag: 'Unreadable' })),
);

// Writes the decision so that a run cut short leaves either the old one or the new one, and never half of either.
// Written beside the target and renamed over it: `rename` within a directory is atomic, and a neighbour is guaranteed to be on the same filesystem, which a system temp directory is not. Writing in place would be the more obvious thing and the wrong one — `stored` refuses to guess at a file it cannot parse, so a torn write does not degrade to re-asking the question, it wedges every later run until someone finds the file and deletes it.
// The layout is `JSON.stringify`'s, but the field encoding is the schema's: this is a file a user is invited to open, so it is worth indenting, and that is a presentational choice rather than licence to hand-roll the contents.
const persist = (decision: Decision) =>
  Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem;
    const crypto = yield* Crypto.Crypto;
    const { directory, file } = yield* decisionFile;

    const encoded = yield* encodeDecision(decision);
    const temporary = `${file}.${yield* crypto.randomUUIDv4}.tmp`;

    yield* fileSystem.makeDirectory(directory, { recursive: true });
    yield* fileSystem.writeFileString(temporary, `${JSON.stringify(encoded, null, 2)}\n`).pipe(
      Effect.andThen(fileSystem.rename(temporary, file)),
      // A failed write must not leave its scratch file behind, and a failure to clean up is not worth reporting over whatever actually went wrong.
      Effect.onError(() => Effect.ignore(fileSystem.remove(temporary, { force: true }))),
    );
  });

/**
 * What is collected and what never is, stated in full.
 *
 * Every claim here is enforced by construction rather than by care: only an
 * error's tag is ever recorded, so there is no free text in which a path or a
 * workspace name could travel.
 *
 * Shared by the prompt that asks and the command that explains, so a reader who
 * consented months ago sees the same wording they agreed to.
 */
export const collected: ReadonlyArray<string> = [
  '    Sent      which command ran, whether it succeeded, how long it took,',
  '              the kind of error when it fails, which options you picked',
  '              from a fixed list of choices, and the Falkara, Node and',
  '              operating system versions.',
  '    Never     file contents, file paths, workspace names, or anything you',
  '              type. Error messages are not sent, only the kind of error.',
];

// The way back out is the file, and the command only where there is one to name. A binary run straight from a registry is never on the user's path, so the name it answers to is not something that user can type, while the file is an instruction that holds however the binary was reached.
const notice = (file: string, settings: string | undefined) =>
  [
    '  Falkara can send anonymous usage data to help us find what breaks.',
    '',
    ...collected,
    '',
    settings === undefined
      ? `  Change this any time by deleting ${file}.`
      : `  Change this any time with \`${settings}\`, or by deleting ${file}.`,
    `  Details: ${privacyPolicy}`,
    '',
  ].join('\n');

/**
 * Records a decision, keeping the installation's identity across changes of
 * mind so that toggling telemetry twice does not read as two installations.
 *
 * An unreadable file is replaced rather than repaired. Overwriting a decision
 * would normally be exactly the wrong thing, but this only runs when the user
 * has just said what they want it to be, and refusing would leave them with a
 * setting they cannot change except by finding the file themselves.
 *
 * @param granted Whether usage data may be sent from now on.
 */
export const decide = (granted: boolean) =>
  Effect.gen(function* () {
    const existing = yield* recorded;
    const crypto = yield* Crypto.Crypto;
    const decidedAt = yield* DateTime.now;

    const installId =
      existing._tag === 'Present' ? existing.decision.installId : yield* crypto.randomUUIDv4;

    const decision: Decision = { granted, decidedAt, installId };

    yield* persist(decision);
    return decision;
  });

// Asks and records the answer. Defaults to declining: consent that comes from someone hitting return is not consent. Only reached when a terminal is present, so the answer is always a person's.
const ask = Effect.gen(function* () {
  const granted = yield* Prompt.confirm({
    message: 'Send anonymous usage data?',
    initial: false,
  });

  yield* decide(granted);
});

/**
 * Ensures the question has been put to the user.
 *
 * Asked once and only where there is someone to answer: a pipe or a CI job is
 * told nothing and records nothing, and crucially no decision is written for
 * them, so the question survives until it reaches a terminal. A refusal that
 * the user never actually gave would be the one outcome worse than not asking.
 *
 * A file that cannot be read is left alone. Re-asking would risk overwriting a
 * real answer on the strength of a transient read error, and failing would let
 * a damaged telemetry file stop someone from scaffolding a workspace — which is
 * precisely the trade telemetry never gets to make. The settings command is
 * where that file gets explained and fixed.
 *
 * Answers nothing, because there is nothing a caller could do with the answer:
 * whether this run exports anything was settled before it started, when
 * `Tracing.layer` chose a tracer. Consent given here covers the next run.
 *
 * @param settings What the user types to revisit the decision, where the
 * binary doing the asking is one they can invoke by name.
 */
export const ensureAsked = (settings?: string) =>
  Effect.gen(function* () {
    const existing = yield* recorded;
    if (existing._tag !== 'Absent') {
      return;
    }

    const { canPrompt } = yield* Capabilities;
    if (!canPrompt) {
      return;
    }

    const { file } = yield* decisionFile;

    // Written as output rather than logged: this is copy the user has to read before answering, not a diagnostic that a log level may filter away.
    yield* Console.log(notice(file, settings));
    yield* ask;
  });
