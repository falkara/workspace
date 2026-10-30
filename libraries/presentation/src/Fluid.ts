import { Exit, Schema } from 'effect';

import * as Fraction from '#src/Fraction';
import * as Length from '#src/Length';
import * as Typography from '#src/Typography';
import * as Viewport from '#src/Viewport';

/** The fewest decimal places that keep the rounding of a CSS length below the layout unit, for a reader who both zooms the page and sets the font size up to the maximum page zoom factor, as the layout unit counts zoomed pixels. */
export const decimalPlaces =
  Math.floor(
    Math.log10(
      (Viewport.maximumPageZoomFactor *
        (Typography.defaultFontSize * Viewport.maximumPageZoomFactor +
          Viewport.maximumViewportWidth / Length.viewportWidthUnits)) /
        (2 * Length.layoutUnit),
    ),
  ) + 1;

/** The CSS rem length of a size, rounded to the decimal places. Measured in CSS pixels. */
export const rem = (size: number): string =>
  `${Math.round((size / Typography.defaultFontSize) * 10 ** decimalPlaces) / 10 ** decimalPlaces}rem`;

/** The CSS vw length of a share of the viewport width, rounded to the decimal places. The share measured in viewport widths, so that 1 is the whole width. */
export const vw = (share: number): string =>
  `${Math.round(share * Length.viewportWidthUnits * 10 ** decimalPlaces) / 10 ** decimalPlaces}vw`;

/** A schema of the sizes a fluid value takes at the minimum and at the maximum viewport width. Sizes measured in CSS pixels. */
const Sizes = Schema.Struct({
  /** The size at the minimum viewport width. */
  minimumSize: Fraction.Fraction,
  /** The size at the maximum viewport width. */
  maximumSize: Fraction.Fraction,
}).pipe(
  Schema.check(
    /** The maximum size from the minimum size, so that the value never shrinks, to the minimum size grown by the maximum text growth factor, so that text stays resizable and every other value grows no faster than text. */
    Schema.makeFilter(
      (sizes) =>
        (Fraction.isGreaterThanOrEqualTo(sizes.maximumSize, sizes.minimumSize) &&
          Fraction.isLessThanOrEqualTo(
            sizes.maximumSize,
            Fraction.multiply(sizes.minimumSize, Typography.maximumTextGrowthFactor),
          )) || {
          path: ['maximumSize'],
          issue: `Expected a maximum size of ${Math.round(Fraction.toNumber(sizes.minimumSize) * 10 ** decimalPlaces) / 10 ** decimalPlaces} px to ${Math.round(Fraction.toNumber(Fraction.multiply(sizes.minimumSize, Typography.maximumTextGrowthFactor)) * 10 ** decimalPlaces) / 10 ** decimalPlaces} px, so that the value never shrinks and grows no faster than text that can be enlarged to ${Typography.textScaleFactor * 100} % within the ${Viewport.maximumPageZoomFactor * 100} % page zoom of Safari, as WCAG 2.2 Resize Text requires`,
        },
    ),
  ),
);

/** The CSS clamp() value that changes linearly from the minimum size at the minimum viewport width to the maximum size at the maximum viewport width, or a failure when a size is not a positive fraction or when the value would shrink or grow by more than the maximum text growth factor. Sizes measured in CSS pixels. */
export const clamp = (
  minimumSize: typeof Fraction.Fraction.Encoded,
  maximumSize: typeof Fraction.Fraction.Encoded,
): Exit.Exit<string, Schema.SchemaError> =>
  Exit.map(Schema.decodeExit(Sizes)({ minimumSize, maximumSize }, { errors: 'all' }), (sizes) => {
    const slope =
      (Fraction.toNumber(sizes.maximumSize) - Fraction.toNumber(sizes.minimumSize)) /
      (Viewport.maximumViewportWidth - Viewport.minimumViewportWidth);
    const intercept = Fraction.toNumber(sizes.minimumSize) - slope * Viewport.minimumViewportWidth;
    return `clamp(${rem(Fraction.toNumber(sizes.minimumSize))}, ${rem(intercept)} + ${vw(slope)}, ${rem(Fraction.toNumber(sizes.maximumSize))})`;
  });
