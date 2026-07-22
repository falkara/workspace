import { Effect, Option, Terminal } from 'effect';
import { Command, Flag, Prompt } from 'effect/unstable/cli';
import {
  asFlagValidator,
  asPromptValidator,
  suggestName,
  toDirectory,
  validateDirectory,
  validateName,
} from './Naming.ts';
import { Capabilities } from './Capabilities.ts';
import * as Consent from './Consent.ts';
import * as Telemetry from './Telemetry.ts';
import { UnderSpecified } from './Errors.ts';
import { Ui } from './Ui.ts';

const packageManagers = [
  { title: 'Bun (recommended)', value: 'bun' },
  { title: 'Deno', value: 'deno' },
  { title: 'npm', value: 'npm' },
] as const;

const nameRules = asFlagValidator(validateName);
const directoryRules = asFlagValidator(validateDirectory);

const name = Flag.string('name').pipe(
  Flag.withAlias('n'),
  Flag.withDescription('Name of the workspace.'),
  Flag.filterMap(nameRules.filter, nameRules.onInvalid),
  Flag.optional,
);

const directory = Flag.string('directory').pipe(
  Flag.withAlias('d'),
  Flag.withDescription('Directory to scaffold the workspace into.'),
  Flag.filterMap(directoryRules.filter, directoryRules.onInvalid),
  Flag.optional,
);

const packageManager = Flag.choice(
  'package-manager',
  packageManagers.map((entry) => entry.value),
).pipe(Flag.withAlias('p'), Flag.withDescription('Package manager to use.'), Flag.optional);

// `optional` on a boolean flag yields three states: absent (`None`, so ask),
// `--install` (`Some(true)`) and `--no-install` (`Some(false)`).
const install = Flag.boolean('install').pipe(
  Flag.withDescription('Install dependencies after scaffolding; --no-install to skip.'),
  Flag.optional,
);

const yes = Flag.boolean('yes').pipe(
  Flag.withAlias('y'),
  Flag.withDescription('Accept the defaults and skip all prompts.'),
);

/**
 * An answer is taken from its flag, else from the default when `--yes` was
 * given, else from a prompt.
 *
 * When none of those apply the run is under-specified and cannot be completed:
 * guessing would scaffold something nobody asked for, and prompting into a pipe
 * would hang. Failing with instructions is the only honest outcome.
 */
const asking =
  (skipPrompts: boolean) =>
  <A>(options: {
    /** The answer's name, used when reporting that it could not be asked for. */
    readonly label: string;
    readonly flag: Option.Option<A>;
    readonly prompt: Prompt.Prompt<A>;
    readonly fallback: A;
  }): Effect.Effect<A, Terminal.QuitError | UnderSpecified, Prompt.Environment> =>
    Option.match(options.flag, {
      onSome: Effect.succeed,
      onNone: () =>
        Effect.gen(function* () {
          if (skipPrompts) {
            return options.fallback;
          }
          // Read rather than passed in: threading the same capability through
          // every call is how one of them ends up disagreeing with the others.
          const { canPrompt } = yield* Capabilities;
          if (canPrompt) {
            return yield* options.prompt;
          }
          return yield* Effect.fail(new UnderSpecified({ answer: options.label }));
        }),
    });

const makeBase = <const Name extends string>(commandName: Name) =>
  Command.make(
    commandName,
    { name, directory, packageManager, install, yes },
    // The span is applied by `Telemetry.operation` below rather than by
    // `Effect.fn`, because a span that sees a failure exports its message and
    // stack trace, and both are full of paths that must never leave the machine.
    Effect.fnUntraced(function* (config) {
      const ui = yield* Ui;
      // `--yes` is fixed for the whole run, so it is bound once here.
      const answer = asking(config.yes);

      yield* ui.blank;
      yield* ui.banner('Falkara Workspace');
      yield* ui.blank;
      yield* ui.tagline("  Let's create your own digital experience.");
      yield* ui.blank;

      // Asked here rather than at startup so the user has seen what this tool
      // is before being asked to share anything about using it. Nothing is
      // exported for this run: the tracer was decided before it began.
      yield* Consent.ensureAsked;

      const suggestedName = yield* suggestName;
      const name = yield* answer({
        label: 'name',
        flag: config.name,
        prompt: Prompt.text({
          message: 'How do you call it?',
          default: suggestedName,
          validate: asPromptValidator(validateName),
        }),
        fallback: suggestedName,
      });

      // The directory default follows whatever the workspace ended up named.
      const suggestedDirectory = toDirectory(name);
      const directory = yield* answer({
        label: 'directory',
        flag: config.directory,
        prompt: Prompt.text({
          message: 'Where should it live?',
          default: suggestedDirectory,
          validate: asPromptValidator(validateDirectory),
        }),
        fallback: suggestedDirectory,
      });

      const packageManager = yield* answer({
        label: 'package-manager',
        flag: config.packageManager,
        prompt: Prompt.select({
          message: 'What package manager to use?',
          choices: packageManagers.map((entry) => ({ title: entry.title, value: entry.value })),
        }),
        fallback: 'bun' as const,
      });

      const install = yield* answer({
        label: 'install',
        flag: config.install,
        prompt: Prompt.confirm({ message: 'Install dependencies?', initial: true }),
        fallback: true,
      });

      // Recorded on the span so telemetry never needs a channel of its own.
      // Only the shape of the run is described: which package manager, whether
      // dependencies were installed, what host it ran on. The name and
      // directory the user chose are theirs and are deliberately absent.
      yield* Effect.annotateCurrentSpan({
        'falkara.package_manager': packageManager,
        'falkara.install': install,
        'falkara.prompted': !config.yes,
        'process.runtime.version': process.versions.node,
        'os.type': process.platform,
        'host.arch': process.arch,
      });

      yield* ui.blank;

      // TODO: replace these placeholders with the real scaffolding work.
      yield* ui.step(`Creating ${name} in ${directory}`, Effect.sleep('900 millis'));

      if (install) {
        yield* ui.step(
          `Installing dependencies with ${packageManager}`,
          Effect.sleep('1200 millis'),
        );
      }

      yield* ui.blank;
      yield* ui.outcome('Ready.', `cd ${directory}`);
      yield* ui.blank;
    }, Telemetry.operation('workspace.create')),
  );

/**
 * Builds the scaffolding command under a given name.
 *
 * The name is a parameter because it differs by mount point: standalone the
 * command is `create-workspace`, matching the published bin, whereas under the
 * product CLI it is `create`, reached as `falkara workspace create`. Both the
 * usage line and the examples are derived from it, so neither can drift from
 * how the command is actually invoked.
 */
export const makeCommand = <const Name extends string>(commandName: Name, invocation: string) =>
  makeBase(commandName).pipe(
    Command.withDescription(
      'Scaffold a new Falkara workspace. Any answer not supplied as a flag is ' +
        'asked interactively; --yes takes the defaults instead.',
    ),
    Command.withExamples([
      { command: invocation, description: 'Answer every question interactively.' },
      { command: `${invocation} --yes`, description: 'Take every default, ask nothing.' },
      {
        command: `${invocation} -n storefront -p npm --no-install`,
        description: 'Fully non-interactive, skipping dependency installation.',
      },
    ]),
  );
