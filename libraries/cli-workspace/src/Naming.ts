import { Effect, Random, Result } from 'effect';
import { CliError, Flag } from 'effect/unstable/cli';

const adjectives = [
  'spectacular',
  'unstoppable',
  'hyped',
  'motivated',
  'winning',
  'admirable',
  'confident',
  'creative',
  'loved',
] as const;

const nouns = [
  'celin',
  'layla',
  'melvine',
  'fridolina',
  'lea',
  'elisabeth',
  'ellen',
  'jessica',
  'simi',
  'mared',
  'hinata',
  'jess',
  'ella',
  'emma',
  'julia',
  'gabby',
  'scarlett',
  'dominique',
  'maya',
  'hanna',
  'andrea',
  'lucy',
  'jayde',
  'anna',
  'safia',
  'kayla',
  'phallon',
] as const;

/**
 * Suggests a throwaway but pronounceable name.
 *
 * Drawing from the `Random` service rather than `Math.random` keeps the
 * suggestion reproducible under `Random.withSeed`, which is what makes this
 * testable.
 */
export const suggestName: Effect.Effect<string> = Effect.gen(function* () {
  const adjective = yield* Random.choice(adjectives);
  const noun = yield* Random.choice(nouns);
  return `${adjective}-${noun}`;
});

/**
 * Characters no portable path may contain.
 *
 * `<>:"|?*` are rejected outright by Windows filesystems and control characters
 * are illegal everywhere, so they are refused regardless of host: a workspace
 * created on macOS should still be checkoutable on Windows.
 */
// eslint-disable-next-line no-control-regex -- rejecting control characters is the intent
const pathHostile = /[<>:"|?*\u0000-\u001F]/u;

/**
 * A name needs at least one letter or number in any script: `Проект` is as
 * legitimate a name as `Project`. Whether the slug keeps anything of it is
 * {@link toDirectory}'s problem, which has a fallback for exactly that.
 */
const hasWordCharacter = /[\p{L}\p{N}]/u;

/**
 * A validated answer, or the reason it was refused.
 *
 * Every free-text answer arrives twice — once as a flag, once as a prompt — so
 * the rules live here and each entry point adapts this single `Result`.
 */
export type Validated = Result.Result<string, string>;

/**
 * Names become directories, so anything unusable in a path is refused here
 * rather than silently mangled into something else by {@link toDirectory}.
 */
export const validateName = (value: string): Validated => {
  const trimmed = value.trim();
  if (trimmed === '') {
    return Result.fail('Name cannot be empty.');
  }
  if (pathHostile.test(trimmed)) {
    return Result.fail('Name cannot contain < > : " | ? * or control characters.');
  }
  if (!hasWordCharacter.test(trimmed)) {
    return Result.fail('Name needs at least one letter or number.');
  }
  return Result.succeed(trimmed);
};

/**
 * A drive prefix such as `C:\` or `d:/` is the one place a colon is legal in a
 * Windows path, so it is peeled off before the hostile-character check. A bare
 * `C:` is not matched: drive-relative paths resolve against a per-drive
 * working directory, which is never what a scaffold should target.
 */
const drivePrefix = /^[a-zA-Z]:(?=[\\/])/u;

/** Separators stay legal here — a directory is allowed to be a path. */
export const validateDirectory = (value: string): Validated => {
  const trimmed = value.trim();
  if (trimmed === '') {
    return Result.fail('Directory cannot be empty.');
  }
  if (pathHostile.test(trimmed.replace(drivePrefix, ''))) {
    return Result.fail('Directory cannot contain < > : " | ? * or control characters.');
  }
  // Trailing whitespace is already trimmed; Windows also strips a trailing dot,
  // which would silently yield a different directory than the one asked for.
  if (trimmed.endsWith('.')) {
    return Result.fail('Directory cannot end with a dot.');
  }
  return Result.succeed(trimmed);
};

/** Adapts a validator for `Prompt.text`, which re-asks on failure. */
export const asPromptValidator =
  (validate: (value: string) => Validated) =>
  (value: string): Effect.Effect<string, string> =>
    Effect.fromResult(validate(value));

/**
 * Applies a validator to a flag, rejecting the invocation when it refuses.
 *
 * `Flag.mapEffect` rather than `Flag.filterMap`, which takes the rejection and
 * the reason for it as two separate callbacks and so has to be handed the same
 * value twice — once to decide, once to explain — running the validator twice
 * and leaving the two calls free to disagree. One pass produces both.
 *
 * The refusal is a `CliError.InvalidValue` rather than a bare string, so it is
 * reported as what it is: a flag the invocation got wrong, named and quoted by
 * the framework in the same shape as every other parse failure.
 */
export const validatedBy =
  (flag: string, validate: (value: string) => Validated) =>
  (self: Flag.Flag<string>): Flag.Flag<string> =>
    Flag.mapEffect((value: string) =>
      Result.match(validate(value), {
        onSuccess: Effect.succeed,
        onFailure: (expected) =>
          Effect.fail(new CliError.InvalidValue({ option: flag, value, expected, kind: 'flag' })),
      }),
    )(self);

/**
 * Turns a display name into the one lowercase, hyphenated token that both a
 * directory and a package name can be built from.
 *
 * Accents are folded rather than dropped, so `Ünïcode` becomes `unicode` and
 * not `n-code`. A name with nothing the slug can keep — punctuation, or a
 * script with no `a-z` equivalent — still has to land somewhere, hence the
 * fallback.
 *
 * Shared with {@link toDirectory} rather than slugged twice, because a
 * workspace whose directory and whose `package.json` name disagreed about what
 * it is called would be a puzzle for whoever opened it next.
 */
export const toSlug = (name: string): string => {
  const slug = name
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug === '' ? 'workspace' : slug;
};

/** Where a workspace of this name goes by default, relative to the cwd. */
export const toDirectory = (name: string) => `./${toSlug(name)}`;
