import { Config, Effect, Option } from 'effect';

/**
 * An environment variable, absent when it is unset or empty.
 *
 * Read through `Config` rather than `process.env`, so a test supplies a
 * `ConfigProvider` instead of mutating a global. Empty reads as absent because
 * `FOO=` is how a shell unsets what it cannot delete. Neither is a failure, so
 * the provider not answering at all is a process fault, and dies as one.
 *
 * Most reads serve terminal-capability detection; should Effect adopt that
 * upstream, this module shrinks to the config-path and telemetry reads.
 *
 * @see https://github.com/Effect-TS/effect/issues/7556
 * @param name The variable to read.
 */
export const optional = (name: string): Effect.Effect<Option.Option<string>> =>
  Effect.orDie(
    Config.string(name).pipe(
      Config.option,
      Config.map(Option.filter((value) => value.trim() !== '')),
    ),
  );
