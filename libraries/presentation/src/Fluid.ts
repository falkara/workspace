import { Exit, Rational, Schema } from 'effect';

import * as Length from '#src/Length';
import * as Real from '#src/Real';
import * as Typography from '#src/Typography';
import * as Viewport from '#src/Viewport';

/** The CSS rem length of a size, rounded to the decimal places of a CSS length. Measured in CSS pixels. */
export const rem = (size: Rational.Rational): string =>
  // The default font size is positive, so the division cannot fail.
  `${Real.writeDecimals(Rational.divideUnsafe(size, Typography.defaultFontSize), Typography.decimalPlaces)}rem`;

/** The CSS vw length of a share of the viewport width, rounded to the decimal places of a CSS length. The share measured in viewport widths, so that 1 is the whole width. */
export const vw = (share: Rational.Rational): string =>
  `${Real.writeDecimals(Rational.multiply(share, Length.viewportWidthUnits), Typography.decimalPlaces)}vw`;

/** A schema of the sizes a fluid value takes at the minimum and at the maximum viewport width, as every step of the type scale and of the space scale holds them, so that a step passes as it is. Sizes measured in CSS pixels. */
export const Sizes = Schema.Struct({
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
          issue: `Expected a maximum size of ${Real.writeDecimals(sizes.minimumSize, Typography.decimalPlaces)} px to ${Real.writeDecimals(Rational.multiply(sizes.minimumSize, Typography.maximumTextGrowthFactor), Typography.decimalPlaces)} px, so that the value never shrinks and grows no faster than text that can be enlarged to ${Real.writeDecimals(Rational.multiply(Typography.textScaleFactor, Rational.fromBigInt(100n)), Typography.decimalPlaces)} %, as WCAG 2.2 Resize Text requires, within the ${Real.writeDecimals(Rational.multiply(Viewport.lowestMaximumPageZoomFactor, Rational.fromBigInt(100n)), Typography.decimalPlaces)} % page zoom of Safari, the lowest maximum among the Baseline core browsers`,
        },
    ),
  ),
);

/** The sizes a fluid value takes at the minimum and at the maximum viewport width, as they are written. */
export type Sizes = typeof Sizes.Encoded;

/** The CSS clamp() value that changes linearly from the minimum size at the minimum viewport width to the maximum size at the maximum viewport width, or the rem length alone when both sizes are written alike and the value never changes; or a failure when the minimum size is not positive or when the value would shrink or grow by more than the maximum text growth factor. Sizes measured in CSS pixels. */
export const clamp = (sizes: Sizes): Exit.Exit<string, Schema.SchemaError> =>
  Exit.map(Schema.decodeExit(Sizes)(sizes, { errors: 'all' }), (sizes) => {
    if (rem(sizes.minimumSize) === rem(sizes.maximumSize)) {
      return rem(sizes.minimumSize);
    }
    // The maximum viewport width exceeds the minimum, so the division cannot fail.
    const slope = Rational.divideUnsafe(
      Rational.subtract(sizes.maximumSize, sizes.minimumSize),
      Rational.subtract(Viewport.maximumViewportWidth, Viewport.minimumViewportWidth),
    );
    const intercept = Rational.subtract(
      sizes.minimumSize,
      Rational.multiply(slope, Viewport.minimumViewportWidth),
    );
    return `clamp(${rem(sizes.minimumSize)}, ${rem(intercept)} + ${vw(slope)}, ${rem(sizes.maximumSize)})`;
  });
