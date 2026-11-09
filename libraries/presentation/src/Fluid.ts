import { Exit, Rational, Schema } from 'effect';

import * as Length from '#src/Length';
import * as Typography from '#src/Typography';
import * as Viewport from '#src/Viewport';

/** The CSS rem length of a size, rounded to the decimal places of a CSS length. Measured in CSS pixels. */
export const rem = (size: number): string =>
  `${Math.round((size / Rational.toNumberUnsafe(Typography.defaultFontSize)) * 10 ** Typography.decimalPlaces) / 10 ** Typography.decimalPlaces}rem`;

/** The CSS vw length of a share of the viewport width, rounded to the decimal places of a CSS length. The share measured in viewport widths, so that 1 is the whole width. */
export const vw = (share: number): string =>
  `${Math.round(share * Rational.toNumberUnsafe(Length.viewportWidthUnits) * 10 ** Typography.decimalPlaces) / 10 ** Typography.decimalPlaces}vw`;

/** A schema of the sizes a fluid value takes at the minimum and at the maximum viewport width. Sizes measured in CSS pixels. */
const Sizes = Schema.Struct({
  /** The size at the minimum viewport width, positive, as the growth of the value is bounded as a factor of it. */
  minimumSize: Schema.Rational.pipe(
    Schema.check(
      Schema.makeIsGreaterThan({ order: Rational.Order, formatter: Rational.format })(
        Rational.fromBigInt(0n),
        {
          message:
            'Expected a positive size, as the growth of a value is bounded as a factor of its size at the minimum viewport width',
        },
      ),
    ),
  ),
  /** The size at the maximum viewport width. */
  maximumSize: Schema.Rational,
}).pipe(
  Schema.check(
    /** The maximum size from the minimum size, so that the value never shrinks, to the minimum size grown by the maximum text growth factor, so that text stays resizable and every other value grows no faster than text. */
    Schema.makeFilter(
      (sizes) =>
        (Rational.isGreaterThanOrEqualTo(sizes.maximumSize, sizes.minimumSize) &&
          Rational.isLessThanOrEqualTo(
            sizes.maximumSize,
            Rational.multiply(sizes.minimumSize, Typography.maximumTextGrowthFactor),
          )) || {
          path: ['maximumSize'],
          issue: `Expected a maximum size of ${Math.round(Rational.toNumberUnsafe(sizes.minimumSize) * 10 ** Typography.decimalPlaces) / 10 ** Typography.decimalPlaces} px to ${Math.round(Rational.toNumberUnsafe(Rational.multiply(sizes.minimumSize, Typography.maximumTextGrowthFactor)) * 10 ** Typography.decimalPlaces) / 10 ** Typography.decimalPlaces} px, so that the value never shrinks and grows no faster than text that can be enlarged to ${Rational.toNumberUnsafe(Rational.multiply(Typography.textScaleFactor, Rational.fromBigInt(100n)))} % within the ${Rational.toNumberUnsafe(Rational.multiply(Viewport.lowestMaximumPageZoomFactor, Rational.fromBigInt(100n)))} % page zoom of Safari, as WCAG 2.2 Resize Text requires`,
        },
    ),
  ),
);

/** The CSS clamp() value that changes linearly from the minimum size at the minimum viewport width to the maximum size at the maximum viewport width, or the rem length alone when both sizes are written alike and the value never changes; or a failure when the minimum size is not positive or when the value would shrink or grow by more than the maximum text growth factor. Sizes measured in CSS pixels. */
export const clamp = (
  minimumSize: Rational.Rational,
  maximumSize: Rational.Rational,
): Exit.Exit<string, Schema.SchemaError> =>
  Exit.map(Schema.decodeExit(Sizes)({ minimumSize, maximumSize }, { errors: 'all' }), (sizes) => {
    if (
      rem(Rational.toNumberUnsafe(sizes.minimumSize)) ===
      rem(Rational.toNumberUnsafe(sizes.maximumSize))
    ) {
      return rem(Rational.toNumberUnsafe(sizes.minimumSize));
    }
    const slope =
      (Rational.toNumberUnsafe(sizes.maximumSize) - Rational.toNumberUnsafe(sizes.minimumSize)) /
      Rational.toNumberUnsafe(
        Rational.subtract(Viewport.maximumViewportWidth, Viewport.minimumViewportWidth),
      );
    const intercept =
      Rational.toNumberUnsafe(sizes.minimumSize) -
      slope * Rational.toNumberUnsafe(Viewport.minimumViewportWidth);
    return `clamp(${rem(Rational.toNumberUnsafe(sizes.minimumSize))}, ${rem(intercept)} + ${vw(slope)}, ${rem(Rational.toNumberUnsafe(sizes.maximumSize))})`;
  });
