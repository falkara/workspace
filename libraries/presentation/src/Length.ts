import * as Fraction from '#src/Fraction';
import * as Typography from '#src/Typography';
import * as Viewport from '#src/Viewport';

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
export const point = Fraction.make(BigInt(inch), BigInt(pointsPerInch));

/**
 * The number of vw units in the viewport width, as CSS defines 1vw as 1 % of it.
 *
 * @see https://www.w3.org/TR/css-values-4/#viewport-relative-lengths
 */
export const viewportWidthUnits = 100;

/** The fewest decimal places that keep the rounding of a CSS length below the layout unit, for a reader who both zooms the page and sets the font size up to the maximum page zoom factor, as the layout unit counts zoomed pixels. */
export const decimalPlaces =
  Math.floor(
    Math.log10(
      (Viewport.maximumPageZoomFactor *
        (Typography.defaultFontSize * Viewport.maximumPageZoomFactor +
          Viewport.maximumViewportWidth / viewportWidthUnits)) /
        (2 * layoutUnit),
    ),
  ) + 1;

/** The CSS rem length of a size, rounded to the decimal places. Measured in CSS pixels. */
export const rem = (size: number): string =>
  `${Math.round((size / Typography.defaultFontSize) * 10 ** decimalPlaces) / 10 ** decimalPlaces}rem`;

/** The CSS vw length of a share of the viewport width, rounded to the decimal places. The share measured in viewport widths, so that 1 is the whole width. */
export const vw = (share: number): string =>
  `${Math.round(share * viewportWidthUnits * 10 ** decimalPlaces) / 10 ** decimalPlaces}vw`;
