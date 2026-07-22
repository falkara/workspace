import { Context, Duration, Effect, Exit, Fiber, Layer, Schedule, Terminal } from 'effect';
import { Capabilities } from './Capabilities.ts';

const ansi = {
  bold: (value: string) => `\x1b[1m${value}\x1b[0m`,
  dim: (value: string) => `\x1b[2m${value}\x1b[0m`,
  cyan: (value: string) => `\x1b[36m${value}\x1b[0m`,
  green: (value: string) => `\x1b[32m${value}\x1b[0m`,
  red: (value: string) => `\x1b[31m${value}\x1b[0m`,
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
const outcomeMark = (exit: Exit.Exit<unknown, unknown>): string =>
  Exit.isSuccess(exit) ? ansi.green('✔') : ansi.red('✖');

/**
 * Presentation for the scaffolding flow.
 *
 * Nothing here mentions animation: whether output is revealed over time is a
 * property of the layer that gets provided, not a branch inside the handler.
 */
export class Ui extends Context.Service<
  Ui,
  {
    /** Announces the tool. */
    readonly banner: (title: string) => Effect.Effect<void>;
    /** A single line of framing beneath the banner. */
    readonly tagline: (text: string) => Effect.Effect<void>;
    /** Runs `work`, reporting it as a labelled step. */
    readonly step: <A, E, R>(label: string, work: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
    /** Closes the flow. */
    readonly outcome: (headline: string, detail: string) => Effect.Effect<void>;
    /** A blank line. */
    readonly blank: Effect.Effect<void>;
  }
>()('@falkara/workspace/Ui') {}

/** Lays a string out inside a box of the given inner width. */
const centre = (value: string, width: number) => {
  const spare = width - value.length;
  const left = Math.floor(spare / 2);
  return `${' '.repeat(left)}${value}${' '.repeat(spare - left)}`;
};

/** Centring happens before styling, so escape bytes never skew the padding. */
const boxRows = (title: string) => {
  const inner = title.length + 12;
  const rule = '─'.repeat(inner);
  const edge = (content: string) => `${ansi.cyan('│')}${content}${ansi.cyan('│')}`;
  return [
    ansi.cyan(`╭${rule}╮`),
    edge(centre('', inner)),
    edge(ansi.bold(centre(title, inner))),
    edge(centre('', inner)),
    ansi.cyan(`╰${rule}╯`),
  ];
};

/**
 * Builds a `Ui` over a `Terminal`. Both variants emit the same content; only
 * the pacing differs.
 */
const make = Effect.fnUntraced(function* (animate: boolean) {
  const terminal = yield* Terminal.Terminal;

  // A scaffolding CLI has no meaningful recovery from an unwritable terminal.
  const display = (text: string) => Effect.orDie(terminal.display(text));

  const paced = (text: string, delay: Duration.Duration) =>
    animate ? Effect.andThen(display(text), Effect.sleep(delay)) : display(text);

  return Ui.of({
    blank: display('\n'),

    banner: (title) =>
      Effect.forEach(boxRows(title), (row) => paced(`  ${row}\n`, Duration.millis(60)), {
        discard: true,
      }),

    tagline: (text) =>
      animate
        ? Effect.andThen(
            Effect.forEach(text, (character) => paced(character, Duration.millis(24)), {
              discard: true,
            }),
            display('\n'),
          )
        : display(`${text}\n`),

    step: (label, work) =>
      animate
        ? Effect.gen(function* () {
            let frame = 0;
            // Suspended so every repeat advances the frame; building the string
            // eagerly would redraw a single frame forever.
            const tick = Effect.suspend(() =>
              display(`\r\x1b[2K${ansi.cyan(frameAt(frame++))} ${label}`),
            );
            const animation = yield* Effect.forkChild(
              Effect.repeat(tick, Schedule.spaced(Duration.millis(80))),
            );
            // `onExit` rather than `ensuring`: the outcome decides the mark, so
            // a step that failed cannot report a tick. The spinner is stopped
            // before that line is drawn, so no pending frame overwrites it.
            return yield* Effect.onExit(work, (exit) =>
              Effect.andThen(
                Fiber.interrupt(animation),
                display(`\r\x1b[2K${outcomeMark(exit)} ${label}\n`),
              ),
            );
          })
        : Effect.onExit(work, (exit) => display(`  ${outcomeMark(exit)} ${label}\n`)),

    outcome: (headline, detail) => display(`  ${ansi.bold(headline)} ${ansi.dim(detail)}\n`),
  });
});

/** Animated presentation, for interactive terminals. */
export const layerAnimated = Layer.effect(Ui)(make(true));

/** Plain presentation, for pipes, CI logs and non-interactive shells. */
export const layerPlain = Layer.effect(Ui)(make(false));

/**
 * Chooses a presentation from {@link Capabilities}, so the decision to animate
 * and the decision to prompt cannot disagree about the same terminal.
 */
export const layer = Layer.unwrap(
  Effect.map(Capabilities, (capabilities) =>
    capabilities.canAnimate ? layerAnimated : layerPlain,
  ),
);
