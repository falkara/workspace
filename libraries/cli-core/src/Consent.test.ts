import { NodeServices } from '@effect/platform-node';
import { Cause, Effect, Exit, FileSystem, Option, PlatformError } from 'effect';
import { describe, expect, it } from 'vite-plus/test';
import * as Consent from '#src/Consent.ts';
import * as Paths from '#src/Paths.ts';

type ConsentServices = FileSystem.FileSystem | Paths.ConfigDirectory | NodeServices.NodeServices;

/**
 * Every case runs against a real filesystem in a temporary directory, with the
 * config directory fixed to it.
 *
 * Nothing here consults the environment or the host, so no case can reach the
 * directory this machine actually keeps its decision in.
 */
const withConfigDirectory = <A, E>(
  use: Effect.Effect<A, E, ConsentServices>,
): Promise<Exit.Exit<A, E | PlatformError.PlatformError>> =>
  Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem;
    const scratch = yield* fileSystem.makeTempDirectoryScoped({ prefix: 'falkara-consent-' });
    return yield* use.pipe(Effect.provide(Paths.layerOf(scratch)));
  }).pipe(Effect.scoped, Effect.exit, Effect.provide(NodeServices.layer), Effect.runPromise);

const succeeds = async <A, E>(use: Effect.Effect<A, E, ConsentServices>): Promise<A> => {
  const exit = await withConfigDirectory(use);
  if (Exit.isFailure(exit)) {
    throw new Error(`expected success, got: ${Cause.pretty(exit.cause)}`);
  }
  return exit.value;
};

const corrupt = (contents: string) =>
  Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem;
    const { directory, file } = yield* Consent.decisionFile;
    yield* fileSystem.makeDirectory(directory, { recursive: true });
    yield* fileSystem.writeFileString(file, contents);
  });

describe('recorded', () => {
  it('reads as never asked when no decision has been written', async () => {
    const recorded = await succeeds(Consent.recorded);

    expect(recorded._tag).toBe('Absent');
  });

  it('reads back a decision that was made', async () => {
    const recorded = await succeeds(Effect.andThen(Consent.decide(true), () => Consent.recorded));

    expect(recorded._tag).toBe('Present');
    if (recorded._tag === 'Present') {
      expect(recorded.decision.granted).toBe(true);
    }
  });

  // A damaged file is not a decision to decline, and treating it as one would re-ask someone who already answered.
  it('distinguishes a damaged decision from an absent one', async () => {
    const recorded = await succeeds(Effect.andThen(corrupt('{ not json'), () => Consent.recorded));

    expect(recorded._tag).toBe('Unreadable');
  });

  it('rejects a decision whose timestamp cannot be parsed', async () => {
    const recorded = await succeeds(
      Effect.andThen(
        corrupt('{"granted":true,"decidedAt":"whenever","installId":"abc"}'),
        () => Consent.recorded,
      ),
    );

    expect(recorded._tag).toBe('Unreadable');
  });
});

describe('stored', () => {
  // `recorded` folds every failure into an answer; this is the primitive the telemetry command needs in order to say what is wrong with the file.
  it('fails on a damaged file rather than answering', async () => {
    const exit = await withConfigDirectory(
      Effect.andThen(corrupt('{ not json'), () => Consent.stored),
    );

    expect(Exit.isFailure(exit)).toBe(true);
  });

  it('answers None when no decision has been written', async () => {
    expect(Option.isNone(await succeeds(Consent.stored))).toBe(true);
  });
});

describe('decide', () => {
  it('keeps the installation identity across a change of mind', async () => {
    const [granted, declined] = await succeeds(
      Effect.gen(function* () {
        const first = yield* Consent.decide(true);
        const second = yield* Consent.decide(false);
        return [first, second] as const;
      }),
    );

    expect(granted.granted).toBe(true);
    expect(declined.granted).toBe(false);
    expect(declined.installId).toBe(granted.installId);
  });

  it('replaces a decision that could not be read rather than failing on it', async () => {
    const decision = await succeeds(
      Effect.andThen(corrupt('{ not json'), () => Consent.decide(true)),
    );

    expect(decision.granted).toBe(true);
  });

  it('leaves no scratch file beside the decision', async () => {
    const remaining = await succeeds(
      Effect.gen(function* () {
        yield* Consent.decide(true);
        const fileSystem = yield* FileSystem.FileSystem;
        const { directory } = yield* Consent.decisionFile;
        return yield* fileSystem.readDirectory(directory);
      }),
    );

    expect(remaining).toEqual(['telemetry.json']);
  });

  it('writes a file a person can open', async () => {
    const contents = await succeeds(
      Effect.gen(function* () {
        yield* Consent.decide(true);
        const fileSystem = yield* FileSystem.FileSystem;
        const { file } = yield* Consent.decisionFile;
        return yield* fileSystem.readFileString(file);
      }),
    );

    expect(contents.endsWith('\n')).toBe(true);
    expect(JSON.parse(contents)).toMatchObject({ granted: true });
  });
});
