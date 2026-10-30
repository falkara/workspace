import { Exit, Schema } from 'effect';

import * as Fraction from '#src/Fraction';
import * as Typography from '#src/Typography';

/**
 * The spacing unit of the USWDS spacing scale. Measured in CSS pixels.
 *
 * @see https://designsystem.digital.gov/design-tokens/spacing-units/
 */
export const spacingUnit = Fraction.makeUnsafe(8n, 1n);

/**
 * The counts of the spacing unit that the USWDS spacing scale spaces content with, from the smallest to the largest.
 *
 * @see https://designsystem.digital.gov/design-tokens/spacing-units/
 */
export const spacingUnitCounts: ReadonlyArray<Fraction.Fraction> = [
  Fraction.makeUnsafe(1n, 2n),
  Fraction.makeUnsafe(1n, 1n),
  Fraction.makeUnsafe(3n, 2n),
  Fraction.makeUnsafe(2n, 1n),
  Fraction.makeUnsafe(5n, 2n),
  Fraction.makeUnsafe(3n, 1n),
  Fraction.makeUnsafe(4n, 1n),
  Fraction.makeUnsafe(5n, 1n),
  Fraction.makeUnsafe(6n, 1n),
  Fraction.makeUnsafe(7n, 1n),
  Fraction.makeUnsafe(8n, 1n),
  Fraction.makeUnsafe(9n, 1n),
  Fraction.makeUnsafe(10n, 1n),
  Fraction.makeUnsafe(15n, 1n),
];

/** The spacing unit as a factor of body text, the share of the default font size it takes in USWDS, so that spacing grows with body text. */
export const spacingUnitFactor = Fraction.divide(spacingUnit, Typography.defaultFontSize);

/** A step of the space scale, with its size at the minimum and at the maximum viewport width. */
export interface Step {
  /** The multiple of body text the step is. */
  readonly factor: Fraction.Fraction;
  /** The size at the minimum viewport width. Measured in CSS pixels. */
  readonly minimumSize: Fraction.Fraction;
  /** The size at the maximum viewport width. Measured in CSS pixels. */
  readonly maximumSize: Fraction.Fraction;
}

/** A schema of the size body text reaches at the maximum viewport width, the one part of the intent of a type scale that the space scale grows with, so that the options of a type scale serve it as they are and no ratio of the type scale refuses the space scale. */
export const ScaleOptions = Schema.Struct({
  /** The font size of body text at the maximum viewport width, checked as the type scale checks it. Measured in CSS pixels. */
  maximumBodyFontSize: Typography.ScaleOptions.fields.maximumBodyFontSize,
});

/** The size body text reaches at the maximum viewport width, which the space scale grows with. */
export type ScaleOptions = typeof ScaleOptions.Type;

/** The space scale from its smallest to its largest step: every count of the spacing unit as a multiple of body text, so that each step grows exactly as body text does. It spaces the layout; spacing that belongs to a piece of text follows that text through the factors of typography in `em` and `lh`. */
export const scale = (
  options: typeof ScaleOptions.Encoded,
): Exit.Exit<ReadonlyArray<Step>, Schema.SchemaError> =>
  Exit.map(Schema.decodeExit(ScaleOptions)(options, { errors: 'all' }), (options) =>
    spacingUnitCounts.map((count) => {
      const factor = Fraction.multiply(count, spacingUnitFactor);
      return {
        factor,
        minimumSize: Fraction.multiply(Typography.defaultFontSize, factor),
        maximumSize: Fraction.multiply(options.maximumBodyFontSize, factor),
      };
    }),
  );
