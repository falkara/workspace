import { Exit, Rational, Schema } from 'effect';

import * as Typography from '#src/Typography';

/**
 * The spacing unit of the USWDS spacing scale. Measured in CSS pixels.
 *
 * @see https://designsystem.digital.gov/design-tokens/spacing-units/
 */
export const spacingUnit = Rational.fromBigInt(8n);

/**
 * The counts of the spacing unit in the small and medium tokens of the USWDS spacing scale, from the smallest to the largest: the tokens its margin and padding utilities space content with, save the smaller tokens of 1 and 2 px, which USWDS gives as fixed lengths rather than counts of the unit. Left out too are the negative tokens, which mirror these, zero, and the large named tokens from card to widescreen, with which USWDS sizes widths and heights rather than spacing.
 *
 * @see https://designsystem.digital.gov/design-tokens/spacing-units/
 */
export const spacingUnitCounts: ReadonlyArray<Rational.Rational> = [
  Rational.makeUnsafe(1n, 2n),
  Rational.fromBigInt(1n),
  Rational.makeUnsafe(3n, 2n),
  Rational.fromBigInt(2n),
  Rational.makeUnsafe(5n, 2n),
  Rational.fromBigInt(3n),
  Rational.fromBigInt(4n),
  Rational.fromBigInt(5n),
  Rational.fromBigInt(6n),
  Rational.fromBigInt(7n),
  Rational.fromBigInt(8n),
  Rational.fromBigInt(9n),
  Rational.fromBigInt(10n),
  Rational.fromBigInt(15n),
];

/** The spacing unit as a factor of body text, the share of the default font size it takes in USWDS, so that spacing grows with body text. */
export const spacingUnitFactor = Rational.divideUnsafe(
  // The default font size is a positive constant, so the division never divides by zero.
  spacingUnit,
  Typography.defaultFontSize,
);

/** A step of the space scale, with its size at the minimum and at the maximum viewport width. */
export interface Step {
  /** The multiple of body text the step is. */
  readonly factor: Rational.Rational;
  /** The size at the minimum viewport width. Measured in CSS pixels. */
  readonly minimumSize: Rational.Rational;
  /** The size at the maximum viewport width. Measured in CSS pixels. */
  readonly maximumSize: Rational.Rational;
}

/** A schema of the size body text reaches at the maximum viewport width, the one part of the intent of a type scale that the space scale grows with, so that the options of a type scale serve it as they are and no ratio of the type scale refuses the space scale. */
export const ScaleOptions = Schema.Struct({
  /** The font size of body text at the maximum viewport width, checked as the type scale checks it. Measured in CSS pixels. */
  maximumBodyFontSize: Typography.ScaleOptions.fields.maximumBodyFontSize,
});

/** The size body text reaches at the maximum viewport width, which the space scale grows with. */
export type ScaleOptions = typeof ScaleOptions.Type;

/** The space scale from its smallest to its largest step: every count of the spacing unit in `spacingUnitCounts` as a multiple of body text, so that each step grows exactly as body text does. It spaces the layout; spacing that belongs to a piece of text follows that text through the factors of typography in `em` and `lh`. */
export const scale = (
  options: typeof ScaleOptions.Encoded,
): Exit.Exit<ReadonlyArray<Step>, Schema.SchemaError> =>
  Exit.map(Schema.decodeExit(ScaleOptions)(options, { errors: 'all' }), (options) =>
    spacingUnitCounts.map((count) => {
      const factor = Rational.multiply(count, spacingUnitFactor);
      return {
        factor,
        minimumSize: Rational.multiply(Typography.defaultFontSize, factor),
        maximumSize: Rational.multiply(options.maximumBodyFontSize, factor),
      };
    }),
  );
