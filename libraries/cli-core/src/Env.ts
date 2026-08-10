import { Config, Effect, Option } from 'effect';

/**
 * An environment variable, absent when it is unset or empty.
 *
 * Read through `Config` rather than `process.env` so the surrounding
 * environment is a service like any other: a test supplies a `ConfigProvider`
 * instead of mutating a global that every other test can see.
 *
 * Empty reads as absent because that is what a shell means by it. `FOO=` is how
 * a caller unsets something it cannot delete — a wrapper script, a CI matrix
 * entry, a Dockerfile — and treating it as a real value would hand the rest of
 * the CLI an empty path or an empty URL to act on.
 *
 * Nothing here fails on what the user set: a variable that is present is
 * already a string, and one that is absent is `Option.none()`. What remains is
 * the provider failing to answer at all, which is a fault in the process rather
 * than in the environment, and is raised as one. A read that validates its
 * value — a port, a URL, one of a fixed set — can fail on what the user set,
 * and that failure belongs in the error channel where the CLI can name the
 * variable and say what it expected.
 *
 * @param name The variable to read.
 */
export const optional = (name: string): Effect.Effect<Option.Option<string>> =>
  Effect.orDie(
    Config.string(name).pipe(
      Config.option,
      Config.map(Option.filter((value) => value.trim() !== '')),
    ),
  );
