import { Exit, Schema } from 'effect';

import * as Fraction from '#src/Fraction';
import * as Typography from '#src/Typography';

/**
 * The spacing unit of the USWDS spacing scale. Measured in CSS pixels.
 *
 * @see https://designsystem.digital.gov/design-tokens/spacing-units/
 */
export const spacingUnit = 8;

/**
 * The counts of the spacing unit that the USWDS spacing scale spaces content with, from the smallest to the largest.
 *
 * @see https://designsystem.digital.gov/design-tokens/spacing-units/
 */
export const spacingUnitCounts: ReadonlyArray<Fraction.Fraction> = [
  Fraction.make(1n, 2n),
  Fraction.make(1n, 1n),
  Fraction.make(3n, 2n),
  Fraction.make(2n, 1n),
  Fraction.make(5n, 2n),
  Fraction.make(3n, 1n),
  Fraction.make(4n, 1n),
  Fraction.make(5n, 1n),
  Fraction.make(6n, 1n),
  Fraction.make(7n, 1n),
  Fraction.make(8n, 1n),
  Fraction.make(9n, 1n),
  Fraction.make(10n, 1n),
  Fraction.make(15n, 1n),
];

/** The spacing unit as a factor of body text, the share of the default font size it takes in USWDS, so that spacing grows with body text. */
export const spacingUnitFactor = Fraction.make(
  BigInt(spacingUnit),
  BigInt(Typography.defaultFontSize),
);

/** A step of the space scale, with its size at the minimum and at the maximum viewport width. */
export interface Step {
  /** The multiple of body text the step is. */
  readonly factor: Fraction.Fraction;
  /** The size at the minimum viewport width. Measured in CSS pixels. */
  readonly minimumSize: Fraction.Fraction;
  /** The size at the maximum viewport width. Measured in CSS pixels. */
  readonly maximumSize: Fraction.Fraction;
}

/** The space scale from its smallest to its largest step: every count of the spacing unit as a multiple of body text, so that each step grows exactly as body text does. It spaces the layout; spacing that belongs to a piece of text follows that text through the factors of typography in `em` and `lh`. */
export const scale = (
  options: typeof Typography.ScaleOptions.Encoded,
): Exit.Exit<ReadonlyArray<Step>, Schema.SchemaError> =>
  Exit.map(Schema.decodeExit(Typography.ScaleOptions)(options, { errors: 'all' }), (options) =>
    spacingUnitCounts.map((count) => {
      const factor = Fraction.multiply(count, spacingUnitFactor);
      return {
        factor,
        minimumSize: Fraction.multiply(
          Fraction.make(BigInt(Typography.defaultFontSize), 1n),
          factor,
        ),
        maximumSize: Fraction.multiply(options.maximumBodyFontSize, factor),
      };
    }),
  );
