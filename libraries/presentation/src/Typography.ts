import * as Viewport from '#src/Viewport';

/**
 * The text scale factor that WCAG 2.2 requires content to support.
 *
 * @see https://www.w3.org/TR/WCAG22/#resize-text
 */
export const textScaleFactor = 2;

/** The maximum text growth factor from the minimum to the maximum viewport width that keeps text resizable by the text scale factor within the maximum page zoom factor. */
export const maximumTextGrowthFactor =
  (Viewport.viewportWidthFactor * (Viewport.maximumPageZoomFactor - 1)) /
  (Viewport.viewportWidthFactor * (textScaleFactor - 1) +
    Viewport.maximumPageZoomFactor -
    textScaleFactor);
