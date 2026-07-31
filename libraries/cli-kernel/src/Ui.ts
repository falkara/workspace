import {
  Context,
  Duration,
  Effect,
  Exit,
  Fiber,
  Function,
  Layer,
  Schedule,
  Terminal,
} from 'effect';
import { Capabilities } from '#src/Capabilities.ts';
import { centre, displayWidth } from '#src/Text.ts';

/**
 * How much a run is allowed to say.
 *
 * A `Reference` rather than a `Service`: `normal` is a correct answer
 * everywhere, so there is a default and no layer to wire. Read at each call
 * rather than once when the layer is built, so a command that needs to quieten
 * one section of itself can do so with `Effect.provideService`.
 */
export type Verbosity = 'quiet' | 'normal' | 'verbose';

export const Verbosity = Context.Reference<Verbosity>('@falkara/cli-kernel/Ui/Verbosity', {
  defaultValue: (): Verbosity => 'normal',
});

/**
 * How much weight a diagnostic carries.
 *
 * A closed vocabulary rather than free-form levels: it decides what a quiet run
 * still prints and what a machine-readable renderer puts in a field, and both
 * want a set they can exhaust.
 */
export type Severity = 'debug' | 'info' | 'warning' | 'error';

/**
 * Something the run wants on the record.
 *
 * Distinct from {@link Line} because the two are not interchangeable to anything
 * downstream: presentation is for a person watching and is the first thing to
 * drop, whereas a diagnostic is the payload — what a `--json` renderer emits,
 * what a log keeps, what an editor reads. A code generator reporting a hundred
 * files does it through here.
 */
export interface Diagnostic {
  readonly severity: Severity;
  readonly message: string;
  /** What it is about: a file, a generator, a target. */
  readonly subject?: string | undefined;
}

/**
 * How much a run of text stands out.
 *
 * Named by role rather than by colour, so the renderer decides whether that
 * means cyan, bold, or nothing at all. A caller that said `red` would be
 * choosing on behalf of a renderer writing into a log file.
 */
export type Emphasis = 'plain' | 'strong' | 'subtle' | 'accent';

export interface Segment {
  readonly text: string;
  readonly emphasis: Emphasis;
}

/** A line, as the pieces it is emphasised in. */
export type Line = ReadonlyArray<Segment>;

export const plain = (text: string): Segment => ({ text, emphasis: 'plain' });
export const strong = (text: string): Segment => ({ text, emphasis: 'strong' });
export const subtle = (text: string): Segment => ({ text, emphasis: 'subtle' });
export const accent = (text: string): Segment => ({ text, emphasis: 'accent' });

export interface LineOptions {
  /**
   * Asks for the line to be revealed over time where that means anything. A
   * request rather than an instruction: a renderer nobody is watching prints it
   * whole.
   */
  readonly reveal?: boolean | undefined;
}

/**
 * Everything a Falkara command says, and the only way it says it.
 *
 * The split that matters is {@link Diagnostic} against {@link Line}: what the
 * run found, versus how the run looks. Ceremony can be dropped without losing
 * anything, findings cannot, and a renderer has to be able to tell them apart to
 * do either — which is what lets a machine-readable renderer be a `Layer` over
 * this interface rather than a second interface bolted alongside it.
 *
 * Nothing here mentions colour, animation, or how loud the run is. Those are
 * properties of the layer that gets provided, not branches inside a handler,
 * because a branch per styled string is a branch that will eventually be
 * forgotten — and the one that gets forgotten writes escape bytes into
 * someone's build log.
 */
