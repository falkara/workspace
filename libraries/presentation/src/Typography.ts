import { Array, Exit, Schema } from 'effect';

import * as Fraction from '#src/Fraction';
import * as Viewport from '#src/Viewport';

/** The default font size that the Baseline core browsers implement for the root element until a reader sets their own. Measured in CSS pixels. */
export const defaultFontSize = 16;

/**
 * The smallest font size of the USWDS theme type scale. Measured in CSS pixels.
 *
 * @see https://designsystem.digital.gov/design-tokens/typesetting/font/#theme-typescale
 */
export const minimumFontSize = 12;

/**
 * The text scale factor that WCAG 2.2 requires content to support.
 *
 * @see https://www.w3.org/TR/WCAG22/#resize-text
 */
export const textScaleFactor = 2;

/** The maximum text growth factor from the minimum to the maximum viewport width that keeps text resizable by the text scale factor within the maximum page zoom factor, whether a reader zooms the page or sets a larger font size, as both act alike on fluid text. */
export const maximumTextGrowthFactor = Fraction.make(
  BigInt(Viewport.viewportWidthFactor * (Viewport.maximumPageZoomFactor - 1)),
  BigInt(
    Viewport.viewportWidthFactor * (textScaleFactor - 1) +
      Viewport.maximumPageZoomFactor -
      textScaleFactor,
  ),
);

/** A schema of the ratios of a type scale and the size its body text reaches at the maximum viewport width. */
export const ScaleOptions = Schema.Struct({
  /** The ratio between consecutive steps at the minimum viewport width, greater than 1 so that every step is larger than the one below. */
  minimumFactor: Fraction.Fraction.pipe(Schema.check(Fraction.isGreaterThanFraction(Fraction.one))),
  /** The ratio between consecutive steps at the maximum viewport width, greater than 1 so that every step is larger than the one below. */
  maximumFactor: Fraction.Fraction.pipe(Schema.check(Fraction.isGreaterThanFraction(Fraction.one))),
  /** The font size of body text at the maximum viewport width, from the default font size, so that body text never shrinks, to the size the maximum text growth factor allows. Measured in CSS pixels. */
  maximumBodyFontSize: Fraction.Fraction.pipe(
    Schema.check(
      Fraction.isGreaterThanOrEqualToFraction(Fraction.make(BigInt(defaultFontSize), 1n)),
      Fraction.isLessThanOrEqualToFraction(
        Fraction.multiply(Fraction.make(BigInt(defaultFontSize), 1n), maximumTextGrowthFactor),
      ),
    ),
  ),
}).pipe(
  Schema.check(
    /** The maximum factor greater than the minimum factor, so that growth rises with the step and the scale ends. */
    Schema.makeFilter(
      (options) =>
        Fraction.isGreaterThan(options.maximumFactor, options.minimumFactor) || {
          path: ['maximumFactor'],
          issue: 'Expected a factor greater than the minimum factor',
        },
    ),
  ),
);

/** The ratios of a type scale and the size its body text reaches at the maximum viewport width. */
export type ScaleOptions = typeof ScaleOptions.Type;

/** A step of the type scale, with its size at the minimum and at the maximum viewport width. */
export interface Step {
  /** The position of the step, 0 for body text, positive above it and negative below. */
  readonly position: number;
  /** The size at the minimum viewport width. Measured in CSS pixels. */
  readonly minimumSize: number;
  /** The size at the maximum viewport width. Measured in CSS pixels. */
  readonly maximumSize: number;
}

/** The type scale from its lowest to its highest step: every step whose growth from the minimum to the maximum viewport width lies between 1 and the maximum text growth factor, and whose size stays at or above the minimum font size. */
export const scale = (options: ScaleOptions): Exit.Exit<ReadonlyArray<Step>, Schema.SchemaError> =>
  Exit.map(Schema.decodeExit(ScaleOptions)(options, { errors: 'all' }), (options) => {
    const minimumSize = (position: bigint) =>
      Fraction.multiply(
        Fraction.make(BigInt(defaultFontSize), 1n),
        Fraction.pow(options.minimumFactor, position),
      );
    const maximumSize = (position: bigint) =>
      Fraction.multiply(options.maximumBodyFontSize, Fraction.pow(options.maximumFactor, position));
    const isAdmitted = (position: bigint) => {
      const growth = Fraction.divide(maximumSize(position), minimumSize(position));
      // A step that never shrinks is at its smallest at the minimum viewport width.
      return (
        Fraction.isGreaterThanOrEqualTo(growth, Fraction.one) &&
        Fraction.isLessThanOrEqualTo(growth, maximumTextGrowthFactor) &&
        Fraction.isGreaterThanOrEqualTo(
          minimumSize(position),
          Fraction.make(BigInt(minimumFontSize), 1n),
        )
      );
    };
    // Growth and size both rise with the position, so the admitted steps run unbroken from the lowest to the highest.
    const lowestFrom = (position: bigint): bigint =>
      isAdmitted(position - 1n) ? lowestFrom(position - 1n) : position;
    const highestFrom = (position: bigint): bigint =>
      isAdmitted(position + 1n) ? highestFrom(position + 1n) : position;
    const lowest = lowestFrom(0n);
    return Array.makeBy(Number(highestFrom(0n) - lowest) + 1, (index) => ({
      position: Number(lowest) + index,
      minimumSize: Fraction.toNumber(minimumSize(lowest + BigInt(index))),
      maximumSize: Fraction.toNumber(maximumSize(lowest + BigInt(index))),
    }));
  });
