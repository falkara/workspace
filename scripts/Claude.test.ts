import { NodeServices } from '@effect/platform-node';
import { expect, layer } from '@effect/vitest';
import Ajv from 'ajv';
import { Context, Effect, FileSystem, Layer, Path, Schema } from 'effect';
import { Yaml } from 'effect/unstable/encoding';
import PackageManifest from '../package.json' with { type: 'json' };
import WorkflowSchema from './schemas/github-workflow.json' with { type: 'json' };

// What a valid workflow is, is GitHub's to say, not this repository's: the vendored copy of the published `github-workflow` document is the contract, and everything asserted below it is policy layered on top.
// `strictTypes` is off because SchemaStore omits `type` alongside `properties` in places, and the logger because the same document trips a 1-tuple `items` warning on every compile. Both are remarks about how that document is written, not about the workflow being read.
const ajv = new Ajv({ allErrors: true, strictTypes: false, logger: false });

// Names the fields the assertions below read, and nothing more: the document above is what decides whether the workflow is valid, so this constrains none of them.
type Declared = {
  readonly name: string;
  readonly on: Record<string, unknown>;
  readonly jobs: Record<
    string,
    {
      readonly if?: string;
      readonly 'runs-on': string;
      readonly steps?: ReadonlyArray<{
        readonly uses?: string;
        readonly with?: Record<string, string>;
      }>;
    }
  >;
};

const validate = ajv.compile<Declared>(WorkflowSchema);

/**
 * A workflow the published schema rejects.
 */
class Invalid extends Schema.TaggedError<Invalid>('Claude/Invalid')('Invalid', {
  violations: Schema.Array(Schema.String),
}) {
  override get message(): string {
    return 'claude.yaml does not satisfy https://json.schemastore.org/github-workflow.json';
  }
}

/**
 * The validated workflow, alongside the text it was read from.
 *
 * The text is kept because a YAML parser discards comments, and the version a
 * pinned commit claims to be is written as one.
 */
class Workflow extends Context.Service<
  Workflow,
  {
    readonly declared: Declared;
    readonly text: string;
  }
>()('Claude/Workflow') {}

const layerWorkflow = Layer.effect(Workflow)(
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const filesystem = yield* FileSystem.FileSystem;
    const text = yield* filesystem.readFileString(
      yield* path.fromFileUrl(new URL('../.github/workflows/claude.yaml', import.meta.url)),
    );
    const parsed = Yaml.parse(text);

    if (validate(parsed)) {
      return { declared: parsed, text };
    }

    return yield* new Invalid({
      violations: (validate.errors ?? []).map(
        (error) => `${error.instancePath || '/'} ${error.message ?? 'is invalid'}`,
      ),
    });
  }),
);

const jobs = Effect.gen(function* () {
  const { declared } = yield* Workflow;
  return Object.values(declared.jobs);
});

const steps = Effect.gen(function* () {
  return (yield* jobs).flatMap((job) => job.steps ?? []);
});

// Anyone can comment on a public repository, and this workflow answers comments with `contents: write`. The association check is the whole of what stands between a drive-by comment and a job that can push.
const trusted = ['OWNER', 'MEMBER', 'COLLABORATOR'];

layer(layerWorkflow.pipe(Layer.provideMerge(NodeServices.layer)))('Claude workflow', (it) => {
  it.effect('answers only the events a person can trigger by commenting', () =>
    Effect.gen(function* () {
      const { declared } = yield* Workflow;

      expect(Object.keys(declared.on).toSorted()).toEqual([
        'issue_comment',
        'pull_request_review',
        'pull_request_review_comment',
      ]);
    }),
  );

  it.effect('runs no job for a comment from outside the repository', () =>
    Effect.gen(function* () {
      for (const job of yield* jobs) {
        for (const association of trusted) {
          expect(job.if).toContain(association);
        }
      }
    }),
  );

  // The schema requires only `runs-on`, so a job with nothing to do satisfies it.
  it.effect('gives every job something to run', () =>
    Effect.gen(function* () {
      for (const job of yield* jobs) {
        expect(job.steps ?? []).not.toHaveLength(0);
      }
    }),
  );

  // A tag is a moving target: whoever can move it can change what runs here, with the permissions above.
  it.effect('pins every action to a commit', () =>
    Effect.gen(function* () {
      for (const step of yield* steps) {
        expect(step.uses).toMatch(/^[^@]+@[0-9a-f]{40}$/);
      }
    }),
  );

  // A bare commit says nothing about what it is. The comment is what makes the pin auditable, and it is the form Dependabot both writes and reads.
  it.effect('records the version each commit stands for', () =>
    Effect.gen(function* () {
      const { text } = yield* Workflow;
      const pins = text.match(/uses:.*/g) ?? [];

      expect(pins).not.toHaveLength(0);

      for (const pin of pins) {
        expect(pin).toMatch(/@[0-9a-f]{40} # v\d+\.\d+\.\d+$/);
      }
    }),
  );

  // CI installing a different Node than the one this repository requires is a difference that shows up as an unreproducible failure rather than as a version mismatch.
  it.effect('sets up the Node this repository requires', () =>
    Effect.gen(function* () {
      const setup = (yield* steps).find((step) => step.uses?.startsWith('actions/setup-node@'));

      expect(setup?.with?.['node-version']).toBe(PackageManifest.devEngines.runtime.version);
    }),
  );

  // An unpinned model makes the job's behaviour change under it without a commit.
  it.effect('pins the model Claude runs as', () =>
    Effect.gen(function* () {
      const action = (yield* steps).find((step) =>
        step.uses?.startsWith('anthropics/claude-code-action@'),
      );

      expect(action?.with?.claude_args).toContain('--model claude-opus-5');
    }),
  );
});
