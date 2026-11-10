import { Array, Exit, Option, Rational, Schema } from 'effect';

import * as Length from '#src/Length';
import * as Viewport from '#src/Viewport';

/** The default font size that the Baseline core browsers implement for the root element until a reader sets their own. Measured in CSS pixels. */
export const defaultFontSize = Rational.fromBigInt(16n);

/** The largest default font size that Chromium and Firefox let a reader set, the highest maximum among the Baseline core browsers, as Safari lets a reader set none. Measured in CSS pixels. */
export const highestMaximumDefaultFontSize = Rational.fromBigInt(72n);

/** The factor by which a reader enlarges the default font size at most in any Baseline core browser, the highest maximum default font size over the default font size. What must hold however large a reader sets the font size rests on it. */
export const highestMaximumFontSizeFactor = Rational.divideUnsafe(
  // The default font size is a positive constant, so the division never divides by zero.
  highestMaximumDefaultFontSize,
  defaultFontSize,
);

/** The factor by which a reader enlarges the default font size at most in every Baseline core browser: 1, as Safari lets a reader set no default font size, so that nothing a reader must be able to reach can rest on setting a larger font size, and resizing text rests on page zoom alone. */
export const lowestMaximumFontSizeFactor = Rational.fromBigInt(1n);

/** The fewest decimal places that keep the rounding of a CSS length below the finest layout unit, for a reader who both zooms the page as far as any Baseline core browser allows and sets the largest default font size any of them allows, as the finest layout unit counts zoomed pixels. Every length a message gives is rounded to them too, so that it reads as CSS writes it. */
export const decimalPlaces =
  Math.floor(
    Math.log10(
      Rational.toNumberUnsafe(
        // The finest layout unit and the vw units are positive constants, so neither division divides by zero.
        Rational.divideUnsafe(
          Rational.multiply(
            Viewport.highestMaximumPageZoomFactor,
            Rational.sum(
              Rational.multiply(defaultFontSize, highestMaximumFontSizeFactor),
              Rational.divideUnsafe(Viewport.maximumViewportWidth, Length.viewportWidthUnits),
            ),
          ),
          Rational.multiply(Rational.fromBigInt(2n), Length.finestLayoutUnit),
        ),
      ),
    ),
  ) + 1;

/**
 * The smallest size of the USWDS 3 theme type scale in its default settings, taken as a CSS font size. USWDS 3 sets it as a target for a typeface whose capitals are 0.362 em high and writes the font size of each typeface scaled to that cap height: 13 px for its system typefaces and Public Sans, about 13.84 px for Source Sans Pro, its default for body text, and about 12.68 px for Merriweather, its default for headings. Measured in CSS pixels.
 *
 * @see https://designsystem.digital.gov/design-tokens/typesetting/font-size/#theme-tokens
 */
export const minimumFontSize = Rational.fromBigInt(13n);

/**
 * The advance of an ideograph, as a factor of the font size, that CSS Values 4 assumes for the ic unit when it cannot be measured: a full-width character, which no line break can split.
 *
 * @see https://www.w3.org/TR/2024/WD-css-values-4-20240312/#ic
 */
export const ideographAdvanceFactor = Rational.fromBigInt(1n);

/** The largest font size at the minimum viewport width, at which a full-width character still fits the minimum viewport width when a reader sets the largest default font size any Baseline core browser allows, so that text reflows without scrolling in two dimensions, as WCAG 2.2 Reflow requires. Page zoom needs no share of it, as WCAG 2.2 Reflow already counts the minimum viewport width in zoomed CSS pixels. Measured in CSS pixels. */
export const maximumFontSize = Rational.divideUnsafe(
  // Both factors are positive constants, so the division by their product never divides by zero.
  Viewport.minimumViewportWidth,
  Rational.multiply(highestMaximumFontSizeFactor, ideographAdvanceFactor),
);

/** The smallest ratio between consecutive steps of a type scale, at which steps at the minimum font size still differ by the coarsest layout unit, so that a length of at least 1 em, such as the line height, falls on a different point of the layout grid in consecutive steps in every Baseline core browser and no two steps lay out alike. It promises nothing about how glyphs render, as the browsers keep the font size itself unrounded. */
export const minimumStepFactor = Rational.sum(
  Rational.fromBigInt(1n),
  // The minimum font size is a positive constant, so the division never divides by zero.
  Rational.divideUnsafe(Length.coarsestLayoutUnit, minimumFontSize),
);

