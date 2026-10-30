import { Array, Exit, Schema } from 'effect';

import * as Fraction from '#src/Fraction';
import * as Length from '#src/Length';
import * as Viewport from '#src/Viewport';

/** The default font size that the Baseline core browsers implement for the root element until a reader sets their own. Measured in CSS pixels. */
export const defaultFontSize = Fraction.makeUnsafe(16n, 1n);

/** The largest default font size that Chromium and Firefox let a reader set, the highest maximum among the Baseline core browsers, as Safari lets a reader set none. Measured in CSS pixels. */
export const highestMaximumDefaultFontSize = Fraction.makeUnsafe(72n, 1n);

/** The factor by which a reader enlarges the default font size at most in any Baseline core browser, the highest maximum default font size over the default font size. What must hold however large a reader sets the font size rests on it. */
export const highestMaximumFontSizeFactor = Fraction.divide(
  highestMaximumDefaultFontSize,
  defaultFontSize,
);

/** The factor by which a reader enlarges the default font size at most in every Baseline core browser: 1, as Safari lets a reader set no default font size, so that nothing a reader must be able to reach can rest on setting a larger font size, and resizing text rests on page zoom alone. */
export const lowestMaximumFontSizeFactor = Fraction.one;

/**
 * The smallest font size of the USWDS theme type scale in its default settings. Measured in CSS pixels.
 *
 * @see https://designsystem.digital.gov/design-tokens/typesetting/font-size/#theme-tokens
 */
export const minimumFontSize = Fraction.makeUnsafe(13n, 1n);

/**
 * The advance of an ideograph, as a factor of the font size, that CSS Values 4 assumes for the ic unit when it cannot be measured: a full-width character, which no line break can split.
 *
 * @see https://www.w3.org/TR/css-values-4/#ic
 */
export const ideographAdvanceFactor = Fraction.makeUnsafe(1n, 1n);

/** The largest font size at the minimum viewport width, at which a full-width character still fits the minimum viewport width when a reader sets the largest default font size any Baseline core browser allows, so that text reflows without scrolling in two dimensions, as WCAG 2.2 Reflow requires. Page zoom needs no share of it, as WCAG 2.2 Reflow already counts the minimum viewport width in zoomed CSS pixels. Measured in CSS pixels. */
export const maximumFontSize = Fraction.divide(
  Viewport.minimumViewportWidth,
  Fraction.multiply(highestMaximumFontSizeFactor, ideographAdvanceFactor),
);

/** The smallest ratio between consecutive steps of a type scale, at which steps at the minimum font size still differ by the coarsest layout unit, so that a length of at least 1 em, such as the line height, falls on a different point of the layout grid in consecutive steps in every Baseline core browser and no two steps lay out alike. It promises nothing about how glyphs render, as the browsers keep the font size itself unrounded. */
export const minimumStepFactor = Fraction.sum(
  Fraction.one,
  Fraction.divide(Length.coarsestLayoutUnit, minimumFontSize),
);

/**
 * The text scale factor that WCAG 2.2 requires content to support.
 *
 * @see https://www.w3.org/TR/WCAG22/#resize-text
 */
export const textScaleFactor = Fraction.makeUnsafe(2n, 1n);

/**
 * The lightest font weight that CSS Fonts allows.
 *
 * @see https://www.w3.org/TR/css-fonts-4/#font-weight-prop
 */
export const minimumFontWeight = 1;

/**
 * The heaviest font weight that CSS Fonts allows.
 *
 * @see https://www.w3.org/TR/css-fonts-4/#font-weight-prop
 */
export const maximumFontWeight = 1000;

/**
 * The font weight that CSS Fonts gives the bold keyword.
 *
 * @see https://www.w3.org/TR/css-fonts-4/#font-weight-prop
 */
export const boldFontWeight = 700;

/**
 * The line height that WCAG 2.2 Visual Presentation requires within paragraphs, space-and-a-half, as a factor of the font size, the measure its sufficient technique C21 and Text Spacing take.
 *
 * @see https://www.w3.org/TR/WCAG22/#visual-presentation
 * @see https://www.w3.org/WAI/WCAG22/Techniques/css/C21
 */
export const lineHeightFactor = Fraction.makeUnsafe(3n, 2n);

/**
 * The text alignment that keeps text unjustified, as WCAG 2.2 Visual Presentation requires, aligned to the start of each line in every writing direction.
 *
 * @see https://www.w3.org/TR/WCAG22/#visual-presentation
 * @see https://www.w3.org/TR/css-text-3/#text-align-property
 */
export const textAlignment = 'start';

/**
 * The factor by which WCAG 2.2 Visual Presentation requires the space between paragraphs to be larger than the line spacing.
 *
 * @see https://www.w3.org/TR/WCAG22/#visual-presentation
 */
export const paragraphSpacingLineFactor = Fraction.makeUnsafe(3n, 2n);

