import * as Fraction from '#src/Fraction';
import * as Viewport from '#src/Viewport';

/**
 * The default font size that the major browsers implement for the root element. Measured in CSS pixels.
 *
 * @see https://github.com/WebKit/WebKit/blob/9ae3af91a3db5245146bc662834f5f018cba1275/Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml#L1899
 * @see https://chromium.googlesource.com/chromium/src/+/dc7959962724a6f659af5d105aec19cbf3e92a82/third_party/blink/public/common/web_preferences/web_preferences.h#59
 * @see https://github.com/mozilla-firefox/firefox/blob/f4970b3baab87e71af27f3f919abe49c86cfb83c/modules/libpref/init/all.js#L2023
 */
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