/**
 * The text scale factor that WCAG 2.2 requires content to support.
 *
 * @see https://www.w3.org/TR/WCAG22/#resize-text
 */
export const textScaleFactor = Rational.fromBigInt(2n);

/**
 * The lightest font weight that CSS Fonts allows.
 *
 * @see https://www.w3.org/TR/2026/WD-css-fonts-4-20261104/#font-weight-prop
 */
export const minimumFontWeight = 1;

/**
 * The heaviest font weight that CSS Fonts allows.
 *
 * @see https://www.w3.org/TR/2026/WD-css-fonts-4-20261104/#font-weight-prop
 */
export const maximumFontWeight = 1000;

/**
 * The font weight that CSS Fonts gives the bold keyword.
 *
 * @see https://www.w3.org/TR/2026/WD-css-fonts-4-20261104/#font-weight-prop
 */
export const boldFontWeight = 700;

/**
 * The line height that WCAG 2.2 Visual Presentation requires within paragraphs, space-and-a-half, as a factor of the font size, the measure its sufficient technique C21 and Text Spacing take.
 *
 * @see https://www.w3.org/TR/WCAG22/#visual-presentation
 * @see https://www.w3.org/WAI/WCAG22/Techniques/css/C21
 */
export const lineHeightFactor = Rational.makeUnsafe(3n, 2n);

/**
 * The text alignment that keeps text unjustified, as WCAG 2.2 Visual Presentation requires, aligned to the start of each line in every writing direction.
 *
 * @see https://www.w3.org/TR/WCAG22/#visual-presentation
 * @see https://www.w3.org/TR/2026/CRD-css-text-3-20260814/#text-align-property
 */
export const textAlignment = 'start';

/**
 * The factor by which WCAG 2.2 Visual Presentation requires the space between paragraphs to be larger than the line spacing.
 *
 * @see https://www.w3.org/TR/WCAG22/#visual-presentation
 */
export const paragraphSpacingLineFactor = Rational.makeUnsafe(3n, 2n);

/** The space between paragraphs, the line height grown by the paragraph spacing line factor, as a factor of the font size. Applied in `lh` instead, the paragraph spacing line factor keeps paragraphs apart by the line spacing a reader sets. */
export const paragraphSpacingFactor = Rational.multiply(
  lineHeightFactor,
  paragraphSpacingLineFactor,
);

/**
 * The line height, as a factor of the font size, that WCAG 2.2 Text Spacing lets a reader set without loss of content or function.
 *
 * @see https://www.w3.org/TR/WCAG22/#text-spacing
 */
export const textSpacingLineHeightFactor = Rational.makeUnsafe(3n, 2n);

/**
 * The spacing following paragraphs, as a factor of the font size, that WCAG 2.2 Text Spacing lets a reader set without loss of content or function.
 *
 * @see https://www.w3.org/TR/WCAG22/#text-spacing
 */
export const textSpacingParagraphSpacingFactor = Rational.fromBigInt(2n);

/**
 * The letter spacing, as a factor of the font size, that WCAG 2.2 Text Spacing lets a reader set without loss of content or function.
 *
 * @see https://www.w3.org/TR/WCAG22/#text-spacing
 */
export const textSpacingLetterSpacingFactor = Rational.makeUnsafe(3n, 25n);

/**
 * The word spacing, as a factor of the font size, that WCAG 2.2 Text Spacing lets a reader set without loss of content or function.
 *
 * @see https://www.w3.org/TR/WCAG22/#text-spacing
 */
export const textSpacingWordSpacingFactor = Rational.makeUnsafe(4n, 25n);

/** The maximum text growth factor from the minimum to the maximum viewport width that keeps text resizable by the text scale factor within the lowest maximum page zoom factor, so that a reader in every Baseline core browser reaches it by zooming, as setting a larger font size reaches nothing in Safari. A larger font size acts on fluid text as page zoom does. Each factor enters less 1, as its growth beyond 1, so that every difference is positive while every factor is above 1. */
export const maximumTextGrowthFactor = Rational.divideUnsafe(
  // Every factor is a constant above 1, so the sum of their growths is positive and the division never divides by zero.
  Rational.multiply(
    Viewport.viewportWidthFactor,
    Rational.subtract(Viewport.lowestMaximumPageZoomFactor, Rational.fromBigInt(1n)),
  ),
  Rational.sum(
    Rational.multiply(
      Rational.subtract(Viewport.viewportWidthFactor, Rational.fromBigInt(1n)),
      Rational.subtract(textScaleFactor, Rational.fromBigInt(1n)),
    ),
    Rational.subtract(Viewport.lowestMaximumPageZoomFactor, Rational.fromBigInt(1n)),
  ),
);

