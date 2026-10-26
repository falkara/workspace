/**
 * The minimum viewport width that WCAG 2.2 requires content to support. Measured in CSS pixels.
 *
 * @see https://www.w3.org/TR/WCAG22/#reflow
 */
export const minimumViewportWidth = 320;

/**
 * The zoom factor that WCAG 2.2 pairs with the minimum viewport width.
 *
 * @see https://www.w3.org/TR/WCAG22/#reflow
 */
export const zoomFactor = 4;

/** The maximum viewport width that the zoom factor scales the minimum viewport width to. Measured in CSS pixels. */
export const maximumViewportWidth = minimumViewportWidth * zoomFactor;
