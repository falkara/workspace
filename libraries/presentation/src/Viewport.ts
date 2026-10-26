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

/**
 * The text scale factor that WCAG 2.2 requires content to support.
 *
 * @see https://www.w3.org/TR/WCAG22/#resize-text
 */
export const textScaleFactor = 2;

/**
 * The maximum page zoom factor that Safari implements, the lowest among the major browsers.
 *
 * @see https://github.com/WebKit/WebKit/blob/9ae3af91a3db5245146bc662834f5f018cba1275/Source/WebKitLegacy/mac/WebView/WebView.mm#L6090
 * @see https://chromium.googlesource.com/chromium/src/+/dc7959962724a6f659af5d105aec19cbf3e92a82/third_party/blink/common/page/page_zoom.cc#26
 * @see https://github.com/mozilla-firefox/firefox/blob/f4970b3baab87e71af27f3f919abe49c86cfb83c/modules/libpref/init/StaticPrefList.yaml#L21886
 */
export const maximumPageZoomFactor = 3;

/** The maximum text growth factor from the minimum to the maximum viewport width that keeps text resizable by the text scale factor within the maximum page zoom factor. */
export const maximumTextGrowthFactor =
  (viewportWidthFactor * (maximumPageZoomFactor - 1)) /
  (viewportWidthFactor * (textScaleFactor - 1) + maximumPageZoomFactor - textScaleFactor);
