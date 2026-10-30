import * as Fraction from '#src/Fraction';

/** The layout unit that WebKit and Chromium implement, the finest among the Baseline core browsers. Measured in rendered pixels, CSS pixels times the page zoom. */
export const layoutUnit = 1 / 64;

/**
 * The length of a CSS inch. Measured in CSS pixels.
 *
 * @see https://www.w3.org/TR/css-values-4/#absolute-lengths
 */
export const inch = 96;

/**
 * The number of CSS points in a CSS inch.
 *
 * @see https://www.w3.org/TR/css-values-4/#absolute-lengths
 */
export const pointsPerInch = 72;

/** The length of a CSS point, the inch shared by the points in it. Measured in CSS pixels. */
export const point = Fraction.makeUnsafe(BigInt(inch), BigInt(pointsPerInch));

/**
 * The number of vw units in the viewport width, as CSS defines 1vw as 1 % of it.
 *
 * @see https://www.w3.org/TR/css-values-4/#viewport-relative-lengths
 */
export const viewportWidthUnits = 100;
