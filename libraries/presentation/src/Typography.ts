import { Array, Result, Schema } from 'effect';

import * as Fraction from '#src/Fraction';
import * as Viewport from '#src/Viewport';

/** The default font size that the major browsers implement for the root element. Measured in CSS pixels. */
export const defaultFontSize = 16;

/**
 * The minimum font size that the major design systems implement. Measured in CSS pixels.
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

/** The maximum text growth factor from the minimum to the maximum viewport width that keeps text resizable by the text scale factor within the maximum page zoom factor. */
export const maximumTextGrowthFactor = Fraction.make(
  Viewport.viewportWidthFactor * (Viewport.maximumPageZoomFactor - 1),
  Viewport.viewportWidthFactor * (textScaleFactor - 1) +
    Viewport.maximumPageZoomFactor -
    textScaleFactor,
);

/** A ratio between consecutive steps of a type scale, greater than 1 so that every step is larger than the one below. */
const ScaleFactor = Fraction.Fraction.pipe(
  Schema.check(Fraction.isGreaterThanFraction(Fraction.one)),
);

/** A schema of the ratios of a type scale and the size its body text reaches at the maximum viewport width. */
export const ScaleOptions = Schema.Struct({
  /** The ratio between consecutive steps at the minimum viewport width. */
  minimumFactor: ScaleFactor,
  /** The ratio between consecutive steps at the maximum viewport width, greater than the minimum factor so that growth rises with the step. */
  maximumFactor: ScaleFactor,
  /** The font size of body text at the maximum viewport width, from the default font size, so that body text never shrinks, to the size the maximum text growth factor allows. Measured in CSS pixels. */
  maximumBodyFontSize: Schema.Finite.pipe(
    Schema.check(
      Schema.isGreaterThanOrEqualTo(defaultFontSize),
      Schema.isLessThanOrEqualTo(defaultFontSize * Fraction.toNumber(maximumTextGrowthFactor)),
    ),
  ),
}).pipe(
  Schema.check(
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

/** A step of a type scale, with its font size at the minimum and at the maximum viewport width. */
export interface Step {
  /** The position of the step, 0 for body text, positive above it and negative below. */
  readonly position: number;
  /** The font size at the minimum viewport width. Measured in CSS pixels. */
  readonly minimumSize: number;
  /** The font size at the maximum viewport width. Measured in CSS pixels. */
  readonly maximumSize: number;
}

/** The type scale from its lowest to its highest step: every step whose growth from the minimum to the maximum viewport width lies between 1 and the maximum text growth factor, and whose size stays at or above the minimum font size. */
export const scale = (
  options: ScaleOptions,
): Result.Result<ReadonlyArray<Step>, Schema.SchemaError> =>
  Result.map(Schema.decodeResult(ScaleOptions)(options), steps);

const steps = (options: ScaleOptions): ReadonlyArray<Step> => {
  const sizeAt = (base: Fraction.Fraction, factor: Fraction.Fraction, position: number) =>
    Fraction.multiply(base, Fraction.pow(factor, position));
  const minimumSize = (position: number) =>
    sizeAt(Fraction.fromNumber(defaultFontSize), options.minimumFactor, position);
  const maximumSize = (position: number) =>
    sizeAt(Fraction.fromNumber(options.maximumBodyFontSize), options.maximumFactor, position);
  const growth = (position: number) =>
    Fraction.divide(maximumSize(position), minimumSize(position));
  // A step that never shrinks is at its smallest at the minimum viewport width.
  const isLegible = (position: number) =>
    Fraction.isGreaterThanOrEqualTo(minimumSize(position), Fraction.fromNumber(minimumFontSize));
  const isGrowing = (position: number) =>
    Fraction.isGreaterThanOrEqualTo(growth(position), Fraction.one);
  const isResizable = (position: number) =>
    Fraction.isLessThanOrEqualTo(growth(position), maximumTextGrowthFactor);
  const lowestFrom = (position: number): number =>
    isGrowing(position - 1) && isLegible(position - 1) ? lowestFrom(position - 1) : position;
  const highestFrom = (position: number): number =>
    isResizable(position + 1) ? highestFrom(position + 1) : position;

  const lowest = lowestFrom(0);
  return Array.makeBy(highestFrom(0) - lowest + 1, (index) => ({
    position: lowest + index,
    minimumSize: Fraction.toNumber(minimumSize(lowest + index)),
    maximumSize: Fraction.toNumber(maximumSize(lowest + index)),
  }));
};
