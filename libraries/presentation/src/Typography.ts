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
