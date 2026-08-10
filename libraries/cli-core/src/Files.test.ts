import { NodeServices } from '@effect/platform-node';
import { Cause, Effect, Exit, FileSystem, Option, PlatformError } from 'effect';
import { describe, expect, it } from 'vite-plus/test';
import * as Files from '#src/Files.ts';

/**
 * Every case runs against a real filesystem in a temporary directory.
 *
 * A stub would be quicker and would prove nothing: what this module is for is
 * the behaviour of `rename`, of exclusive creation, and of removing a directory
 * that turned out not to be empty. Those are the filesystem's semantics, and a
 * test double would simply restate whatever this module already assumes.
 */
const withScratch = <A, E>(
  use: (root: string) => Effect.Effect<A, E, FileSystem.FileSystem | NodeServices.NodeServices>,
): Promise<Exit.Exit<A, E | PlatformError.PlatformError>> =>
  Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem;
    const scratch = yield* fileSystem.makeTempDirectoryScoped({ prefix: 'falkara-files-' });
    return yield* use(scratch);
  }).pipe(Effect.scoped, Effect.exit, Effect.provide(NodeServices.layer), Effect.runPromise);

const succeeds = async <A, E>(
  use: (root: string) => Effect.Effect<A, E, FileSystem.FileSystem | NodeServices.NodeServices>,
): Promise<A> => {
  const exit = await withScratch(use);
  if (Exit.isFailure(exit)) {
    throw new Error(`expected success, got: ${Cause.pretty(exit.cause)}`);
  }
  return exit.value;
};

/**
 * The typed failure an exit carries, if it failed for a reason of its own.
 */
const failure = <A, E>(exit: Exit.Exit<A, E>): E | undefined =>
  Exit.isFailure(exit) ? Option.getOrUndefined(Cause.findErrorOption(exit.cause)) : undefined;

const read = (path: string) =>
  Effect.flatMap(FileSystem.FileSystem, (fs) => fs.readFileString(path));
const exists = (path: string) => Effect.flatMap(FileSystem.FileSystem, (fs) => fs.exists(path));
const write = (path: string, contents: string) =>
  Effect.flatMap(FileSystem.FileSystem, (fs) => fs.writeFileString(path, contents));
const list = (path: string) =>
  Effect.flatMap(FileSystem.FileSystem, (fs) => fs.readDirectory(path));

const file = (path: string, contents: string, onConflict?: Files.OnConflict): Files.File => ({
  path,
  contents,
  ...(onConflict === undefined ? {} : { onConflict }),
});

describe('plan', () => {
  it('refuses a path that climbs out of the root', async () => {
    const result = await succeeds((root) =>
      Effect.exit(Files.plan(`${root}/target`, [file('../escaped.txt', 'x')])),
    );

    expect(failure(result)?._tag).toBe('Escapes');
  });

  it('refuses an absolute path', async () => {
    const result = await succeeds((root) =>
      Effect.exit(Files.plan(`${root}/target`, [file('/etc/hosts', 'x')])),
    );

    expect(Exit.isFailure(result)).toBe(true);
  });

  it('refuses a path naming the root itself', async () => {
    const result = await succeeds((root) =>
      Effect.exit(Files.plan(`${root}/target`, [file('.', 'x')])),
    );

    expect(Exit.isFailure(result)).toBe(true);
  });

  it('refuses two entries that differ only by case, on any host', async () => {
    const result = await succeeds((root) =>
      Effect.exit(Files.plan(`${root}/target`, [file('Model.ts', 'a'), file('model.ts', 'b')])),
    );

    const error = failure(result);
    expect(error?._tag).toBe('Collides');
    if (error?._tag === 'Collides') {
      expect(error.claimedBy).toBe('Model.ts');
    }
  });

  it('keeps nested paths, relative to the root', async () => {
    const planned = await succeeds((root) =>
      Files.plan(`${root}/target`, [file('src/deep/mod.ts', 'x')]),
    );

    expect(planned.targets).toHaveLength(1);
    expect(planned.targets[0]?.path.split(/[\\/]/)).toEqual(['src', 'deep', 'mod.ts']);
    expect(planned.targets[0]?.onConflict).toBe('fail');
  });
});

