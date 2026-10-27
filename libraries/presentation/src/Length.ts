import * as Typography from '#src/Typography';
import * as Viewport from '#src/Viewport';

/** The layout unit that WebKit and Chromium implement, the finest among the major browsers. Measured in CSS pixels. */
export const layoutUnit = 1 / 64;

/** The fewest decimal places that keep the rounding of a CSS length below the layout unit. */
export const decimalPlaces =
  Math.floor(
    Math.log10(
      (Typography.defaultFontSize * Typography.textScaleFactor +
        Viewport.maximumViewportWidth / 100) /
        (2 * layoutUnit),
    ),
  ) + 1;

const round = (value: number): number => {
  const scale = 10 ** decimalPlaces;
  return Math.round(value * scale) / scale;
};

/** The CSS rem length of a size, rounded to the decimal places. Measured in CSS pixels. */
export const rem = (size: number): string => `${round(size / Typography.defaultFontSize)}rem`;

/** The CSS vw length of a size, rounded to the decimal places. Measured in viewport widths. */
export const vw = (size: number): string => `${round(size * 100)}vw`;
