import { Crypto, Data, Effect, Exit, FileSystem, Path, PlatformError, Runtime } from 'effect';
import type { Guiding } from '#src/Guidance.ts';
import type { Severity } from '#src/Ui.ts';
import { Ui } from '#src/Ui.ts';

/**
 * Everything a Falkara command writes, and the only way it writes it.
 *
 * The counterpart to `Ui`: that module is all a command says, this is all a
 * command puts on disk. Both exist for the same reason — the decision is made
 * once, in one place, rather than at every call site where it would eventually
 * be made differently.
 *
 * The shape is a *plan* built as a value, surveyed against the disk, and only
 * then committed. That order is what makes `--dry-run` honest: a preview and a
 * real run are the same {@link plan} and the same {@link survey}, so a preview
 * that promises twelve files and a run that then refuses on the thirteenth
 * cannot happen. A boolean threaded down to each write would be the obvious
 * shape and the wrong one — it puts the branch next to the `writeFileString`,
 * which is precisely where someone eventually forgets it.
 */

/**
 * What to do when something is already at a destination.
 *
 * `fail` is the default everywhere. A generator that silently replaced a file
 * someone had edited would be indistinguishable from one that worked.
 */
export type OnConflict = 'fail' | 'skip' | 'overwrite';

/** One file a command intends to write, named relative to the plan's root. */
export interface File {
  readonly path: string;
  readonly contents: string;
  /** Permission bits, for the generated file that has to be executable. */
  readonly mode?: number | undefined;
  /** Defaults to `fail`. */
  readonly onConflict?: OnConflict | undefined;
}

/** A {@link File} with its path resolved and its policy settled. */
export interface Target {
  /** Relative to the root, for anything shown to a person. */
  readonly path: string;
  readonly absolute: string;
  readonly contents: string;
  readonly mode: number | undefined;
  readonly onConflict: OnConflict;
}

/**
 * A validated set of writes, all beneath one root.
 *
 * Only constructible through {@link plan}, so every `Plan` in existence has
 * already been checked for the two ways a generated set of paths goes wrong.
 */
export interface Plan {
  /** Absolute, resolved once so nothing downstream depends on the cwd. */
  readonly root: string;
  readonly targets: ReadonlyArray<Target>;
}

/**
 * A planned path that does not name a file inside the root: it climbs out with
 * `..`, it is absolute, or it names the root itself.
 *
 * Checked rather than assumed because path segments in a generator are usually
 * derived from something — a module name, a route, a schema field — and the
 * moment one of them is user-supplied, `../../.ssh/authorized_keys` is a path
 * the templating engine will build without complaint.
 */
export class Escapes extends Data.TaggedError('Escapes')<{
  readonly path: string;
}> {}

/**
 * Two planned files that name the same destination.
 *
 * Compared case-insensitively regardless of host, on the same principle that
 * refuses path-hostile characters: a plan containing both `Model.ts` and
 * `model.ts` writes two files on Linux and one on macOS, and a generator whose
 * output depends on the developer's filesystem is broken on both.
 */
export class Collides extends Data.TaggedError('Collides')<{
  readonly path: string;
  /** The path already claiming that destination. */
  readonly claimedBy: string;
}> {}

/**
 * Something is already where a file was to be written, and the policy for it
 * was `fail`.
 *
 * A user mistake rather than a crash, so it carries its own guidance and tells
 * the runtime not to log it a second time as an unhandled failure.
 */
export class Occupied
  extends Data.TaggedError('Occupied')<{
    readonly path: string;
    readonly root: string;
  }>
  implements Guiding
{
  override readonly [Runtime.errorReported] = false;

  get guidance(): string {
    return (
      `${this.path} already exists in ${this.root}. ` +
      'Re-run with --force to replace it, or choose an empty directory.'
    );
  }
}

/**
 * Validates a set of writes against a root.
 *
 * Both failures are bugs in whatever built the list rather than anything a user
 * can act on, which is why they are raised here — once, before the disk is
 * touched — instead of surfacing as a half-written tree.
 */
