import { Exit, Schema } from 'effect';

import * as Fraction from '#src/Fraction';
import * as Length from '#src/Length';
import * as Typography from '#src/Typography';
import * as Viewport from '#src/Viewport';

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
          issue: `Expected a maximum size of ${Math.round(Fraction.toNumber(sizes.minimumSize) * 10 ** Length.decimalPlaces) / 10 ** Length.decimalPlaces} px to ${Math.round(Fraction.toNumber(Fraction.multiply(sizes.minimumSize, Typography.maximumTextGrowthFactor)) * 10 ** Length.decimalPlaces) / 10 ** Length.decimalPlaces} px, so that the value never shrinks and grows no faster than text that can be enlarged to ${Typography.textScaleFactor * 100} % within the ${Viewport.maximumPageZoomFactor * 100} % page zoom of Safari, as WCAG 2.2 Resize Text requires`,
        },
    ),
  ),
);

/** The CSS clamp() value that changes linearly from the minimum size at the minimum viewport width to the maximum size at the maximum viewport width, or a failure when the value would shrink or grow by more than the maximum text growth factor. Sizes measured in CSS pixels. */
export const clamp = (
  minimumSize: Fraction.Fraction,
  maximumSize: Fraction.Fraction,
): Exit.Exit<string, Schema.SchemaError> =>
  Exit.map(Schema.decodeExit(Sizes)({ minimumSize, maximumSize }, { errors: 'all' }), (sizes) => {
    const slope =
      (Fraction.toNumber(sizes.maximumSize) - Fraction.toNumber(sizes.minimumSize)) /
      (Viewport.maximumViewportWidth - Viewport.minimumViewportWidth);
    const intercept = Fraction.toNumber(sizes.minimumSize) - slope * Viewport.minimumViewportWidth;
    return `clamp(${Length.rem(Fraction.toNumber(sizes.minimumSize))}, ${Length.rem(intercept)} + ${Length.vw(slope)}, ${Length.rem(Fraction.toNumber(sizes.maximumSize))})`;
  });