export class Ui extends Context.Service<
  Ui,
  {
    /** Announces the tool. What that looks like is the renderer's business. */
    readonly banner: (title: string) => Effect.Effect<void>;
    /** A line of presentation. */
    readonly line: (line: Line, options?: LineOptions) => Effect.Effect<void>;
    /** Puts something on the record. */
    readonly report: (diagnostic: Diagnostic) => Effect.Effect<void>;
    /** Runs `work`, reporting it as a labelled step. */
    readonly step: <A, E, R>(label: string, work: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
    /** A blank line. */
    readonly blank: Effect.Effect<void>;
  }
>()('@falkara/cli-kernel/Ui') {}

/**
 * Whether a diagnostic of this severity survives this verbosity.
 *
 * A quiet run is quiet about progress, not about problems: warnings and errors
 * are why someone reads the output at all, so they are never what `--quiet`
 * removes.
 */
const carries = (verbosity: Verbosity, severity: Severity): boolean => {
  switch (verbosity) {
    case 'quiet':
      return severity === 'warning' || severity === 'error';
    case 'normal':
      return severity !== 'debug';
    case 'verbose':
      return true;
  }
};

/** Whether presentation survives this verbosity. */
const decorates = (verbosity: Verbosity): boolean => verbosity !== 'quiet';

/**
 * The styling this presentation may use.
 *
 * Two implementations rather than a flag checked at each call site, for the
 * same reason the service says nothing about colour.
 */
interface Palette {
  readonly bold: (value: string) => string;
  readonly dim: (value: string) => string;
  readonly cyan: (value: string) => string;
  readonly yellow: (value: string) => string;
  readonly green: (value: string) => string;
  readonly red: (value: string) => string;
}

const styled: Palette = {
  bold: (value) => `\x1b[1m${value}\x1b[0m`,
  dim: (value) => `\x1b[2m${value}\x1b[0m`,
  cyan: (value) => `\x1b[36m${value}\x1b[0m`,
  yellow: (value) => `\x1b[33m${value}\x1b[0m`,
  green: (value) => `\x1b[32m${value}\x1b[0m`,
  red: (value) => `\x1b[31m${value}\x1b[0m`,
};

const bare: Palette = {
  bold: Function.identity,
  dim: Function.identity,
  cyan: Function.identity,
  yellow: Function.identity,
  green: Function.identity,
  red: Function.identity,
};

const emphasise = (palette: Palette, segment: Segment): string => {
  switch (segment.emphasis) {
    case 'plain':
      return segment.text;
    case 'strong':
      return palette.bold(segment.text);
    case 'subtle':
      return palette.dim(segment.text);
    case 'accent':
      return palette.cyan(segment.text);
  }
};

/** How a diagnostic is marked, and in what. */
const severityMark = (palette: Palette, severity: Severity): string => {
  switch (severity) {
    case 'debug':
      return palette.dim('·');
    case 'info':
      return palette.cyan('·');
    case 'warning':
      return palette.yellow('!');
    case 'error':
      return palette.red('✖');
  }
};

// `as const` makes this a tuple, so index 0 is statically known to exist and
// `frameAt` can be total without a non-null assertion.
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const;

const frameAt = (index: number): string =>
  spinnerFrames[index % spinnerFrames.length] ?? spinnerFrames[0];

/**
 * How a step ended.
 *
 * Read from the `Exit` rather than assumed, so a step that failed is never
 * reported with a tick.
 */
const outcomeMark = (palette: Palette, exit: Exit.Exit<unknown, unknown>): string =>
  Exit.isSuccess(exit) ? palette.green('✔') : palette.red('✖');

/** Centring happens before styling, so escape bytes never skew the padding. */
const boxRows = (palette: Palette, title: string): ReadonlyArray<string> => {
  const inner = displayWidth(title) + 12;
  const rule = '─'.repeat(inner);
  const edge = (content: string) => `${palette.cyan('│')}${content}${palette.cyan('│')}`;
  return [
    palette.cyan(`╭${rule}╮`),
    edge(centre('', inner)),
    edge(palette.bold(centre(title, inner))),
    edge(centre('', inner)),
    palette.cyan(`╰${rule}╯`),
  ];
};

/**
 * How the flow is presented.
 *
 * The two answers are independent: CI is watched by nobody but often renders
 * colour, and a slow pipe into a file is neither.
 */
export interface Presentation {
  /** Whether output is revealed over time. */
  readonly animate: boolean;
  /** Whether styling is rendered rather than left as bytes in a log. */
  readonly colour: boolean;
}

/**
 * Splits a line into one segment per grapheme, so that revealing it paces what
 * the reader sees rather than how the string happens to be encoded.
 */
const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' });

const perGrapheme = (line: Line): ReadonlyArray<Segment> =>
  line.flatMap((segment) =>
    [...graphemes.segment(segment.text)].map(({ segment: text }) => ({ ...segment, text })),
  );

/**
 * Builds a `Ui` that writes for a person over a `Terminal`. Every variant
 * announces a step when it starts and marks how it ended; they differ in
 * whether the running indicator is redrawn in place or left standing as a line
 * a log can keep.
 */
const make = Effect.fnUntraced(function* (presentation: Presentation) {
  const terminal = yield* Terminal.Terminal;
  const palette = presentation.colour ? styled : bare;
  const { animate } = presentation;

  // A CLI has no meaningful recovery from an unwritable terminal.
  const display = (text: string) => Effect.orDie(terminal.display(text));

  const paced = (text: string, delay: Duration.Duration) =>
    animate ? Effect.andThen(display(text), Effect.sleep(delay)) : display(text);

  /** Writes only if presentation survives the verbosity in force. */
  const whenDecorating = (write: Effect.Effect<void>) =>
    Effect.flatMap(Verbosity, (verbosity) => (decorates(verbosity) ? write : Effect.void));

  const renderLine = (line: Line) => line.map((segment) => emphasise(palette, segment)).join('');

  return Ui.of({
    blank: whenDecorating(display('\n')),

    banner: (title) =>
      whenDecorating(
        Effect.forEach(boxRows(palette, title), (row) => paced(`  ${row}\n`, Duration.millis(60)), {
          discard: true,
        }),
      ),

    line: (line, options) =>
      whenDecorating(
        animate && options?.reveal === true
          ? Effect.andThen(
              Effect.forEach(
                perGrapheme(line),
                (segment) => paced(emphasise(palette, segment), Duration.millis(24)),
                { discard: true },
              ),
              display('\n'),
            )
          : display(`${renderLine(line)}\n`),
      ),

    report: (diagnostic) =>
      Effect.flatMap(Verbosity, (verbosity) => {
        if (!carries(verbosity, diagnostic.severity)) {
          return Effect.void;
        }
        const subject =
          diagnostic.subject === undefined ? '' : ` ${palette.dim(diagnostic.subject)}`;
        return display(
          `  ${severityMark(palette, diagnostic.severity)} ${diagnostic.message}${subject}\n`,
        );
      }),

    step: (label, work) =>
      Effect.flatMap(Verbosity, (verbosity) => {
        // A quiet run still does the work; it just does not narrate it.
        if (!decorates(verbosity)) {
          return work;
        }
        return animate
          ? Effect.gen(function* () {
              let frame = 0;
              // Suspended so every repeat advances the frame; building the
              // string eagerly would redraw a single frame forever.
              const tick = Effect.suspend(() =>
                display(`\r\x1b[2K  ${palette.cyan(frameAt(frame++))} ${label}`),
              );
              const animation = yield* Effect.forkChild(
                Effect.repeat(tick, Schedule.spaced(Duration.millis(80))),
              );
              // `onExit` rather than `ensuring`: the outcome decides the mark,
              // so a step that failed cannot report a tick. The spinner is
              // stopped before that line is drawn, so no pending frame
              // overwrites it.
              return yield* Effect.onExit(work, (exit) =>
                Effect.andThen(
                  Fiber.interrupt(animation),
                  display(`\r\x1b[2K  ${outcomeMark(palette, exit)} ${label}\n`),
                ),
              );
            })
          : // The label lands before the work runs, so a slow step is
            // attributable in a log while it is still going — not only once it
            // has already finished or timed out.
            Effect.andThen(
              display(`  ${palette.dim('…')} ${label}\n`),
              Effect.onExit(work, (exit) => display(`  ${outcomeMark(palette, exit)} ${label}\n`)),
            );
      }),
  });
});

/** Fixes the presentation, for tests and for callers that already know. */
export const layerWith = (presentation: Presentation): Layer.Layer<Ui, never, Terminal.Terminal> =>
  Layer.effect(Ui)(make(presentation));

/**
 * Chooses a presentation from {@link Capabilities}, so the decision to animate,
 * the decision to colour and the decision to prompt cannot disagree about the
 * same terminal.
 */
export const layer: Layer.Layer<Ui, never, Terminal.Terminal | Capabilities> = Layer.unwrap(
  Effect.map(Capabilities, (capabilities) =>
    layerWith({ animate: capabilities.canAnimate, colour: capabilities.canColour }),
  ),
);
