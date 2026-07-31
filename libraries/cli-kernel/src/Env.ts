import { Config, Option } from 'effect';

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
 */
export const optional = (name: string): Config.Config<Option.Option<string>> =>
  Config.string(name).pipe(
    Config.option,
    Config.map(Option.filter((value) => value.trim() !== '')),
  );
