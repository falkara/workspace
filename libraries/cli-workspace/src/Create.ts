import {
  asPromptValidator,
  suggestName,
  toDirectory,
  validateDirectory,
  validateName,
  validatedBy,
} from '#src/Naming.ts';
import * as Template from '#src/Template.ts';
import { Ask, Consent, Files, Tracing, Ui } from '@falkara/cli-core';
import { Context, Effect, Layer, Option } from 'effect';
import { Flag, Prompt } from 'effect/unstable/cli';

// The first entry is the default: it is what "(recommended)" points at, and what the select highlights when it opens.
const packageManagers = [
  { title: 'Bun (recommended)', value: 'bun' },
  { title: 'Deno', value: 'deno' },
  { title: 'npm', value: 'npm' },
] as const;

/**
 * A package manager a scaffolded workspace can be set up for.
 */
export type PackageManager = (typeof packageManagers)[number]['value'];

const name = Flag.string('name').pipe(
  Flag.withAlias('n'),
  Flag.withDescription('Name of the workspace.'),
  validatedBy('name', validateName),
  Flag.optional,
);

const directory = Flag.string('directory').pipe(
  Flag.withAlias('d'),
  Flag.withDescription('Directory to scaffold the workspace into.'),
  validatedBy('directory', validateDirectory),
  Flag.optional,
);

const packageManager = Flag.choice(
  'package-manager',
  packageManagers.map((entry) => entry.value),
).pipe(Flag.withAlias('p'), Flag.withDescription('Package manager to use.'), Flag.optional);

// `optional` on a boolean flag yields three states: absent (`None`, so ask), `--install` (`Some(true)`) and `--no-install` (`Some(false)`).
const install = Flag.boolean('install').pipe(
  Flag.withDescription('Install dependencies after scaffolding; --no-install to skip.'),
  Flag.optional,
);

// Not an answer to be prompted for, and so not part of `Answers`: it says what to do with the answers rather than supplying one. A run that asked "did you mean it?" would defeat the point of a flag that exists to be deliberate.
const force = Flag.boolean('force').pipe(
  Flag.withAlias('f'),
  Flag.withDescription('Replace files that are already there.'),
);

const dryRun = Flag.boolean('dry-run').pipe(
  Flag.withDescription('Show what would be written, and write none of it.'),
);

// What the invocation said, before anything has been asked. Named rather than inferred so that `resolveAnswers` can be written and read as a function of it, instead of as a closure over whatever `Command.make` happened to hand the handler.
interface Inputs {
  readonly name: Option.Option<string>;
  readonly directory: Option.Option<string>;
  readonly packageManager: Option.Option<PackageManager>;
  readonly install: Option.Option<boolean>;
  readonly force: boolean;
  readonly dryRun: boolean;
}

// What the run will actually do, with every question settled.
interface Answers {
  readonly name: string;
  readonly directory: string;
  readonly packageManager: PackageManager;
  readonly install: boolean;
}

// What the run settled on, and whether settling it involved asking anyone.
interface Resolution {
  readonly answers: Answers;
  readonly prompted: boolean;
}

// Settles every question the scaffolding needs answered. Separate from `execute` because the two fail for unrelated reasons and are interesting to a reader at different times: this half is where the flags, the defaults and the prompts are reconciled and where a run can turn out to be under-specified, and it does nothing to the filesystem while deciding.
const resolveAnswers = Effect.fnUntraced(function* (inputs: Inputs) {
  const suggestedName = yield* suggestName;
  const name = yield* Ask.asking({
    label: 'name',
    flag: inputs.name,
    prompt: Prompt.text({
      message: 'How do you call it?',
      default: suggestedName,
      validate: asPromptValidator(validateName),
    }),
  });

  // The directory default follows whatever the workspace ended up named.
  const suggestedDirectory = toDirectory(name.value);
  const directory = yield* Ask.asking({
    label: 'directory',
    flag: inputs.directory,
    prompt: Prompt.text({
      message: 'Where should it live?',
      default: suggestedDirectory,
      validate: asPromptValidator(validateDirectory),
    }),
  });

  const packageManager = yield* Ask.asking({
    label: 'package-manager',
    flag: inputs.packageManager,
    prompt: Prompt.select({
      message: 'What package manager to use?',
      choices: packageManagers.map((entry) => ({ title: entry.title, value: entry.value })),
    }),
  });

  const install = yield* Ask.asking({
    label: 'install',
    flag: inputs.install,
    prompt: Prompt.confirm({ message: 'Install dependencies?', initial: true }),
  });

  const settled = [name, directory, packageManager, install];

  return {
    answers: {
      name: name.value,
      directory: directory.value,
      packageManager: packageManager.value,
      install: install.value,
    },
    prompted: settled.some((entry) => entry.source === 'prompt'),
  } satisfies Resolution;
});

// Describes the run on the current span. Only the shape of it: which package manager, whether dependencies were installed, whether anyone was asked. The name and directory the user chose are theirs and are deliberately absent. What machine it ran on is added by the `Tracing.operation` this command is wrapped in.
const annotate = (resolution: Resolution, inputs: Inputs) =>
  Effect.annotateCurrentSpan({
    'falkara.package_manager': resolution.answers.packageManager,
    'falkara.install': resolution.answers.install,
    'falkara.prompted': resolution.prompted,
    'falkara.dry_run': inputs.dryRun,
    'falkara.force': inputs.force,
  });

