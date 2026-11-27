import * as Color from '@falkara/presentation/Color';
import * as Fluid from '@falkara/presentation/Fluid';
import * as Space from '@falkara/presentation/Space';
import * as Typography from '@falkara/presentation/Typography';
import { Array, Data, Effect, Rational, Record } from 'effect';

/** The intent of the type scale of the editor: a ratio of a minor third between consecutive steps at every viewport width, and body text that stays at the default font size, as the editor is a tool whose panels and boxes hold one size from the narrowest window to the widest. */
const scaleOptions = {
  minimumFactor: Rational.makeUnsafe(6n, 5n),
  maximumFactor: Rational.makeUnsafe(6n, 5n),
  maximumBodyFontSize: Typography.defaultFontSize,
};

/**
 * The colors of the editor, the one decision of the design language that Falkara Presentation leaves to a project, each in the light scheme and in the dark, written in oklch() as the library reads it. They share the hue of the accent, save the danger, so that the grays read as one family with it.
 *
 * The backgrounds are three levels: the ground, which the canvas and the gaps between the panels show; the panel, which the palette and the inspector lie on; and the raised surface of what lies on them, a box, a button, the bars over the canvas. In the light scheme the panel and the raised surface are both white, as a border and a shadow lift a box off the grey ground; in the dark scheme light is what lifts, so each level is lighter than the one under it, the ground darkest. The colors drawn on them are the text and the quieter text of descriptions, the border of a box, a button, a field and a port, the dots of the grid, the accent of what is selected, focused or being connected, and the danger of a deletion. The dark scheme keeps the hue of each and lowers the chroma of the accent and the danger, so that they read as the same colors on a dark ground without glaring.
 */
const colors = {
  ground: { light: 'oklch(96% 0.006 265)', dark: 'oklch(16% 0.012 265)' },
  panel: { light: 'oklch(100% 0 0)', dark: 'oklch(21% 0.014 265)' },
  raised: { light: 'oklch(100% 0 0)', dark: 'oklch(27% 0.016 265)' },
  text: { light: 'oklch(24% 0.02 265)', dark: 'oklch(95% 0.008 265)' },
  mutedText: { light: 'oklch(42% 0.02 265)', dark: 'oklch(80% 0.015 265)' },
  border: { light: 'oklch(55% 0.02 265)', dark: 'oklch(62% 0.02 265)' },
  grid: { light: 'oklch(62% 0.015 265)', dark: 'oklch(50% 0.015 265)' },
  accent: { light: 'oklch(40% 0.19 265)', dark: 'oklch(78% 0.1 265)' },
  danger: { light: 'oklch(42% 0.16 27)', dark: 'oklch(78% 0.12 27)' },
};

/** Every color of text against every background it is set on, by the names of the colors: text, quieter text, the accent of a selected item or port and the danger of a deletion, on the ground, a panel and a raised surface. */
const pairs = [
  { text: 'text', background: 'ground' },
  { text: 'text', background: 'panel' },
  { text: 'text', background: 'raised' },
  { text: 'mutedText', background: 'ground' },
  { text: 'mutedText', background: 'panel' },
  { text: 'mutedText', background: 'raised' },
  { text: 'accent', background: 'panel' },
  { text: 'accent', background: 'raised' },
  { text: 'danger', background: 'raised' },
] as const;

/** The contrast ratio WCAG 2.2 Non-text Contrast requires of a component's boundary or state and of a graphic that tells something, against what lies next to it. */
const nonTextContrastRatio = Rational.fromBigInt(3n);

/** Every color drawn as a boundary, a state or a graphic against every background it lies on, by the names of the colors: the border of a box, a button, a field and a port on each level; a dot of the grid on the ground; the accent of a selected box on its surface, of a selected wire on the ground and of focus on a panel; and a wire, drawn in the color of text, on the ground. */
const boundaries = [
  { element: 'border', background: 'ground' },
  { element: 'border', background: 'panel' },
  { element: 'border', background: 'raised' },
  { element: 'grid', background: 'ground' },
  { element: 'accent', background: 'raised' },
  { element: 'accent', background: 'ground' },
  { element: 'accent', background: 'panel' },
  { element: 'text', background: 'ground' },
] as const;

