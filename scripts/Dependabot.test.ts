import { NodeServices } from '@effect/platform-node';
import { expect, layer } from '@effect/vitest';
import Ajv from 'ajv';
import { Context, Effect, FileSystem, Layer, Path, Schema } from 'effect';
import { Yaml } from 'effect/unstable/encoding';
import ConventionalCommits from '@commitlint/config-conventional';
import DependabotSchema from './schemas/dependabot-2.0.json' with { type: 'json' };

// What a valid file is, is not this repository's opinion to hold: the vendored copy of the published `dependabot-2.0` document is the contract, and everything asserted below it is policy layered on top.
const ajv = new Ajv({ allErrors: true });

// SchemaStore annotates its enums for editor tooling. The keyword carries no validation, and declaring it is what lets the rest of the document be read under strict mode rather than turning strictness off wholesale.
ajv.addVocabulary(['x-intellij-enum-metadata']);

// Names the fields the assertions below read, and nothing more: the document above is what decides whether the file is valid, so this constrains none of them.
type Declared = {
  readonly version: number;
  readonly updates: ReadonlyArray<{
    readonly 'package-ecosystem': string;
    readonly directory?: string;
    readonly schedule: Record<string, string>;
    readonly 'commit-message'?: { readonly prefix?: string };
    readonly labels?: ReadonlyArray<string>;
  }>;
};

const validate = ajv.compile<Declared>(DependabotSchema);

/**
 * A `dependabot.yaml` the published schema rejects.
 *
 * Carries every violation rather than the first, because a configuration that
 * drifted has usually drifted in more than one place — the ecosystems are
 * declared twice and edited together.
 */
class Invalid extends Schema.TaggedError<Invalid>('Dependabot/Invalid')('Invalid', {
  violations: Schema.Array(Schema.String),
}) {
  /**
   * Names the document that rejected the file, so the failure says which
   * contract was not met rather than only how.
   */
  override get message(): string {
    return `dependabot.yaml does not satisfy ${DependabotSchema.$id}`;
  }
}

/**
 * An ecosystem the pipeline expects to be watched, that nothing watches.
 */
class Unwatched extends Schema.TaggedError<Unwatched>('Dependabot/Unwatched')('Unwatched', {
  ecosystem: Schema.String,
}) {}

/**
 * The validated configuration, read once for the whole suite.
 *
 * A `Service` rather than a value read at module scope: the file has to be
 * fetched through `FileSystem` to be fetched the way the rest of this
 * repository fetches anything, and that is an effect, so the thing it produces
 * is a layer.
 */
class Configuration extends Context.Service<Configuration, Declared>()(
  'Dependabot/Configuration',
) {}

// Resolved through `Path` rather than assembled as a string, so the one part of this that Effect models goes through Effect on Windows too.
const inGitHubDirectory = Effect.fnUntraced(function* (file: string) {
  const path = yield* Path.Path;
  return yield* path.fromFileUrl(new URL(`../.github/${file}`, import.meta.url));
});

const read = Effect.fnUntraced(function* (file: string) {
  const filesystem = yield* FileSystem.FileSystem;
  return yield* filesystem.readFileString(yield* inGitHubDirectory(file));
});

// Validation is itself the structural assertion: the layer fails, and no test in the suite runs, on a file GitHub would reject.
const layerConfiguration = Layer.effect(Configuration)(
  Effect.gen(function* () {
    const parsed = Yaml.parse(yield* read('dependabot.yaml'));

    if (validate(parsed)) {
      return parsed;
    }

    return yield* new Invalid({
      violations: (validate.errors ?? []).map(
        (error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`,
      ),
    });
  }),
);

const updateFor = Effect.fnUntraced(function* (ecosystem: string) {
  const configuration = yield* Configuration;
  const update = configuration.updates.find(
    (candidate) => candidate['package-ecosystem'] === ecosystem,
  );

  return update === undefined ? yield* new Unwatched({ ecosystem }) : update;
});

// The `Dependencies` workflow drives a pull request through a label state machine, and hands the first transition — `Queued` to `Dispatched` — to `gh pr edit` the moment Dependabot opens one. A pull request that opens under any other label enters that machine in a state no job removes.
const queued = 'Dependencies | Queued';

const [, , conventionalTypes] = ConventionalCommits.rules['type-enum'];

layer(layerConfiguration.pipe(Layer.provideMerge(NodeServices.layer)))('Dependabot', (it) => {
  it.effect('is configured where GitHub looks for it', () =>
    Effect.gen(function* () {
      const filesystem = yield* FileSystem.FileSystem;

      expect(yield* filesystem.exists(yield* inGitHubDirectory('dependabot.yaml'))).toBe(true);
    }),
  );

  it.effect('speaks the only configuration version still served', () =>
    Effect.gen(function* () {
      expect((yield* Configuration).version).toBe(2);
    }),
  );

  it.effect('starts a pull request in the state the Dependencies workflow transitions from', () =>
    Effect.gen(function* () {
      expect(yield* read('workflows/dependencies.yaml')).toContain(queued);
    }),
  );

  it.effect('watches every ecosystem this repository actually vendors', () =>
    Effect.gen(function* () {
      const configuration = yield* Configuration;

      expect(configuration.updates.map((update) => update['package-ecosystem'])).toEqual([
        'npm',
        'github-actions',
      ]);
    }),
  );

  for (const ecosystem of ['npm', 'github-actions']) {
    it.effect(`${ecosystem} watches the workspace root, where every manifest resolves from`, () =>
      Effect.gen(function* () {
        expect((yield* updateFor(ecosystem)).directory).toBe('/');
      }),
    );

    // One weekly batch, so a week's updates arrive as a single review pass rather than trickling in. Dependabot reads the hour as UTC unless a zone is named, so the zone is what makes it mean midnight here.
    it.effect(`${ecosystem} runs at midnight every Monday`, () =>
      Effect.gen(function* () {
        expect((yield* updateFor(ecosystem)).schedule).toEqual({
          interval: 'weekly',
          day: 'monday',
          time: '00:00',
          timezone: 'Europe/Prague',
        });
      }),
    );

    // commitlint gates every commit in this repository, and a Dependabot commit is not exempt.
    it.effect(`${ecosystem} prefixes the commit with a type commitlint accepts`, () =>
      Effect.gen(function* () {
        const prefix = (yield* updateFor(ecosystem))['commit-message']?.prefix;

        expect(prefix).toBe('chore');
        expect(conventionalTypes).toContain(prefix);
      }),
    );

    it.effect(`${ecosystem} labels the pull request into the adoption pipeline`, () =>
      Effect.gen(function* () {
        expect((yield* updateFor(ecosystem)).labels).toEqual([queued]);
      }),
    );
  }
});