// What to do with the answers, as opposed to what the answers are.
interface Handling {
  readonly force: boolean;
  readonly dryRun: boolean;
}

// Does the work the answers describe. Separate from `resolveAnswers` because this is the half that touches the disk: it takes a settled `Answers` and asks nothing, which is what makes it runnable from a test without a terminal anywhere in sight.
// The plan is built before the branch, so `--dry-run` and a real run survey the same set of files. A preview that reported what a run would do, rather than what this run is about to do, would be worth nothing.
// Measured under a span of its own, so that the duration on record is this and not the banner, the consent notice and however long someone took over four prompts.
const execute = Effect.fnUntraced(function* (answers: Answers, handling: Handling) {
  const ui = yield* Ui.Ui;

  const files = Template.forWorkspace({
    name: answers.name,
    packageManager: answers.packageManager,
  }).map((file): Files.File => (handling.force ? { ...file, onConflict: 'overwrite' } : file));

  // Dies rather than fails: a template naming a path outside its own root, or two naming the same one, is a bug in Falkara. Threading it through the error channel would ask every caller to handle something no user can act on.
  const plan = yield* Effect.orDie(Files.plan(answers.directory, files));

  if (handling.dryRun) {
    yield* Files.preview(yield* Files.survey(plan));
    return;
  }

  yield* ui.step(`Creating ${answers.name} in ${answers.directory}`, Files.apply(plan));

  if (answers.install) {
    // Reported rather than drawn as a completed step, because a tick against work that did not happen is worse than no step at all.
    yield* ui.report({
      severity: 'warning',
      message: 'Installing dependencies is not implemented yet, and was skipped.',
      subject: answers.packageManager,
    });
  }
}, Tracing.measured('workspace.create.scaffold'));

// Announces the tool, outside the traced operation and deliberately: it is a second of deliberate pacing that would otherwise be the largest term in every duration the run reports.
const introduce = Effect.fnUntraced(function* () {
  const ui = yield* Ui.Ui;
  yield* ui.blank;
  yield* ui.banner('Falkara Workspace');
  yield* ui.blank;
  yield* ui.line([Ui.subtle("  Let's create your own digital experience.")], { reveal: true });
  yield* ui.blank;
});

/**
 * Where the telemetry question sits among the others, and what the user types
 * to revisit the answer.
 *
 * `first` puts it before anything is asked about the workspace, `last` after
 * every other question and before any file is written. Either way the answer
 * covers the next run and never this one, because the tracer was chosen before
 * the command began.
 *
 * A service rather than a parameter, and one without a default: each mounting
 * provides it with `Command.provide`, and a tree that never decided does not
 * compile.
 */
export class Consenting extends Context.Service<
  Consenting,
  {
    readonly ask: 'first' | 'last';
    /**
     * Absent in a binary a user cannot invoke by name, where the notice names
     * the decision file alone.
     */
    readonly settings?: string | undefined;
  }
>()('@falkara/cli-workspace/Create/Consenting') {}

/**
 * Fixes where the telemetry question sits, for a binary mounting the scaffolder.
 *
 * @param options Where the question sits, and what revisits the answer.
 */
export const consenting = (options: Consenting['Service']): Layer.Layer<Consenting> =>
  Layer.succeed(Consenting)(options);

const run = Effect.fnUntraced(
  function* (inputs: Inputs) {
    const ui = yield* Ui.Ui;
    const consenting = yield* Consenting;

    // Asked after the banner rather than at startup, so the user has seen what this tool is before being asked to share anything about using it.
    if (consenting.ask === 'first') {
      yield* Consent.ensureAsked(consenting.settings);
    }

    const resolution = yield* resolveAnswers(inputs);

    // Last of the questions and before the first write, so a run that answers it has still answered nothing about the workspace it is about to create.
    if (consenting.ask === 'last') {
      yield* Consent.ensureAsked(consenting.settings);
    }

    yield* annotate(resolution, inputs);

    yield* ui.blank;
    yield* execute(resolution.answers, { force: inputs.force, dryRun: inputs.dryRun });
    yield* ui.blank;
    yield* ui.line(
      inputs.dryRun
        ? [Ui.strong('  Nothing written.'), Ui.subtle(' Re-run without --dry-run to create it.')]
        : [Ui.strong('  Ready.'), Ui.subtle(` cd ${resolution.answers.directory}`)],
    );
    yield* ui.blank;
  },
  // The span is applied here rather than by `Effect.fn`, because a span that sees a failure exports its message and stack trace, and both are full of paths that must never leave the machine.
  Tracing.operation('workspace.create'),
);

/**
 * Every flag the scaffolder accepts.
 *
 * Exported for the surfaces that put a name to them: the name a command
 * answers to differs by binary, and a flag set does not.
 */
export const flags = { name, directory, packageManager, install, force, dryRun };

/**
 * What the command says it is for, wherever it is mounted.
 */
export const description = 'Scaffold a new Falkara Workspace project.';

/**
 * Announces the tool, settles every answer, and writes the project.
 *
 * @param inputs What the invocation said.
 */
export const handler = Effect.fnUntraced(function* (inputs: Inputs) {
  yield* introduce();
  yield* run(inputs);
});