describe('survey', () => {
  it('reports every entry as a creation when the root does not exist', async () => {
    const surveyed = await succeeds((root) =>
      Effect.flatMap(
        Files.plan(`${root}/target`, [file('a.txt', 'a'), file('b/c.txt', 'c')]),
        (p) => Files.survey(p),
      ),
    );

    expect(surveyed.rootExists).toBe(false);
    expect(surveyed.planned.map((entry) => entry.disposition)).toEqual(['create', 'create']);
  });

  it('refuses an occupied destination before writing anything', async () => {
    const result = await succeeds((root) =>
      Effect.gen(function* () {
        yield* write(`${root}/a.txt`, 'existing');
        const planned = yield* Files.plan(root, [file('a.txt', 'replacement')]);
        return yield* Effect.exit(Files.survey(planned));
      }),
    );

    expect(failure(result)?._tag).toBe('Occupied');
  });

  it('honours skip and overwrite policies', async () => {
    const surveyed = await succeeds((root) =>
      Effect.gen(function* () {
        yield* write(`${root}/keep.txt`, 'old');
        yield* write(`${root}/replace.txt`, 'old');
        const planned = yield* Files.plan(root, [
          file('keep.txt', 'new', 'skip'),
          file('replace.txt', 'new', 'overwrite'),
          file('fresh.txt', 'new'),
        ]);
        return yield* Files.survey(planned);
      }),
    );

    expect(surveyed.rootExists).toBe(true);
    expect(surveyed.planned.map((entry) => entry.disposition)).toEqual([
      'skip',
      'overwrite',
      'create',
    ]);
  });
});

describe('apply, into a root that does not exist', () => {
  it('writes every file, creating the directories they need', async () => {
    const contents = await succeeds((root) =>
      Effect.gen(function* () {
        const target = `${root}/target`;
        const planned = yield* Files.plan(target, [
          file('README.md', '# hello'),
          file('src/deep/mod.ts', 'export {};'),
        ]);
        yield* Files.apply(planned);
        return {
          readme: yield* read(`${target}/README.md`),
          module: yield* read(`${target}/src/deep/mod.ts`),
        };
      }),
    );

    expect(contents.readme).toBe('# hello');
    expect(contents.module).toBe('export {};');
  });

  it('leaves no root at all when a write fails partway', async () => {
    // The second entry names a path the first has already made a directory, so its exclusive create fails after some of the tree is on disk.
    const outcome = await succeeds((root) =>
      Effect.gen(function* () {
        const target = `${root}/target`;
        const planned = yield* Files.plan(target, [
          file('sub/a.txt', 'a'),
          file('sub', 'collides with the directory above'),
        ]);
        const result = yield* Effect.exit(Files.apply(planned));
        return {
          failed: Exit.isFailure(result),
          rootExists: yield* exists(target),
          scratchEntries: yield* list(root),
        };
      }),
    );

    expect(outcome.failed).toBe(true);
    expect(outcome.rootExists).toBe(false);
    // No staging directory left behind either.
    expect(outcome.scratchEntries).toEqual([]);
  });
});

describe('apply, into a root that already exists', () => {
  it('creates, replaces and skips as the survey said it would', async () => {
    const contents = await succeeds((root) =>
      Effect.gen(function* () {
        yield* write(`${root}/keep.txt`, 'old');
        yield* write(`${root}/replace.txt`, 'old');
        const planned = yield* Files.plan(root, [
          file('keep.txt', 'new', 'skip'),
          file('replace.txt', 'new', 'overwrite'),
          file('nested/fresh.txt', 'new'),
        ]);
        yield* Files.apply(planned);
        return {
          keep: yield* read(`${root}/keep.txt`),
          replace: yield* read(`${root}/replace.txt`),
          fresh: yield* read(`${root}/nested/fresh.txt`),
          entries: yield* list(root),
        };
      }),
    );

    expect(contents.keep).toBe('old');
    expect(contents.replace).toBe('new');
    expect(contents.fresh).toBe('new');
    // The backup taken to make the replacement recoverable is not left behind.
    expect([...contents.entries].sort()).toEqual(['keep.txt', 'nested', 'replace.txt']);
  });

  it('undoes everything it did when a write fails partway', async () => {
    const outcome = await succeeds((root) =>
      Effect.gen(function* () {
        yield* write(`${root}/keep.txt`, 'original');
        const planned = yield* Files.plan(root, [
          file('keep.txt', 'replacement', 'overwrite'),
          file('sub/a.txt', 'a'),
          file('sub', 'collides with the directory above'),
        ]);
        const result = yield* Effect.exit(Files.apply(planned));
        return {
          failed: Exit.isFailure(result),
          keep: yield* read(`${root}/keep.txt`),
          entries: yield* list(root),
        };
      }),
    );

    expect(outcome.failed).toBe(true);
    // The replacement was rolled back, not merely abandoned halfway.
    expect(outcome.keep).toBe('original');
    // The created file, the directory created for it, and every backup and scratch file taken along the way are all gone.
    expect([...outcome.entries].sort()).toEqual(['keep.txt']);
  });
});
