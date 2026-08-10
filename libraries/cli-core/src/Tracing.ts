import { Cause, Effect, Exit, FileSystem, Layer, Option, Path, References, Schema } from 'effect';
import { FetchHttpClient } from 'effect/unstable/http';
import { OtlpSerialization, OtlpTracer } from 'effect/unstable/observability';
import * as Consent from '#src/Consent.ts';
import * as Env from '#src/Env.ts';
import * as Host from '#src/Host.ts';
import { ConfigDirectory } from '#src/Paths.ts';
import { Ui } from '#src/Ui.ts';

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

const decodeUrl = Schema.decodeUnknownEffect(Schema.URLFromString);

// Where traces are sent, read from the standard OpenTelemetry variable so any collector works without this CLI inventing its own configuration. Absent means nowhere: telemetry that has been consented to but has no destination is simply not collected.
// A value that is not a URL is reported and then treated as absent. Failing the run over it would make telemetry a reason the tool does not work, and discarding it silently would leave someone who configured a collector believing traces were arriving.
const endpoint = Effect.fnUntraced(function* () {
  const configured = yield* Env.optional('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT');
  if (Option.isNone(configured)) {
    return Option.none();
  }

  const parsed = yield* Effect.result(decodeUrl(configured.value));
  if (parsed._tag === 'Failure') {
    const ui = yield* Ui;
    yield* ui.report({
      severity: 'warning',
      message: 'OTEL_EXPORTER_OTLP_TRACES_ENDPOINT is not a URL, so no telemetry is being sent.',
      subject: configured.value,
    });
    return Option.none();
  }

  return Option.some(parsed.success.href);
});

// Spans go nowhere and, more importantly, are never built. Turning the tracer off is not the same as having no exporter: without this the default in-memory tracer still allocates a span per operation, which a user who declined telemetry should not be paying for.
const silent = Layer.succeed(References.TracerEnabled, false);

const exporting = (service: Service, url: string) =>
  OtlpTracer.layer({
    url,
    resource: { serviceName: service.name, serviceVersion: service.version },
    // A CLI never lives long enough for the poller to matter; everything is delivered by the scope-close flush instead. Pushing the interval out keeps a mid-run partial batch from going out on its own.
    exportInterval: '1 hour',
    // Bounds how long a finished CLI can sit waiting on an unreachable collector before giving up and exiting anyway.
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
 * The exporter flushes when its scope closes, so a scope that ends before the
 * root span does drops the very trace it exists to send.
 *
 * @param service The binary to attribute every trace to.
 */
export const layer = (
  service: Service,
): Layer.Layer<never, never, FileSystem.FileSystem | Path.Path | ConfigDirectory | Ui> =>
  Layer.unwrap(
    Effect.gen(function* () {
      const decision = yield* Consent.recorded;
      if (decision._tag !== 'Present' || !decision.decision.granted) {
        return silent;
      }

      return Option.match(yield* endpoint(), {
        onNone: () => silent,
        onSome: (url) => exporting(service, url),
      });
    }).pipe(
      // Telemetry must never be why the tool fails. `Consent.recorded` already absorbs a damaged decision file; this covers what is left, an endpoint that will not parse, on the same principle.
      Effect.catchCause(() => Effect.succeed(silent)),
    ),
  );

// How a run ended, named but not described. A tag is a closed vocabulary the code chose — `UnderSpecified`, `QuitError` — so it can be counted without ever carrying a path, a workspace name, or anything the user typed.
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
    // A typed failure that is not tagged — a bare string or number. Counted, never quoted.
    return 'Error';
  }

  // An unexpected throw. Named as such rather than unpacked: a defect's message is arbitrary text from anywhere in the dependency tree.
  return 'Defect';
};

// Describes the run to the current span, in facts about the machine only.
const annotateHost = Effect.flatMap(Host.Machine, (machine) =>
  Effect.annotateCurrentSpan({
    'process.runtime.version': machine.runtimeVersion,
    'os.type': machine.platform,
    'host.arch': machine.architecture,
  }),
);

const annotateOutcome = (exit: Exit.Exit<unknown, unknown>) =>
  Exit.isSuccess(exit)
    ? Effect.annotateCurrentSpan('falkara.outcome', 'success')
    : Effect.annotateCurrentSpan({
        'falkara.outcome': 'failure',
        'falkara.error': outcomeTag(exit.cause),
      });

// Traces an effect as a named span without ever handing its failure to the tracer. `OtlpTracer` attaches `exception.message` and `exception.stacktrace` to any span that ends in failure, and a stack trace is full of absolute paths. So the outcome is captured as a value first: the span always closes successfully and is annotated with nothing but a tag, and the failure is re-raised afterwards, outside the span, where the CLI still handles it normally. This is what makes the consent notice true by construction rather than by remembering to be careful.
// The annotating is a finalizer rather than a step after the `exit`, because a fiber interrupted from outside does not run its continuations — it unwinds. Ctrl-C is the one outcome a CLI can most expect to see, and as a `tap` the annotation was silently dropped for exactly that case, leaving a span with nothing on it and making the `Interrupted` tag above unreachable. Marking the `tap` uninterruptible does not help: the problem is not that the step is cut short, it is that it is never reached. Finalizers are.
// The `Exit` a finalizer sees is the outer one: a `Success` carrying the inner `Exit` when the effect ran to a conclusion of its own, and a `Failure` only when the fiber itself was interrupted. Both are worth a tag. A span that ends interrupted is safe to report: `OtlpTracer` marks it `status.interrupted` and attaches no exception, so there is still no message and no stack trace.
const traced =
  (name: string, describe: Effect.Effect<void>) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.exit(effect).pipe(
      Effect.onExit((outer) =>
        Effect.andThen(describe, annotateOutcome(Exit.isSuccess(outer) ? outer.value : outer)),
      ),
      Effect.withSpan(name),
      Effect.flatMap((exit) => exit),
    );

/**
 * Traces a whole command as the run's root span, described by the machine it
 * ran on.
 *
 * @param name What the span is called.
 */
export const operation = (name: string) => traced(name, annotateHost);

/**
 * Traces one measured stretch of work inside an {@link operation}.
 *
 * Exists so that "how long it took" can mean the work rather than the run.
 * A command's root span also covers its banner, its consent notice and every
 * prompt it puts up, so its duration is mostly the time a person spent reading
 * and typing — a real measurement of the wrong thing. What is worth comparing
 * across runs is the part with no human in it, and that needs a span of its own.
 *
 * The host is not repeated: it is already on the parent, and a child span that
 * restates it is bytes on every export for nothing.
 *
 * @param name What the span is called.
 */
export const measured = (name: string) => traced(name, Effect.void);
