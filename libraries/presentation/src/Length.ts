import * as Fraction from '#src/Fraction';

/** The layout unit that WebKit and Chromium implement, the finest among the Baseline core browsers, so that a rounding below it stays below the layout unit of every one of them. Measured in rendered pixels, CSS pixels times the page zoom. */
export const finestLayoutUnit = Fraction.makeUnsafe(1n, 64n);

/** The layout unit that Gecko implements, its app unit, the coarsest among the Baseline core browsers, so that lengths apart by at least it fall on different points of the layout grid of every one of them. Measured in CSS pixels, as Gecko keeps 60 app units to the CSS pixel at every page zoom. */
export const coarsestLayoutUnit = Fraction.makeUnsafe(1n, 60n);

/**
 * The length of a CSS inch. Measured in CSS pixels.
 *
 * @see https://www.w3.org/TR/css-values-4/#absolute-lengths
 */
export const inch = Fraction.makeUnsafe(96n, 1n);

/**
 * The number of CSS points in a CSS inch.
 *
 * @see https://www.w3.org/TR/css-values-4/#absolute-lengths
 */
export const pointsPerInch = Fraction.makeUnsafe(72n, 1n);

/** The length of a CSS point, the inch shared by the points in it. Measured in CSS pixels. */
export const point = Fraction.divide(inch, pointsPerInch);

/**
 * The number of vw units in the viewport width, as CSS defines 1vw as 1 % of it.
 *
 * @see https://www.w3.org/TR/css-values-4/#viewport-relative-lengths
 */
export const viewportWidthUnits = Fraction.makeUnsafe(100n, 1n);
