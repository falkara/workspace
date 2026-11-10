import { Exit, Rational, Schema } from 'effect';

/**
 * The tristimulus values of CIE standard illuminant D65 under the CIE 1931 2° observer, worked out once from the CIE datasets (SHA-256 `fa663e3535a7e0763a745993a1f0a192eb0275ac46ad2d1befd7626841e713c1` and `e76f210bffff3d552ef7113025da5f325d5dfec200dd4b878b1a2f3a507032cb`) by summing every 1 nm from 360 nm to 830 nm, as CIE 015 prescribes.
 *
 * @see https://cie.co.at/publications/colorimetry-part-2-cie-standard-illuminants-0
 * @see https://cie.co.at/publications/colorimetry-part-1-cie-standard-colorimetric-observers-0
 * @see https://doi.org/10.25039/CIE.DS.xvudnb9b
 * @see https://doi.org/10.25039/CIE.DS.hjfjmt59
 * @see https://doi.org/10.25039/TR.015.2018
 */
export const whiteTristimulus: {
  readonly X: Rational.Rational;
  readonly Y: Rational.Rational;
  readonly Z: Rational.Rational;
} = {
  X: Rational.makeUnsafe(71740714395483087745n, 75479154764200873016n),
  Y: Rational.fromBigInt(1n),
  Z: Rational.makeUnsafe(10272984088266781770n, 9434894345525109127n),
};

/** The chromaticity coordinates of a color: its position in the chromaticity plane. */
export interface Chromaticity {
  readonly x: Rational.Rational;
  readonly y: Rational.Rational;
}

/** The chromaticity coordinates of the library's white. */
export const whiteChromaticity: Chromaticity = {
  x: Rational.divideUnsafe(
    whiteTristimulus.X,
    Rational.sumAll([whiteTristimulus.X, whiteTristimulus.Y, whiteTristimulus.Z]),
  ),
  y: Rational.divideUnsafe(
    whiteTristimulus.Y,
    Rational.sumAll([whiteTristimulus.X, whiteTristimulus.Y, whiteTristimulus.Z]),
  ),
};

/** A hue given by a wavelength: a direction in the chromaticity plane, starting at the library's white, along which every color of the hue lies. The direction is not scaled to unit length, which would take a square root; this keeps it exact, so the ray can be intersected exactly. */
export interface Hue {
  readonly spectralChromaticity: Chromaticity;
  readonly direction: {
    readonly x: Rational.Rational;
    readonly y: Rational.Rational;
  };
}

/**
 * A schema of a dominant wavelength and the values of the color-matching functions x̄, ȳ and z̄ of the CIE 1931 2° observer at that wavelength, as the CIE dataset publishes them. Whether they are the row the CIE publishes for that wavelength cannot be checked without the observer's table, which the library does not include.
 *
 * @see https://cie.co.at/eilvterm/17-23-062
 * @see https://cie.co.at/publications/colorimetry-part-1-cie-standard-colorimetric-observers-0
 */
export const DominantWavelengthOptions = Schema.Struct({
  /** Measured in nanometers in standard air. */
  wavelength: Schema.Int.pipe(
    Schema.check(
      Schema.isBetween(
        { minimum: 360, maximum: 830 },
        {
          message:
            "Expected a dominant wavelength from 360 nm to 830 nm, the range over which ISO/CIE 11664-1 tabulates the CIE 1931 2° observer, so that the observer's color-matching functions are known there",
        },
      ),
    ),
  ),
  xBar: Schema.Rational.pipe(
    Schema.check(
      Schema.makeIsGreaterThanOrEqualTo({ order: Rational.Order, formatter: Rational.format })(
        Rational.fromBigInt(0n),
        {
          message:
            'Expected an x̄ of at least 0, as no color-matching function of the CIE 1931 2° observer is negative',
        },
      ),
    ),
  ),
  yBar: Schema.Rational.pipe(
    Schema.check(
      Schema.makeIsGreaterThanOrEqualTo({ order: Rational.Order, formatter: Rational.format })(
        Rational.fromBigInt(0n),
        {
          message:
            'Expected a ȳ of at least 0, as no color-matching function of the CIE 1931 2° observer is negative',
        },
      ),
    ),
  ),
  zBar: Schema.Rational.pipe(
    Schema.check(
      Schema.makeIsGreaterThanOrEqualTo({ order: Rational.Order, formatter: Rational.format })(
        Rational.fromBigInt(0n),
        {
          message:
            'Expected a z̄ of at least 0, as no color-matching function of the CIE 1931 2° observer is negative',
        },
      ),
    ),
  ),
}).pipe(
  Schema.check(
    Schema.makeFilter(
      (row) =>
        !Rational.isZero(Rational.sumAll([row.xBar, row.yBar, row.zBar])) ||
        'Expected x̄, ȳ and z̄ not to be all 0, so that the spectral light has a chromaticity, as its chromaticity divides each of them by their sum',
    ),
    Schema.makeFilter(
      (row) =>
        Rational.isZero(Rational.sumAll([row.xBar, row.yBar, row.zBar])) ||
        !Rational.equals(
          row.xBar,
          Rational.multiply(whiteChromaticity.x, Rational.sumAll([row.xBar, row.yBar, row.zBar])),
        ) ||
        !Rational.equals(
          row.yBar,
          Rational.multiply(whiteChromaticity.y, Rational.sumAll([row.xBar, row.yBar, row.zBar])),
        ) ||
        'Expected spectral light whose chromaticity differs from that of the white, so that the hue has a direction, as no spectral light of the observer has the chromaticity of the white',
    ),
  ),
);