export const plan = (
  root: string,
  files: ReadonlyArray<File>,
): Effect.Effect<Plan, Escapes | Collides, Path.Path> =>
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const base = path.resolve(root);
    const prefix = `${base}${path.sep}`;

    const targets: Array<Target> = [];
    const claimed = new Map<string, string>();

    for (const file of files) {
      const absolute = path.resolve(base, file.path);
      if (!absolute.startsWith(prefix)) {
        return yield* Effect.fail(new Escapes({ path: file.path }));
      }

      const destination = absolute.toLowerCase();
      const claimant = claimed.get(destination);
      if (claimant !== undefined) {
        return yield* Effect.fail(new Collides({ path: file.path, claimedBy: claimant }));
      }
      claimed.set(destination, file.path);

      targets.push({
        path: path.relative(base, absolute),
        absolute,
        contents: file.contents,
        mode: file.mode,
        onConflict: file.onConflict ?? 'fail',
      });
    }

    return { root: base, targets };
  });

/** What committing a plan will do to one destination. */
export type Disposition = 'create' | 'overwrite' | 'skip';

export interface Planned {
  readonly target: Target;
  readonly disposition: Disposition;
}

/**
 * A plan measured against the disk as it currently is.
 *
 * `rootExists` is carried because it decides how the plan can be committed at
 * all, and asking twice is how the survey and the commit come to disagree about
 * which strategy is in force.
 */
export interface Survey {
  readonly root: string;
  readonly rootExists: boolean;
  readonly planned: ReadonlyArray<Planned>;
}

/**
 * Works out what a plan would do, and refuses it now if it would refuse it
 * later.
 *
 * Every conflict in the whole plan is found before any of it is written, so the
 * failure mode is "nothing happened, here is why" rather than "four files in,
 * here is why".
 */
export const survey = (
  plan: Plan,
): Effect.Effect<Survey, Occupied | PlatformError.PlatformError, FileSystem.FileSystem> =>
  Effect.gen(function* () {
    const fileSystem = yield* FileSystem.FileSystem;
    const rootExists = yield* fileSystem.exists(plan.root);

    const planned: Array<Planned> = [];

    for (const target of plan.targets) {
      // A root that does not exist cannot contain anything, so the question is
      // settled for the whole plan rather than asked once per file.
      const occupied = rootExists ? yield* fileSystem.exists(target.absolute) : false;

      if (!occupied) {
        planned.push({ target, disposition: 'create' });
        continue;
      }

      switch (target.onConflict) {
        case 'fail':
          return yield* Effect.fail(new Occupied({ path: target.path, root: plan.root }));
        case 'skip':
          planned.push({ target, disposition: 'skip' });
          break;
        case 'overwrite':
          planned.push({ target, disposition: 'overwrite' });
          break;
      }
    }

    return { root: plan.root, rootExists, planned };
  });

/** How a survey reads when nothing is going to be written. */
const previewed = (disposition: Disposition): Severity =>
  disposition === 'overwrite' ? 'warning' : 'info';

const wording = (disposition: Disposition): string => {
  switch (disposition) {
    case 'create':
      return 'would create';
    case 'overwrite':
      return 'would replace';
    case 'skip':
      return 'would leave alone';
  }
};

/**
 * Says what a plan would do, having done none of it.
 *
 * Reported as diagnostics rather than drawn as presentation: what a run would
 * write is the finding, not the ceremony, so it is the part that survives
 * `--quiet` and the part a machine-readable renderer would emit. Replacements
 * are raised to a warning because they are the entries a reader is checking the
 * list for.
 */
export const preview = (surveyed: Survey): Effect.Effect<void, never, Ui> =>
  Effect.gen(function* () {
    const ui = yield* Ui;
    yield* Effect.forEach(
      surveyed.planned,
      ({ target, disposition }) =>
        ui.report({
          severity: previewed(disposition),
          message: wording(disposition),
          subject: target.path,
        }),
      { discard: true },
    );
  });

