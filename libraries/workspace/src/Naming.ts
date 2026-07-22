import { Effect, Option, Random, Result } from 'effect';

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

/** The characters a name has to survive slugification with something left. */
const hasAlphanumeric = /[a-z0-9]/u;

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
  if (!hasAlphanumeric.test(trimmed.normalize('NFKD').toLowerCase())) {
    return Result.fail('Name needs at least one letter or number.');
  }
  return Result.succeed(trimmed);
};

/** Separators stay legal here — a directory is allowed to be a path. */
export const validateDirectory = (value: string): Validated => {
  const trimmed = value.trim();
  if (trimmed === '') {
    return Result.fail('Directory cannot be empty.');
  }
  if (pathHostile.test(trimmed)) {
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

/** Adapts a validator for `Flag.filterMap`, which rejects the invocation. */
export const asFlagValidator = (validate: (value: string) => Validated) => ({
  filter: (value: string): Option.Option<string> => Result.getSuccess(validate(value)),
  onInvalid: (value: string): string =>
    Option.getOrElse(Result.getFailure(validate(value)), () => 'Invalid value.'),
});

/**
 * Turns a display name into something safe to use as a directory.
 *
 * Accents are folded rather than dropped, so `Ünïcode` becomes `unicode` and
 * not `n-code`. A name made entirely of punctuation still has to land
 * somewhere, hence the fallback.
 */
export const toDirectory = (name: string) => {
  const slug = name
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `./${slug === '' ? 'workspace' : slug}`;
};