/** A dominant wavelength and the values of the observer's color-matching functions at it, as they are written. */
export type DominantWavelengthOptions = typeof DominantWavelengthOptions.Encoded;

/**
 * The hue of a dominant wavelength, as CIE S 017 defines it: the colors of the hue lie on the line from the white toward the spectral light of that wavelength. Worked out exactly; or a failure with the reason when the wavelength is out of range or the values cannot be a row of the observer.
 *
 * @see https://cie.co.at/eilvterm/17-23-062
 */
export const dominantWavelength = (
  options: DominantWavelengthOptions,
): Exit.Exit<Hue, Schema.SchemaError> =>
  Exit.map(Schema.decodeExit(DominantWavelengthOptions)(options, { errors: 'all' }), (row) => ({
    spectralChromaticity: {
      x: Rational.divideUnsafe(
        row.xBar,
        // The schema checks that x̄, ȳ and z̄ are not negative and not all 0, so their sum is positive and the division cannot fail.
        Rational.sumAll([row.xBar, row.yBar, row.zBar]),
      ),
      y: Rational.divideUnsafe(
        row.yBar,
        // The schema checks that x̄, ȳ and z̄ are not negative and not all 0, so their sum is positive and the division cannot fail.
        Rational.sumAll([row.xBar, row.yBar, row.zBar]),
      ),
    },
    direction: {
      x: Rational.subtract(
        Rational.divideUnsafe(
          row.xBar,
          // The schema checks that x̄, ȳ and z̄ are not negative and not all 0, so their sum is positive and the division cannot fail.
          Rational.sumAll([row.xBar, row.yBar, row.zBar]),
        ),
        whiteChromaticity.x,
      ),
      y: Rational.subtract(
        Rational.divideUnsafe(
          row.yBar,
          // The schema checks that x̄, ȳ and z̄ are not negative and not all 0, so their sum is positive and the division cannot fail.
          Rational.sumAll([row.xBar, row.yBar, row.zBar]),
        ),
        whiteChromaticity.y,
      ),
    },
  }));

/**
 * A schema of a complementary wavelength and the values of the color-matching functions x̄, ȳ and z̄ of the CIE 1931 2° observer at that wavelength, as the CIE dataset publishes them. Whether they are the row the CIE publishes for that wavelength cannot be checked without the observer's table, which the library does not include.
 *
 * @see https://cie.co.at/eilvterm/17-23-063
 * @see https://cie.co.at/publications/colorimetry-part-1-cie-standard-colorimetric-observers-0
 */