/** The space between paragraphs, the line height grown by the paragraph spacing line factor, as a factor of the font size. Applied in `lh` instead, the paragraph spacing line factor keeps paragraphs apart by the line spacing a reader sets. */
export const paragraphSpacingFactor = Fraction.multiply(
  lineHeightFactor,
  paragraphSpacingLineFactor,
);

/**
 * The line height, as a factor of the font size, that WCAG 2.2 Text Spacing lets a reader set without loss of content or function.
 *
 * @see https://www.w3.org/TR/WCAG22/#text-spacing
 */
export const textSpacingLineHeightFactor = Fraction.makeUnsafe(3n, 2n);

/**
 * The spacing following paragraphs, as a factor of the font size, that WCAG 2.2 Text Spacing lets a reader set without loss of content or function.
 *
 * @see https://www.w3.org/TR/WCAG22/#text-spacing
 */
export const textSpacingParagraphSpacingFactor = Fraction.makeUnsafe(2n, 1n);

/**
 * The letter spacing, as a factor of the font size, that WCAG 2.2 Text Spacing lets a reader set without loss of content or function.
 *
 * @see https://www.w3.org/TR/WCAG22/#text-spacing
 */
export const textSpacingLetterSpacingFactor = Fraction.makeUnsafe(3n, 25n);

/**
 * The word spacing, as a factor of the font size, that WCAG 2.2 Text Spacing lets a reader set without loss of content or function.
 *
 * @see https://www.w3.org/TR/WCAG22/#text-spacing
 */
export const textSpacingWordSpacingFactor = Fraction.makeUnsafe(4n, 25n);

/** The maximum text growth factor from the minimum to the maximum viewport width that keeps text resizable by the text scale factor within the lowest maximum page zoom factor, so that a reader in every Baseline core browser reaches it by zooming, as setting a larger font size reaches nothing in Safari. A larger font size acts on fluid text as page zoom does. Each factor enters less 1, as its growth beyond 1, so that every difference is positive while every factor is above 1. */
export const maximumTextGrowthFactor = Fraction.divide(
  Fraction.multiply(
    Viewport.viewportWidthFactor,
    Fraction.subtractUnsafe(Viewport.lowestMaximumPageZoomFactor, Fraction.one),
  ),
  Fraction.sum(
    Fraction.multiply(
      Fraction.subtractUnsafe(Viewport.viewportWidthFactor, Fraction.one),
      Fraction.subtractUnsafe(textScaleFactor, Fraction.one),
    ),
    Fraction.subtractUnsafe(Viewport.lowestMaximumPageZoomFactor, Fraction.one),
  ),
);

/** A schema of the ratios of a type scale and the size its body text reaches at the maximum viewport width. */
export const ScaleOptions = Schema.Struct({
  /** The ratio between consecutive steps at the minimum viewport width, at least the minimum step factor so that every step is larger than the one below and no two steps lay out alike. */
  minimumFactor: Fraction.Fraction.pipe(
    Schema.check(
      Fraction.isGreaterThanOrEqualToFraction(minimumStepFactor, {
        message: `Expected a minimum factor of at least ${Fraction.format(minimumStepFactor)}, so that every step is larger than the one below and lengths of at least 1 em in consecutive steps never fall on the same point of the layout grid of a browser`,
      }),
    ),
  ),
  /** The ratio between consecutive steps at the maximum viewport width, at least the minimum step factor so that every step is larger than the one below and no two steps lay out alike. */
  maximumFactor: Fraction.Fraction.pipe(
    Schema.check(
      Fraction.isGreaterThanOrEqualToFraction(minimumStepFactor, {
        message: `Expected a maximum factor of at least ${Fraction.format(minimumStepFactor)}, so that every step is larger than the one below and lengths of at least 1 em in consecutive steps never fall on the same point of the layout grid of a browser`,
      }),
    ),
  ),
  /** The font size of body text at the maximum viewport width, from the default font size, so that body text never shrinks, to the size the maximum text growth factor allows. Measured in CSS pixels. */
  maximumBodyFontSize: Fraction.Fraction.pipe(
    Schema.check(
      Fraction.isGreaterThanOrEqualToFraction(defaultFontSize, {
        message: `Expected a body font size of at least ${Fraction.format(defaultFontSize)} px, so that body text never shrinks below the default font size of browsers`,
      }),
      Fraction.isLessThanOrEqualToFraction(
        Fraction.multiply(defaultFontSize, maximumTextGrowthFactor),
        {
          message: `Expected a body font size of at most ${Fraction.toNumber(Fraction.multiply(defaultFontSize, maximumTextGrowthFactor))} px, so that text can be enlarged to ${Fraction.format(Fraction.multiply(textScaleFactor, Fraction.makeUnsafe(100n, 1n)))} % within the ${Fraction.format(Fraction.multiply(Viewport.lowestMaximumPageZoomFactor, Fraction.makeUnsafe(100n, 1n)))} % page zoom of Safari, as WCAG 2.2 Resize Text requires`,
        },
      ),
    ),
  ),
});

/** The ratios of a type scale and the size its body text reaches at the maximum viewport width. */
export type ScaleOptions = typeof ScaleOptions.Type;