/** A schema of the ratios of a type scale and the size its body text reaches at the maximum viewport width. */
export const ScaleOptions = Schema.Struct({
  /** The ratio between consecutive steps at the minimum viewport width, at least the minimum step factor so that every step is larger than the one below and no two steps lay out alike. */
  minimumFactor: Schema.Rational.pipe(
    Schema.check(
      Schema.makeIsGreaterThanOrEqualTo({ order: Rational.Order, formatter: Rational.format })(
        minimumStepFactor,
        {
          message: `Expected a minimum factor of at least ${Rational.format(minimumStepFactor)}, so that every step is larger than the one below and lengths of at least 1 em in consecutive steps never fall on the same point of the layout grid of a browser`,
        },
      ),
    ),
  ),
  /** The ratio between consecutive steps at the maximum viewport width, at least the minimum step factor so that every step is larger than the one below and no two steps lay out alike. */
  maximumFactor: Schema.Rational.pipe(
    Schema.check(
      Schema.makeIsGreaterThanOrEqualTo({ order: Rational.Order, formatter: Rational.format })(
        minimumStepFactor,
        {
          message: `Expected a maximum factor of at least ${Rational.format(minimumStepFactor)}, so that every step is larger than the one below and lengths of at least 1 em in consecutive steps never fall on the same point of the layout grid of a browser`,
        },
      ),
    ),
  ),
  /** The font size of body text at the maximum viewport width, from the default font size, so that body text never shrinks, to the size the maximum text growth factor allows. Measured in CSS pixels. */
  maximumBodyFontSize: Schema.Rational.pipe(
    Schema.check(
      Schema.makeIsGreaterThanOrEqualTo({ order: Rational.Order, formatter: Rational.format })(
        defaultFontSize,
        {
          message: `Expected a body font size of at least ${Math.round(Rational.toNumberUnsafe(defaultFontSize) * 10 ** decimalPlaces) / 10 ** decimalPlaces} px, so that body text never shrinks below the default font size of browsers`,
        },
      ),
      Schema.makeIsLessThanOrEqualTo({ order: Rational.Order, formatter: Rational.format })(
        Rational.multiply(defaultFontSize, maximumTextGrowthFactor),
        {
          message: `Expected a body font size of at most ${Math.round(Rational.toNumberUnsafe(Rational.multiply(defaultFontSize, maximumTextGrowthFactor)) * 10 ** decimalPlaces) / 10 ** decimalPlaces} px, so that text can be enlarged to ${Rational.toNumberUnsafe(Rational.multiply(textScaleFactor, Rational.fromBigInt(100n)))} %, as WCAG 2.2 Resize Text requires, within the ${Rational.toNumberUnsafe(Rational.multiply(Viewport.lowestMaximumPageZoomFactor, Rational.fromBigInt(100n)))} % page zoom of Safari, the lowest maximum among the Baseline core browsers`,
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
  minimumSize: Schema.Rational.pipe(
    Schema.check(
      Schema.makeIsGreaterThanOrEqualTo({ order: Rational.Order, formatter: Rational.format })(
        minimumFontSize,
        {
          message: `Expected a minimum size of at least ${Math.round(Rational.toNumberUnsafe(minimumFontSize) * 10 ** decimalPlaces) / 10 ** decimalPlaces} px, the smallest size of the USWDS 3 theme type scale`,
        },
      ),
      Schema.makeIsLessThanOrEqualTo({ order: Rational.Order, formatter: Rational.format })(
        maximumFontSize,
        {
          message: `Expected a minimum size of at most ${Math.round(Rational.toNumberUnsafe(maximumFontSize) * 10 ** decimalPlaces) / 10 ** decimalPlaces} px, so that a full-width character fits the minimum viewport width of ${Math.round(Rational.toNumberUnsafe(Viewport.minimumViewportWidth) * 10 ** decimalPlaces) / 10 ** decimalPlaces} px at a font size of ${Rational.toNumberUnsafe(Rational.multiply(highestMaximumFontSizeFactor, Rational.fromBigInt(100n)))} %, as WCAG 2.2 Reflow requires`,
        },
      ),
    ),
  ),
  /** The size at the maximum viewport width. Measured in CSS pixels. */
  maximumSize: Schema.Rational,
}).pipe(
  Schema.check(
    /** The maximum size from the minimum size, so that the step never shrinks and its smallest size is the one at the minimum viewport width, to the minimum size grown by the maximum text growth factor, so that its text stays resizable. */
    Schema.makeFilter(
      (step) =>
        (Rational.isGreaterThanOrEqualTo(step.maximumSize, step.minimumSize) &&
          Rational.isLessThanOrEqualTo(
            step.maximumSize,
            Rational.multiply(step.minimumSize, maximumTextGrowthFactor),
          )) || {
          path: ['maximumSize'],
          issue: `Expected a maximum size of ${Math.round(Rational.toNumberUnsafe(step.minimumSize) * 10 ** decimalPlaces) / 10 ** decimalPlaces} px to ${Math.round(Rational.toNumberUnsafe(Rational.multiply(step.minimumSize, maximumTextGrowthFactor)) * 10 ** decimalPlaces) / 10 ** decimalPlaces} px, so that the step never shrinks below its size at the minimum viewport width and grows no faster than text that can be enlarged to ${Rational.toNumberUnsafe(Rational.multiply(textScaleFactor, Rational.fromBigInt(100n)))} %, as WCAG 2.2 Resize Text requires, within the ${Rational.toNumberUnsafe(Rational.multiply(Viewport.lowestMaximumPageZoomFactor, Rational.fromBigInt(100n)))} % page zoom of Safari, the lowest maximum among the Baseline core browsers`,
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
    // A step never shrinks, so that it is at its smallest at the minimum viewport width, grows by no more than the maximum text growth factor, and lies at that width between the minimum and the maximum font size. The growth is bounded by comparing the sizes, so that no divisor is sought between two large numerators.
    const isAdmitted = (step: Step): boolean =>
      Rational.isGreaterThanOrEqualTo(step.maximumSize, step.minimumSize) &&
      Rational.isLessThanOrEqualTo(
        step.maximumSize,
        Rational.multiply(step.minimumSize, maximumTextGrowthFactor),
      ) &&
      Rational.isGreaterThanOrEqualTo(step.minimumSize, minimumFontSize) &&
      Rational.isLessThanOrEqualTo(step.minimumSize, maximumFontSize);
    // Size rises with the position and growth rises or falls with it, so the admitted steps run unbroken from body text, which the options admit, down to the lowest and up to the highest, and the font sizes bound them on both sides. Each step is the one before it divided or multiplied by the factors once, rather than a power of the factors worked out again for every step.
    // The factors decode only from the minimum step factor up, so they are above 1 and no division by them divides by zero.
    const below = Array.unfold(
      {
        position: -1,
        minimumSize: Rational.divideUnsafe(defaultFontSize, options.minimumFactor),
        maximumSize: Rational.divideUnsafe(options.maximumBodyFontSize, options.maximumFactor),
      },
      (step): Option.Option<readonly [Step, Step]> =>
        isAdmitted(step)
          ? Option.some([
              step,
              {
                position: step.position - 1,
                minimumSize: Rational.divideUnsafe(step.minimumSize, options.minimumFactor),
                maximumSize: Rational.divideUnsafe(step.maximumSize, options.maximumFactor),
              },
            ])
          : Option.none(),
    );
    const above = Array.unfold(
      {
        position: 1,
        minimumSize: Rational.multiply(defaultFontSize, options.minimumFactor),
        maximumSize: Rational.multiply(options.maximumBodyFontSize, options.maximumFactor),
      },
      (step): Option.Option<readonly [Step, Step]> =>
        isAdmitted(step)
          ? Option.some([
              step,
              {
                position: step.position + 1,
                minimumSize: Rational.multiply(step.minimumSize, options.minimumFactor),
                maximumSize: Rational.multiply(step.maximumSize, options.maximumFactor),
              },
            ])
          : Option.none(),
    );
    return [
      ...Array.reverse(below),
      { position: 0, minimumSize: defaultFontSize, maximumSize: options.maximumBodyFontSize },
      ...above,
    ];
  });