export const ComplementaryWavelengthOptions = Schema.Struct({
  /** Measured in nanometers in standard air. */
  wavelength: Schema.Int.pipe(
    Schema.check(
      Schema.isBetween(
        { minimum: 360, maximum: 830 },
        {
          message:
            "Expected a complementary wavelength from 360 nm to 830 nm, the range over which ISO/CIE 11664-1 tabulates the CIE 1931 2° observer, so that the observer's color-matching functions are known there",
        },
      ),
    ),
  ),
  xBar: Schema.Rational.pipe(
    Schema.check(
      Schema.makeIsGreaterThanOrEqualTo({ order: Rational.Order, formatter: Rational.format })(
        Rational.fromBigInt(0n),
        {
          message:
            'Expected an x̄ of at least 0, as no color-matching function of the CIE 1931 2° observer is negative',
        },
      ),
    ),
  ),
  yBar: Schema.Rational.pipe(
    Schema.check(
      Schema.makeIsGreaterThanOrEqualTo({ order: Rational.Order, formatter: Rational.format })(
        Rational.fromBigInt(0n),
        {
          message:
            'Expected a ȳ of at least 0, as no color-matching function of the CIE 1931 2° observer is negative',
        },
      ),
    ),
  ),
  zBar: Schema.Rational.pipe(
    Schema.check(
      Schema.makeIsGreaterThanOrEqualTo({ order: Rational.Order, formatter: Rational.format })(
        Rational.fromBigInt(0n),
        {
          message:
            'Expected a z̄ of at least 0, as no color-matching function of the CIE 1931 2° observer is negative',
        },
      ),
    ),
  ),
}).pipe(
  Schema.check(
    Schema.makeFilter(
      (row) =>
        !Rational.isZero(Rational.sumAll([row.xBar, row.yBar, row.zBar])) ||
        'Expected x̄, ȳ and z̄ not to be all 0, so that the spectral light has a chromaticity, as its chromaticity divides each of them by their sum',
    ),
    Schema.makeFilter(
      (row) =>
        Rational.isZero(Rational.sumAll([row.xBar, row.yBar, row.zBar])) ||
        !Rational.equals(
          row.xBar,
          Rational.multiply(whiteChromaticity.x, Rational.sumAll([row.xBar, row.yBar, row.zBar])),
        ) ||
        !Rational.equals(
          row.yBar,
          Rational.multiply(whiteChromaticity.y, Rational.sumAll([row.xBar, row.yBar, row.zBar])),
        ) ||
        'Expected spectral light whose chromaticity differs from that of the white, so that the hue has a direction, as no spectral light of the observer has the chromaticity of the white',
    ),
  ),
);

/** A complementary wavelength and the values of the observer's color-matching functions at it, as they are written. */
export type ComplementaryWavelengthOptions = typeof ComplementaryWavelengthOptions.Encoded;

/**
 * The hue of a complementary wavelength, as CIE S 017 defines it for purples, which no single wavelength produces: the colors of the hue lie on the line through the white, on the opposite side of it from the spectral light of that wavelength. Worked out exactly; or a failure with the reason when the wavelength is out of range or the values cannot be a row of the observer.
 *
 * @see https://cie.co.at/eilvterm/17-23-063
 */
export const complementaryWavelength = (
  options: ComplementaryWavelengthOptions,
): Exit.Exit<Hue, Schema.SchemaError> =>
  Exit.map(
    Schema.decodeExit(ComplementaryWavelengthOptions)(options, { errors: 'all' }),
    (row) => ({
      spectralChromaticity: {
        x: Rational.divideUnsafe(
          row.xBar,
          // The schema checks that x̄, ȳ and z̄ are not negative and not all 0, so their sum is positive and the division cannot fail.
          Rational.sumAll([row.xBar, row.yBar, row.zBar]),
        ),
        y: Rational.divideUnsafe(
          row.yBar,
          // The schema checks that x̄, ȳ and z̄ are not negative and not all 0, so their sum is positive and the division cannot fail.
          Rational.sumAll([row.xBar, row.yBar, row.zBar]),
        ),
      },
      direction: {
        x: Rational.subtract(
          whiteChromaticity.x,
          Rational.divideUnsafe(
            row.xBar,
            // The schema checks that x̄, ȳ and z̄ are not negative and not all 0, so their sum is positive and the division cannot fail.
            Rational.sumAll([row.xBar, row.yBar, row.zBar]),
          ),
        ),
        y: Rational.subtract(
          whiteChromaticity.y,
          Rational.divideUnsafe(
            row.yBar,
            // The schema checks that x̄, ȳ and z̄ are not negative and not all 0, so their sum is positive and the division cannot fail.
            Rational.sumAll([row.xBar, row.yBar, row.zBar]),
          ),
        ),
      },
    }),
  );
