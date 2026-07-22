import { Cause, Effect, Exit, FileSystem, Layer, Option, Path, References } from 'effect';
import { FetchHttpClient } from 'effect/unstable/http';
import { OtlpSerialization, OtlpTracer } from 'effect/unstable/observability';
import * as Consent from './Consent.ts';

/**
 * Identifies the binary that produced a trace.
 *
 * Passed explicitly rather than left to the environment: `OtlpResource` dies
 * outright when it cannot resolve a service name from anywhere.
 */
export interface Service {
  readonly name: string;
  readonly version: string;
}

/**
 * Where traces are sent.
 *
 * Read from the standard OpenTelemetry variable so any collector works without
 * this CLI inventing its own configuration. Absent means nowhere: telemetry
 * that has been consented to but has no destination is simply not collected.
 */
// TODO: default to Falkara's own collector once one exists.
const endpoint = (): Option.Option<string> => {
  const configured = process.env['OTEL_EXPORTER_OTLP_TRACES_ENDPOINT'];
  return configured === undefined || configured === '' ? Option.none() : Option.some(configured);
};

/**
 * Spans go nowhere and, more importantly, are never built.
 *
 * Turning the tracer off is not the same as having no exporter: without this
 * the default in-memory tracer still allocates a span per operation, which a
 * user who declined telemetry should not be paying for.
 */
const silent = Layer.succeed(References.TracerEnabled, false);

const exporting = (service: Service, url: string) =>
  OtlpTracer.layer({
    url,
    resource: { serviceName: service.name, serviceVersion: service.version },
    // A CLI never lives long enough for the poller to matter; everything is
    // delivered by the scope-close flush instead. Pushing the interval out
    // keeps a mid-run partial batch from going out on its own.
    exportInterval: '1 hour',
    // Bounds how long a finished CLI can sit waiting on an unreachable
    // collector before giving up and exiting anyway.
    shutdownTimeout: '2 seconds',
  }).pipe(Layer.provide(OtlpSerialization.layerJson), Layer.provide(FetchHttpClient.layer));

/**
 * Tracing, if and only if the user has already said yes.
 *
 * Reads the recorded decision without ever asking: the question belongs to the
 * command, after the banner, where there is context for it. A first run
 * therefore exports nothing, which is the honest outcome — consent given
 * halfway through a run cannot retroactively cover the start of it.
 *
 * Provide this *outside* the root span. The exporter only flushes when its
 * scope closes, so a layer that closes before the span ends would drop the very
 * trace it exists to send.
 */
export const layer = (
  service: Service,
): Layer.Layer<never, never, FileSystem.FileSystem | Path.Path> =>
  Layer.unwrap(
    Effect.gen(function* () {
      const decision = yield* Consent.stored;
      const granted = Option.isSome(decision) && decision.value.granted;
      if (!granted) {
        return silent;
      }

      return Option.match(endpoint(), {
        onNone: () => silent,
        onSome: (url) => exporting(service, url),
      });
    }).pipe(
      // Telemetry must never be why the tool fails: an unreadable or corrupt
      // decision file is worth surfacing when the user asks about telemetry,
      // not when they are trying to scaffold something.
      Effect.catchCause(() => Effect.succeed(silent)),
    ),
  );

/**
 * How a run ended, named but not described.
 *
 * A tag is a closed vocabulary the code chose — `UnderSpecified`, `QuitError` —
 * so it can be counted without ever carrying a path, a workspace name, or
 * anything the user typed.
 */
const outcomeTag = (cause: Cause.Cause<unknown>): string => {
  if (Cause.hasInterruptsOnly(cause)) {
    return 'Interrupted';
  }

  const error = Cause.findErrorOption(cause);
  if (Option.isSome(error)) {
    const failure = error.value;
    if (typeof failure === 'object' && failure !== null) {
      const tag = (failure as { readonly _tag?: unknown })._tag;
      if (typeof tag === 'string') {
        return tag;
      }
    }
    // A typed failure that is not tagged — a bare string or number. Counted,
    // never quoted.
    return 'Error';
  }

  // An unexpected throw. Named as such rather than unpacked: a defect's message
  // is arbitrary text from anywhere in the dependency tree.
  return 'Defect';
};

/**
 * Traces `effect` as a named operation without ever handing its failure to the
 * tracer.
 *
 * `OtlpTracer` attaches `exception.message` and `exception.stacktrace` to any
 * span that ends in failure, and a stack trace is full of absolute paths. So
 * the outcome is captured as a value first: the span always closes successfully
 * and is annotated with nothing but a tag, and the failure is re-raised
 * afterwards, outside the span, where the CLI still handles it normally.
 *
 * This is what makes the consent notice true by construction rather than by
 * remembering to be careful.
 */
export const operation =
  (name: string) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.exit(effect).pipe(
      Effect.tap((exit) =>
        Exit.isSuccess(exit)
          ? Effect.annotateCurrentSpan('falkara.outcome', 'success')
          : Effect.annotateCurrentSpan({
              'falkara.outcome': 'failure',
              'falkara.error': outcomeTag(exit.cause),
            }),
      ),
      Effect.withSpan(name),
      Effect.flatMap((exit) => exit),
    );