/** The failure of a color drawn as a boundary, a state or a graphic whose contrast against its background falls short of what WCAG 2.2 Non-text Contrast requires. */
export class NonTextContrastShortfall extends Data.TaggedError('NonTextContrastShortfall')<{
  /** Why the pair falls short, naming the colors and the scheme. */
  readonly message: string;
}> {}

/**
 * What StyleX hands to the styles of the editor as `stylex.env`: the type scale and the space scale of Falkara Presentation written as CSS lengths, its line height, and the colors of the editor, each as the CSS `light-dark()` of its two schemes, which the `color-scheme` of the document chooses between. It fails when the library refuses the intent of the scales, when a color of text falls short of the contrast WCAG 2.2 Contrast (Enhanced) requires against a background it is set on, or when a color drawn as a boundary, a state or a graphic falls short of what WCAG 2.2 Non-text Contrast requires, in either scheme, so that the build that reads it stops with the reason.
 */
export const environment = Effect.gen(function* () {
  const steps = yield* Typography.scale(scaleOptions);
  const small = yield* Effect.fromOption(Array.findFirst(steps, (step) => step.position === -1));
  const body = yield* Effect.fromOption(Array.findFirst(steps, (step) => step.position === 0));
  const heading = yield* Effect.fromOption(Array.findFirst(steps, (step) => step.position === 1));
  const space = yield* Effect.forEach(
    yield* Space.scale({ maximumBodyFontSize: scaleOptions.maximumBodyFontSize }),
    Fluid.clamp,
  );
  // Every pair in both schemes, at the smallest step and the regular weight, where the contrast it needs is the highest.
  yield* Effect.forEach(['light', 'dark'] as const, (scheme) =>
    Effect.forEach(pairs, (pair) =>
      Color.verify({
        text: colors[pair.text][scheme],
        background: colors[pair.background][scheme],
        step: { minimumSize: small.minimumSize, maximumSize: small.maximumSize },
        fontWeight: 400,
      }),
    ),
  );
  // Every boundary in both schemes, decided on the exact colors as `Color.verify` decides.
  yield* Effect.forEach(['light', 'dark'] as const, (scheme) =>
    Effect.forEach(boundaries, (pair) =>
      Color.reaches(
        { text: colors[pair.element][scheme], background: colors[pair.background][scheme] },
        nonTextContrastRatio,
      ).pipe(
        Effect.flatMap((reached) =>
          reached
            ? Effect.void
            : Effect.fail(
                new NonTextContrastShortfall({
                  message: `Expected ${pair.element} on ${pair.background} in the ${scheme} scheme at a contrast of 3:1 at least, the ratio WCAG 2.2 Non-text Contrast requires`,
                }),
              ),
        ),
      ),
    ),
  );
  return {
    /** The steps of the type scale the editor sets text in: the small text of descriptions and ports, body text, and the headings of the panels. */
    fontSize: {
      small: yield* Fluid.clamp(small),
      body: yield* Fluid.clamp(body),
      heading: yield* Fluid.clamp(heading),
    },
    /** The line height of text as a factor of its font size, written as the division it is, which CSS computes to the number. */
    lineHeight: `calc(${Rational.format(Typography.lineHeightFactor)})`,
    /** The steps of the space scale the editor spaces its layout with, named by the count of the spacing unit each is: a half, one, one and a half, two and three. */
    space: {
      half: yield* Effect.fromOption(Array.get(space, 0)),
      one: yield* Effect.fromOption(Array.get(space, 1)),
      oneAndHalf: yield* Effect.fromOption(Array.get(space, 2)),
      two: yield* Effect.fromOption(Array.get(space, 3)),
      three: yield* Effect.fromOption(Array.get(space, 5)),
    },
    /** The colors of the editor, verified above, each the color of its light scheme or of its dark as the `color-scheme` of the element it is used on says, which `src/Styles.css` sets on the document. */
    color: Record.map(colors, (color) => `light-dark(${color.light}, ${color.dark})`),
  };
});
