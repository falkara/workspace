/**
 * The minimum viewport width that WCAG 2.2 requires content to support. Measured in CSS pixels.
 *
 * @see https://www.w3.org/TR/WCAG22/#reflow
 */
export const minimumViewportWidth = 320;

/**
 * The viewport width factor that WCAG 2.2 pairs with the minimum viewport width as a page zoom.
 *
 * @see https://www.w3.org/TR/WCAG22/#reflow
 */
export const viewportWidthFactor = 4;

/** The maximum viewport width that the viewport width factor scales the minimum viewport width to. Measured in CSS pixels. */
export const maximumViewportWidth = minimumViewportWidth * viewportWidthFactor;

/** The maximum page zoom factor that Safari implements, the lowest among the major browsers. */
export const maximumPageZoomFactor = 3;
