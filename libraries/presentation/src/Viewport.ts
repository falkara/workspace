import * as Fraction from '#src/Fraction';

/**
 * The minimum viewport width that WCAG 2.2 requires content to support. Measured in CSS pixels.
 *
 * @see https://www.w3.org/TR/WCAG22/#reflow
 */
export const minimumViewportWidth = Fraction.makeUnsafe(320n, 1n);

/**
 * The ratio of the maximum to the minimum viewport width, chosen as the 400 % page zoom by which an informative note of WCAG 2.2 Reflow equates a desktop viewport of 1280 CSS pixels with the minimum viewport width. WCAG 2.2 sets no maximum viewport width; fluid values need one to stay resizable, and a wider one would loosen the maximum text growth factor and spread growth over more screens.
 *
 * @see https://www.w3.org/TR/WCAG22/#reflow
 */
export const viewportWidthFactor = Fraction.makeUnsafe(4n, 1n);

/** The maximum viewport width, at and beyond which fluid values hold their largest size, so that text stays resizable on every wider screen. Measured in CSS pixels. */
export const maximumViewportWidth = Fraction.multiply(minimumViewportWidth, viewportWidthFactor);

/** The maximum page zoom factor that Safari implements, the lowest maximum among the Baseline core browsers, so that a reader reaches it in every one of them. What a reader must be able to reach by zooming rests on it. */
export const lowestMaximumPageZoomFactor = Fraction.makeUnsafe(3n, 1n);

/** The maximum page zoom factor that Chromium and Firefox implement, the highest maximum among the Baseline core browsers, so that no reader zooms further in any of them. What must hold however far a reader zooms rests on it. */
export const highestMaximumPageZoomFactor = Fraction.makeUnsafe(5n, 1n);
