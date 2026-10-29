/**
 * The minimum viewport width that WCAG 2.2 requires content to support. Measured in CSS pixels.
 *
 * @see https://www.w3.org/TR/WCAG22/#reflow
 */
export const minimumViewportWidth = 320;

/**
 * The ratio of the maximum to the minimum viewport width, the page zoom factor at which WCAG 2.2 equates a desktop viewport with the minimum viewport width.
 *
 * @see https://www.w3.org/TR/WCAG22/#reflow
 */
export const viewportWidthFactor = 4;

/** The maximum viewport width, at and beyond which fluid values hold their largest size. Measured in CSS pixels. */
export const maximumViewportWidth = minimumViewportWidth * viewportWidthFactor;

/** The maximum page zoom factor that Safari implements, the lowest among the Baseline core browsers. */
export const maximumPageZoomFactor = 3;
