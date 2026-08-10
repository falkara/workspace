import { NodeServices } from '@effect/platform-node';
import { Array, Effect, Layer, Record, Schema, SchemaGetter, SchemaIssue } from 'effect';
import { CliError, Command } from 'effect/unstable/cli';
import * as Capabilities from '#src/Capabilities.ts';
import * as Guidance from '#src/Guidance.ts';
import * as Paths from '#src/Paths.ts';
import * as Tracing from '#src/Tracing.ts';
import * as Ui from '#src/Ui.ts';

const InstalledName = Schema.Record(Schema.String, Schema.String).pipe(
  Schema.decodeTo(Schema.String, {
    decode: SchemaGetter.transformOrFail((bin) =>
      Effect.fromOption(
        Array.head(Record.keys(bin)),
        () =>
          new SchemaIssue.InvalidValue({
            message: 'Declares no executable to install under.',
          }),
      ),
    ),
    encode: SchemaGetter.forbidden(() => 'A binary name does not encode back to a `bin` map.'),
  }),
);

/**
 * How a binary's own manifest is read.
 */
export const Manifest = Schema.Struct({
  name: InstalledName,
  version: Schema.String,
  description: Schema.String,
}).pipe(Schema.encodeKeys({ name: 'bin' }));

/**
 * What a manifest says the binary is.
 */
export type Manifest = typeof Manifest.Type;

const layerFor = (binary: Manifest) =>
  Tracing.layer(binary).pipe(
    Layer.provideMerge(
      Layer.mergeAll(Ui.layer, Paths.layer).pipe(
        Layer.provideMerge(Capabilities.layer),
        Layer.provideMerge(NodeServices.layer),
      ),
    ),
  );

type Provided = Layer.Success<ReturnType<typeof layerFor>>;

/**
 * A binary's command tree, on the services it runs against.
 *
 * The surface is a function of the binary rather than a value, because the name
 * a command answers to is baked in when it is built.
 *
 * Only a `runMain` teardown reads the `Runtime` markers its failures carry —
 * the exit code on `CliError`, the reporting flag on failures carrying their
 * own guidance — so under any other runner a `--help` that should exit 0 exits
 * 1.
 *
 * Only a `runMain` teardown also interrupts on a signal, and an uninterrupted
 * process ends before the span exporter has flushed.
 *
 * @param surface The command tree to expose.
 * @param manifest The manifest of the binary it belongs to.
 */
export const make = <Name extends string, Input, ContextInput, E>(
  surface: (binary: Manifest) => Command.Command<Name, Input, ContextInput, E, Provided>,
  manifest: typeof Manifest.Encoded,
): Effect.Effect<void, E | CliError.CliError> =>
  Effect.gen(function* () {
    // A manifest that does not describe a binary is a fault in how the package was built, and nothing the person running it can act on.
    const binary = yield* Effect.orDie(Schema.decodeEffect(Manifest)(manifest));

    yield* Command.run(surface(binary), { version: binary.version }).pipe(
      Effect.provide(layerFor(binary)),
    );
  }).pipe(Guidance.reporting);
