import { Rational } from 'effect';

/** The layout unit that WebKit and Chromium implement, the finest among the Baseline core browsers, so that a rounding below it stays below the layout unit of every one of them. Measured in rendered pixels, CSS pixels times the page zoom. */
export const finestLayoutUnit = Rational.makeUnsafe(1n, 64n);

/** The layout unit that Gecko implements, its app unit, the coarsest among the Baseline core browsers, so that lengths apart by at least it fall on different points of the layout grid of every one of them. Measured in CSS pixels, as Gecko keeps 60 app units to the CSS pixel at every page zoom. */
export const coarsestLayoutUnit = Rational.makeUnsafe(1n, 60n);

/**
 * The length of a CSS inch. Measured in CSS pixels.
 *
 * @see https://www.w3.org/TR/2024/WD-css-values-4-20240312/#absolute-lengths
 */
export const inch = Rational.fromBigInt(96n);

/**
 * The number of CSS points in a CSS inch.
 *
 * @see https://www.w3.org/TR/2024/WD-css-values-4-20240312/#absolute-lengths
 */
export const pointsPerInch = Rational.fromBigInt(72n);

/** The length of a CSS point, the inch shared by the points in it. Measured in CSS pixels. */
export const point = Rational.divideUnsafe(
  // The points per inch are a positive constant, so the division never divides by zero.
  inch,
  pointsPerInch,
);

/**
 * The number of vw units in the viewport width, as CSS defines 1vw as 1 % of it.
 *
 * @see https://www.w3.org/TR/2024/WD-css-values-4-20240312/#viewport-relative-lengths
 */
export const viewportWidthUnits = Rational.fromBigInt(100n);