/**
 * Commits a plan into a root that does not exist yet.
 *
 * The whole tree is built beside the destination and moved into place with one
 * `rename`, which is atomic and which a directory-at-a-time write is not: an
 * interrupted scaffold leaves no directory at all rather than a half-populated
 * one that the next run then has to reason about. The staging directory is a
 * sibling because that is what guarantees the same filesystem, and therefore
 * that the rename is a rename rather than a copy that can fail halfway.
 *
 * Every entry is a `create` here by construction — {@link survey} cannot have
 * found anything to conflict with inside a root that does not exist.
 */
const intoFreshRoot = Effect.fnUntraced(function* (surveyed: Survey) {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const crypto = yield* Crypto.Crypto;

  const parent = path.dirname(surveyed.root);
  const staging = path.join(
    parent,
    `.${path.basename(surveyed.root)}.${yield* crypto.randomUUIDv4}.falkara`,
  );

  // The parent chain is created first and deliberately left behind on failure:
  // an empty directory is not a corrupted workspace, and removing one this run
  // may not have been the only thing to create is worse than leaving it.
  yield* fileSystem.makeDirectory(parent, { recursive: true });

  yield* Effect.onExit(
    Effect.gen(function* () {
      yield* fileSystem.makeDirectory(staging);

      for (const { target } of surveyed.planned) {
        const destination = path.join(staging, target.path);
        yield* fileSystem.makeDirectory(path.dirname(destination), { recursive: true });
        // `wx` rather than `w`: staging is freshly made, so a destination that
        // already exists means two targets resolved to one path, and failing is
        // better than letting the second silently win.
        yield* fileSystem.writeFileString(destination, target.contents, {
          flag: 'wx',
          mode: target.mode,
        });
      }

      yield* fileSystem.rename(staging, surveyed.root);
    }),
    (exit) =>
      Exit.isSuccess(exit)
        ? Effect.void
        : Effect.ignore(fileSystem.remove(staging, { recursive: true, force: true })),
  );
});

/**
 * What has to be undone, and how, if a commit into an existing root fails
 * partway.
 */
type Undo =
  | { readonly _tag: 'RemoveFile'; readonly path: string }
  | { readonly _tag: 'RestoreFile'; readonly path: string; readonly backup: string }
  | { readonly _tag: 'RemoveDirectory'; readonly path: string };

/**
 * Commits a plan into a root that already exists.
 *
 * This is recoverable rather than atomic, and the difference is worth stating
 * plainly: POSIX offers an atomic rename of one path, and nothing that makes
 * many paths change together. So each write is journalled and undone in reverse
 * on failure — created files removed, replaced files moved back, directories
 * this run brought into existence taken away again. A process killed outright
 * mid-commit leaves the journal unplayed and the tree partly written; only a
 * failure or an interrupt this process survives is recovered from.
 *
 * The alternative, staging the merged tree and renaming it over the root, is
 * atomic and wrong: it would take everything already in the root that the plan
 * says nothing about with it.
 */