/** A schema of a step of the type scale, with its size at the minimum and at the maximum viewport width, so that a step written by hand holds what every step of a scale holds before its size decides the contrast its text needs. */
export const Step = Schema.Struct({
  /** The position of the step, 0 for body text, positive above it and negative below. */
  position: Schema.Int,
  /** The size at the minimum viewport width, its smallest, from the minimum to the maximum font size. Measured in CSS pixels. */
  minimumSize: Fraction.Fraction.pipe(
    Schema.check(
      Fraction.isGreaterThanOrEqualToFraction(minimumFontSize, {
        message: `Expected a minimum size of at least ${Fraction.format(minimumFontSize)} px, the smallest size of the USWDS theme type scale`,
      }),
      Fraction.isLessThanOrEqualToFraction(maximumFontSize, {
        message: `Expected a minimum size of at most ${Fraction.format(maximumFontSize)} px, so that a full-width character fits the minimum viewport width of ${Fraction.format(Viewport.minimumViewportWidth)} px at a font size of ${Fraction.format(Fraction.multiply(highestMaximumFontSizeFactor, Fraction.makeUnsafe(100n, 1n)))} %, as WCAG 2.2 Reflow requires`,
      }),
    ),
  ),
  /** The size at the maximum viewport width. Measured in CSS pixels. */
  maximumSize: Fraction.Fraction,
}).pipe(
  Schema.check(
    /** The maximum size from the minimum size, so that the step never shrinks and its smallest size is the one at the minimum viewport width, to the minimum size grown by the maximum text growth factor, so that its text stays resizable. */
    Schema.makeFilter(
      (step) =>
        (Fraction.isGreaterThanOrEqualTo(step.maximumSize, step.minimumSize) &&
          Fraction.isLessThanOrEqualTo(
            step.maximumSize,
            Fraction.multiply(step.minimumSize, maximumTextGrowthFactor),
          )) || {
          path: ['maximumSize'],
          issue: `Expected a maximum size of ${Fraction.toNumber(step.minimumSize)} px to ${Fraction.toNumber(Fraction.multiply(step.minimumSize, maximumTextGrowthFactor))} px, so that the step never shrinks below its size at the minimum viewport width and grows no faster than text that can be enlarged to ${Fraction.format(Fraction.multiply(textScaleFactor, Fraction.makeUnsafe(100n, 1n)))} % within the ${Fraction.format(Fraction.multiply(Viewport.lowestMaximumPageZoomFactor, Fraction.makeUnsafe(100n, 1n)))} % page zoom of Safari, as WCAG 2.2 Resize Text requires`,
        },
    ),
  ),
);

/** A step of the type scale, with its size at the minimum and at the maximum viewport width. */
export type Step = typeof Step.Type;

/** The type scale from its lowest to its highest step: every step whose growth from the minimum to the maximum viewport width lies between 1 and the maximum text growth factor, and whose size at the minimum viewport width lies between the minimum and the maximum font size. */
export const scale = (
  options: typeof ScaleOptions.Encoded,
): Exit.Exit<ReadonlyArray<Step>, Schema.SchemaError> =>
  Exit.map(Schema.decodeExit(ScaleOptions)(options, { errors: 'all' }), (options) => {
    const minimumSize = (position: bigint) =>
      Fraction.multiply(defaultFontSize, Fraction.pow(options.minimumFactor, position));
    const maximumSize = (position: bigint) =>
      Fraction.multiply(options.maximumBodyFontSize, Fraction.pow(options.maximumFactor, position));
    const isAdmitted = (position: bigint) => {
      // The growth is bounded by comparing the sizes, so that no divisor is sought between two large numerators. A step that never shrinks is at its smallest at the minimum viewport width.
      return (
        Fraction.isGreaterThanOrEqualTo(maximumSize(position), minimumSize(position)) &&
        Fraction.isLessThanOrEqualTo(
          maximumSize(position),
          Fraction.multiply(minimumSize(position), maximumTextGrowthFactor),
        ) &&
        Fraction.isGreaterThanOrEqualTo(minimumSize(position), minimumFontSize) &&
        Fraction.isLessThanOrEqualTo(minimumSize(position), maximumFontSize)
      );
    };
    // Size rises with the position and growth rises or falls with it, so the admitted steps run unbroken from the lowest to the highest, and the font sizes bound them on both sides.
    const lowestFrom = (position: bigint): bigint =>
      isAdmitted(position - 1n) ? lowestFrom(position - 1n) : position;
    const highestFrom = (position: bigint): bigint =>
      isAdmitted(position + 1n) ? highestFrom(position + 1n) : position;
    const lowest = lowestFrom(0n);
    return Array.makeBy(Number(highestFrom(0n) - lowest) + 1, (index) => ({
      position: Number(lowest) + index,
      minimumSize: minimumSize(lowest + BigInt(index)),
      maximumSize: maximumSize(lowest + BigInt(index)),
    }));
  });