const intoExistingRoot = Effect.fnUntraced(function* (surveyed: Survey) {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const crypto = yield* Crypto.Crypto;

  const journal: Array<Undo> = [];

  /**
   * Creates the ancestors of a destination, one at a time.
   *
   * Walked rather than left to `makeDirectory({ recursive: true })` so the
   * journal records exactly the directories this run brought into existence,
   * and a rollback removes those and nothing that was already there.
   */
  const ensureAncestors = Effect.fnUntraced(function* (directory: string) {
    const segments = path
      .relative(surveyed.root, directory)
      .split(path.sep)
      .filter((segment) => segment !== '');

    let current = surveyed.root;
    for (const segment of segments) {
      current = path.join(current, segment);
      if (yield* fileSystem.exists(current)) {
        continue;
      }
      yield* fileSystem.makeDirectory(current);
      journal.push({ _tag: 'RemoveDirectory', path: current });
    }
  });

  const commit = Effect.gen(function* () {
    for (const { target, disposition } of surveyed.planned) {
      if (disposition === 'skip') {
        continue;
      }

      yield* ensureAncestors(path.dirname(target.absolute));

      if (disposition === 'create') {
        // `wx` fails if anything appeared between the survey and now, so the
        // promise that nothing existing was touched is kept by the kernel
        // rather than by the gap between a check and a write.
        yield* fileSystem.writeFileString(target.absolute, target.contents, {
          flag: 'wx',
          mode: target.mode,
        });
        journal.push({ _tag: 'RemoveFile', path: target.absolute });
        continue;
      }

      // Written first, moved aside second, swapped in third. Ordered that way
      // so a write that fails — the overwhelmingly likely failure, being the
      // only step that touches the disk in bulk — has disturbed nothing at all.
      const temporary = `${target.absolute}.${yield* crypto.randomUUIDv4}.falkara-tmp`;
      yield* fileSystem.writeFileString(temporary, target.contents, {
        flag: 'wx',
        mode: target.mode,
      });
      journal.push({ _tag: 'RemoveFile', path: temporary });

      const backup = `${target.absolute}.${yield* crypto.randomUUIDv4}.falkara-backup`;
      yield* fileSystem.rename(target.absolute, backup);
      journal.push({ _tag: 'RestoreFile', path: target.absolute, backup });

      yield* fileSystem.rename(temporary, target.absolute);
    }
  });

  // Both are suspended so the journal is read when they run rather than when
  // they are built — by construction time `commit` has not recorded anything
  // yet, and an undo list snapshotted then is empty for ever.
  const rollback = Effect.suspend(() =>
    Effect.forEach(
      journal.slice().reverse(),
      (undo) => {
        switch (undo._tag) {
          case 'RemoveFile':
            return Effect.ignore(fileSystem.remove(undo.path, { force: true }));
          case 'RestoreFile':
            return Effect.ignore(fileSystem.rename(undo.backup, undo.path));
          case 'RemoveDirectory':
            // Emptiness is checked rather than left to `remove` to enforce: a
            // non-recursive remove refuses every directory, empty or not, so
            // relying on it to fail would quietly undo no directory at all.
            // A directory that is no longer empty holds something this run did
            // not put there, and is left exactly as it is.
            return Effect.ignore(
              Effect.flatMap(fileSystem.readDirectory(undo.path), (entries) =>
                entries.length === 0
                  ? fileSystem.remove(undo.path, { recursive: true })
                  : Effect.void,
              ),
            );
        }
      },
      { discard: true },
    ),
  );

  const discardBackups = Effect.suspend(() =>
    Effect.forEach(
      journal,
      (undo) =>
        undo._tag === 'RestoreFile'
          ? Effect.ignore(fileSystem.remove(undo.backup, { force: true }))
          : Effect.void,
      { discard: true },
    ),
  );

  // A finalizer rather than a step after the commit: a fiber interrupted from
  // outside unwinds rather than continuing, and an interrupted half-written
  // tree is exactly what this exists to clean up.
  yield* Effect.onExit(commit, (exit) => (Exit.isSuccess(exit) ? discardBackups : rollback));
});

/**
 * Surveys a plan and commits it, choosing the strongest guarantee the
 * destination allows.
 *
 * Answers the survey it acted on, so a caller can report what it did without
 * measuring the disk a second time and describing a different run.
 */
export const apply = (
  plan: Plan,
): Effect.Effect<
  Survey,
  Occupied | PlatformError.PlatformError,
  FileSystem.FileSystem | Path.Path | Crypto.Crypto
> =>
  Effect.gen(function* () {
    const surveyed = yield* survey(plan);
    yield* surveyed.rootExists ? intoExistingRoot(surveyed) : intoFreshRoot(surveyed);
    return surveyed;
  });
