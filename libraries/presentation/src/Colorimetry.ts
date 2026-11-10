import { Exit, Rational, Schema } from 'effect';

/** The tristimulus values of a color, relative to the white, whose Y is 1. */
export interface Tristimulus {
  readonly X: Rational.Rational;
  readonly Y: Rational.Rational;
  readonly Z: Rational.Rational;
}

/**
 * The tristimulus values of CIE standard illuminant D65 under the CIE 1931 2° observer, worked out once from the CIE datasets (SHA-256 `fa663e3535a7e0763a745993a1f0a192eb0275ac46ad2d1befd7626841e713c1` and `e76f210bffff3d552ef7113025da5f325d5dfec200dd4b878b1a2f3a507032cb`) by summing every 1 nm from 360 nm to 830 nm, as CIE 015 prescribes.
 *
 * @see https://cie.co.at/publications/colorimetry-part-2-cie-standard-illuminants-0
 * @see https://cie.co.at/publications/colorimetry-part-1-cie-standard-colorimetric-observers-0
 * @see https://doi.org/10.25039/CIE.DS.xvudnb9b
 * @see https://doi.org/10.25039/CIE.DS.hjfjmt59
 * @see https://doi.org/10.25039/TR.015.2018
 */
export const whiteTristimulus: Tristimulus = {
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

/** Three rows of three exact numbers, which turn one vector of a color into another. */
export type Matrix = readonly [
  readonly [Rational.Rational, Rational.Rational, Rational.Rational],
  readonly [Rational.Rational, Rational.Rational, Rational.Rational],
  readonly [Rational.Rational, Rational.Rational, Rational.Rational],
];

/** The product of a matrix and a vector, worked out exactly. */
const transform = (
  [first, second, third]: Matrix,
  [x, y, z]: readonly [Rational.Rational, Rational.Rational, Rational.Rational],
): readonly [Rational.Rational, Rational.Rational, Rational.Rational] => [
  Rational.sumAll([
    Rational.multiply(first[0], x),
    Rational.multiply(first[1], y),
    Rational.multiply(first[2], z),
  ]),
  Rational.sumAll([
    Rational.multiply(second[0], x),
    Rational.multiply(second[1], y),
    Rational.multiply(second[2], z),
  ]),
  Rational.sumAll([
    Rational.multiply(third[0], x),
    Rational.multiply(third[1], y),
    Rational.multiply(third[2], z),
  ]),
];

/** The inverse of a matrix, worked out exactly from its adjugate and its determinant. */
const inverseOf = ([[a, b, c], [d, e, f], [g, h, i]]: Matrix): Matrix => {
  const determinant = Rational.sumAll([
    Rational.multiply(a, Rational.subtract(Rational.multiply(e, i), Rational.multiply(f, h))),
    Rational.negate(
      Rational.multiply(b, Rational.subtract(Rational.multiply(d, i), Rational.multiply(f, g))),
    ),
    Rational.multiply(c, Rational.subtract(Rational.multiply(d, h), Rational.multiply(e, g))),
  ]);
  // Every matrix inverted here is built from three primaries that do not lie on one line, so its determinant is never zero and no division below can fail.
  return [
    [
      Rational.divideUnsafe(
        Rational.subtract(Rational.multiply(e, i), Rational.multiply(f, h)),
        determinant,
      ),
      Rational.divideUnsafe(
        Rational.subtract(Rational.multiply(c, h), Rational.multiply(b, i)),
        determinant,
      ),
      Rational.divideUnsafe(
        Rational.subtract(Rational.multiply(b, f), Rational.multiply(c, e)),
        determinant,
      ),
    ],
    [
      Rational.divideUnsafe(
        Rational.subtract(Rational.multiply(f, g), Rational.multiply(d, i)),
        determinant,
      ),
      Rational.divideUnsafe(
        Rational.subtract(Rational.multiply(a, i), Rational.multiply(c, g)),
        determinant,
      ),
      Rational.divideUnsafe(
        Rational.subtract(Rational.multiply(c, d), Rational.multiply(a, f)),
        determinant,
      ),
    ],
    [
      Rational.divideUnsafe(
        Rational.subtract(Rational.multiply(d, h), Rational.multiply(e, g)),
        determinant,
      ),
      Rational.divideUnsafe(
        Rational.subtract(Rational.multiply(b, g), Rational.multiply(a, h)),
        determinant,
      ),
      Rational.divideUnsafe(
        Rational.subtract(Rational.multiply(a, e), Rational.multiply(b, d)),
        determinant,
      ),
    ],
  ];
};

/** The chromaticity coordinates of the three primaries of a medium. */
export interface Primaries {
  readonly red: Chromaticity;
  readonly green: Chromaticity;
  readonly blue: Chromaticity;
}

/**
 * A medium: a display color space in which a color is written. It holds what its standard defines (its primaries, its white and, through its CSS identifier, its transfer function) and the matrices that follow from them. It is plain data, so `Equal.equals` compares two media by value.
 */
export interface Medium {
  /** The identifier with which CSS writes the medium in `color()`, which also names its transfer function. */
  readonly colorSpace: 'srgb' | 'display-p3' | 'rec2020' | 'rec2100-pq' | 'rec2100-hlg';
  readonly primaries: Primaries;
  readonly white: Chromaticity;
  /** From linear channels to tristimulus values relative to the white, whose Y is 1. */
  readonly linearToXyz: Matrix;
  /** From tristimulus values relative to the white to linear channels, the inverse of `linearToXyz`. */
  readonly xyzToLinear: Matrix;
  /** The largest linear channel the medium holds, relative to its white. */
  readonly peak: Rational.Rational;
}

/** The medium with the given primaries, white and peak, with its matrices derived exactly as the standards derive them: the tristimulus values of each primary at a Y of 1, scaled so that the three add up to the white. */
const mediumOf = (
  colorSpace: Medium['colorSpace'],
  primaries: Primaries,
  white: Chromaticity,
  peak: Rational.Rational,
): Medium => {
  // The y of every primary and of every white is positive, so none of the divisions by it below can fail.
  const unscaled: Matrix = [
    [
      Rational.divideUnsafe(primaries.red.x, primaries.red.y),
      Rational.divideUnsafe(primaries.green.x, primaries.green.y),
      Rational.divideUnsafe(primaries.blue.x, primaries.blue.y),
    ],
    [Rational.fromBigInt(1n), Rational.fromBigInt(1n), Rational.fromBigInt(1n)],
    [
      Rational.divideUnsafe(
        Rational.subtract(Rational.fromBigInt(1n), Rational.sum(primaries.red.x, primaries.red.y)),
        primaries.red.y,
      ),
      Rational.divideUnsafe(
        Rational.subtract(
          Rational.fromBigInt(1n),
          Rational.sum(primaries.green.x, primaries.green.y),
        ),
        primaries.green.y,
      ),
      Rational.divideUnsafe(
        Rational.subtract(
          Rational.fromBigInt(1n),
          Rational.sum(primaries.blue.x, primaries.blue.y),
        ),
        primaries.blue.y,
      ),
    ],
  ];
  const scale = transform(inverseOf(unscaled), [
    Rational.divideUnsafe(white.x, white.y),
    Rational.fromBigInt(1n),
    Rational.divideUnsafe(
      Rational.subtract(Rational.fromBigInt(1n), Rational.sum(white.x, white.y)),
      white.y,
    ),
  ]);
  const linearToXyz: Matrix = [
    [
      Rational.multiply(unscaled[0][0], scale[0]),
      Rational.multiply(unscaled[0][1], scale[1]),
      Rational.multiply(unscaled[0][2], scale[2]),
    ],
    [scale[0], scale[1], scale[2]],
    [
      Rational.multiply(unscaled[2][0], scale[0]),
      Rational.multiply(unscaled[2][1], scale[1]),
      Rational.multiply(unscaled[2][2], scale[2]),
    ],
  ];
  return { colorSpace, primaries, white, linearToXyz, xyzToLinear: inverseOf(linearToXyz), peak };
};

/**
 * The white of every standard medium as its standard writes it, D65 at (0.3127, 0.3290), so that its conversions match CSS Color 4 and the browsers to the last bit. It differs from `whiteChromaticity`, which is worked out from the spectrum of D65, in the fifth decimal place, the rounding of the standards. ITU-R BT.2100-3 refers to D65 as defined in ISO 11664-2:2007, while the library takes its spectrum from the 2022 edition, which leaves the spectrum of D65 unchanged.
 *
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#d65
 * @see https://www.itu.int/rec/R-REC-BT.2020-2-201510-I/en
 * @see https://www.itu.int/rec/R-REC-BT.2100-3-202502-I/en
 */
export const standardWhiteChromaticity: Chromaticity = {
  x: Rational.makeUnsafe(3127n, 10000n),
  y: Rational.makeUnsafe(3290n, 10000n),
};

/**
 * The constants of the sRGB transfer function, shared by sRGB and Display P3: the linear value up to which the function is linear, the slope of that segment, and the offset and exponent of the curved segment.
 *
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#predefined-sRGB
 */
export const srgbTransfer: {
  readonly linearThreshold: Rational.Rational;
  readonly slope: Rational.Rational;
  readonly offset: Rational.Rational;
  readonly exponent: Rational.Rational;
} = {
  linearThreshold: Rational.makeUnsafe(31308n, 10000000n),
  slope: Rational.makeUnsafe(1292n, 100n),
  offset: Rational.makeUnsafe(55n, 1000n),
  exponent: Rational.makeUnsafe(24n, 10n),
};

/**
 * The exponent of the transfer function of Rec. 2020: the reference display curve of ITU-R BT.1886-0, as CSS Color 4 uses it, with a perfect black, since the luminance of black is a property of a display, not of a medium. ITU-R BT.2020-2 defines its own curve, with α = 1.099 and β = 0.018, for the camera; a medium describes the light a display emits, which is what the display curve describes.
 *
 * @see https://www.itu.int/rec/R-REC-BT.1886-0-201103-I/en
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#predefined-rec2020
 */
export const rec2020TransferExponent = Rational.makeUnsafe(240n, 100n);

/**
 * The constants m1, m2, c1, c2 and c3 of the perceptual quantizer (PQ) of ITU-R BT.2100-3.
 *
 * @see https://www.itu.int/rec/R-REC-BT.2100-3-202502-I/en
 */
export const pqTransfer: {
  readonly m1: Rational.Rational;
  readonly m2: Rational.Rational;
  readonly c1: Rational.Rational;
  readonly c2: Rational.Rational;
  readonly c3: Rational.Rational;
} = {
  m1: Rational.makeUnsafe(2610n, 16384n),
  m2: Rational.multiply(Rational.makeUnsafe(2523n, 4096n), Rational.fromBigInt(128n)),
  c1: Rational.makeUnsafe(3424n, 4096n),
  c2: Rational.multiply(Rational.makeUnsafe(2413n, 4096n), Rational.fromBigInt(32n)),
  c3: Rational.multiply(Rational.makeUnsafe(2392n, 4096n), Rational.fromBigInt(32n)),
};

/**
 * The largest luminance PQ encodes, at an encoded value of 1. Measured in candelas per square meter.
 *
 * @see https://www.itu.int/rec/R-REC-BT.2100-3-202502-I/en
 */
export const pqPeakLuminance = Rational.fromBigInt(10000n);

/**
 * The luminance of HDR Reference White, that of a white card of 100% reflectance, to which the library maps its white, so that a color as bright as the white looks as bright as paper in an HDR picture. Measured in candelas per square meter.
 *
 * @see https://www.itu.int/pub/R-REP-BT.2408-9-2026
 */
export const referenceWhiteLuminance = Rational.fromBigInt(203n);

/**
 * The constants a, b and c of the hybrid log-gamma (HLG) transfer function of ITU-R BT.2100-3.
 *
 * @see https://www.itu.int/rec/R-REC-BT.2100-3-202502-I/en
 */
export const hlgTransfer: {
  readonly a: Rational.Rational;
  readonly b: Rational.Rational;
  readonly c: Rational.Rational;
} = {
  a: Rational.makeUnsafe(17883277n, 100000000n),
  b: Rational.makeUnsafe(28466892n, 100000000n),
  c: Rational.makeUnsafe(55991073n, 100000000n),
};

/**
 * The scale by which CSS Color HDR divides a linear channel before HLG encodes it, so that the library's white is written at an HLG value of 0.75, to four decimal places, which is where ITU-R BT.2408-9 places HDR Reference White.
 *
 * @see https://www.w3.org/TR/2026/WD-css-color-hdr-1-20261026/#rec2100-hlg
 * @see https://www.itu.int/pub/R-REP-BT.2408-9-2026
 */
export const hlgScale = Rational.makeUnsafe(37743n, 10000n);

/**
 * sRGB on the white its standard writes.
 *
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#predefined-sRGB
 */
export const srgb: Medium = mediumOf(
  'srgb',
  {
    red: { x: Rational.makeUnsafe(640n, 1000n), y: Rational.makeUnsafe(330n, 1000n) },
    green: { x: Rational.makeUnsafe(300n, 1000n), y: Rational.makeUnsafe(600n, 1000n) },
    blue: { x: Rational.makeUnsafe(150n, 1000n), y: Rational.makeUnsafe(60n, 1000n) },
  },
  standardWhiteChromaticity,
  Rational.fromBigInt(1n),
);

/**
 * Display P3 on the white its standard writes, with the transfer function of sRGB.
 *
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#predefined-display-p3
 */
export const displayP3: Medium = mediumOf(
  'display-p3',
  {
    red: { x: Rational.makeUnsafe(680n, 1000n), y: Rational.makeUnsafe(320n, 1000n) },
    green: { x: Rational.makeUnsafe(265n, 1000n), y: Rational.makeUnsafe(690n, 1000n) },
    blue: { x: Rational.makeUnsafe(150n, 1000n), y: Rational.makeUnsafe(60n, 1000n) },
  },
  standardWhiteChromaticity,
  Rational.fromBigInt(1n),
);

/**
 * Rec. 2020 on the white its standard writes, with the display curve of ITU-R BT.1886-0.
 *
 * @see https://www.itu.int/rec/R-REC-BT.2020-2-201510-I/en
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#predefined-rec2020
 */
export const rec2020: Medium = mediumOf(
  'rec2020',
  {
    red: { x: Rational.makeUnsafe(708n, 1000n), y: Rational.makeUnsafe(292n, 1000n) },
    green: { x: Rational.makeUnsafe(170n, 1000n), y: Rational.makeUnsafe(797n, 1000n) },
    blue: { x: Rational.makeUnsafe(131n, 1000n), y: Rational.makeUnsafe(46n, 1000n) },
  },
  standardWhiteChromaticity,
  Rational.fromBigInt(1n),
);

/**
 * BT.2100 with PQ on the white its standard writes, with the primaries of Rec. 2020. Its luminance is absolute, up to 10 000 cd/m², and the library maps its white, a Y of 1, to HDR Reference White, so that a linear channel of 1 is 203 cd/m² and the peak is 10 000 / 203 times the white.
 *
 * @see https://www.itu.int/rec/R-REC-BT.2100-3-202502-I/en
 * @see https://www.w3.org/TR/2026/WD-css-color-hdr-1-20261026/#rec2100-pq
 */
export const rec2100Pq: Medium = mediumOf(
  'rec2100-pq',
  rec2020.primaries,
  standardWhiteChromaticity,
  Rational.divideUnsafe(pqPeakLuminance, referenceWhiteLuminance),
);

/**
 * BT.2100 with HLG on the white its standard writes, with the primaries of Rec. 2020 and its white written at an HLG value of 0.75, to four decimal places. How far above the white it reaches is not a property of the medium, because the system gamma of HLG depends on the peak luminance of the display; its peak is therefore the white until the rule for luminance decides otherwise.
 *
 * @see https://www.itu.int/rec/R-REC-BT.2100-3-202502-I/en
 * @see https://www.w3.org/TR/2026/WD-css-color-hdr-1-20261026/#rec2100-hlg
 */
export const rec2100Hlg: Medium = mediumOf(
  'rec2100-hlg',
  rec2020.primaries,
  standardWhiteChromaticity,
  Rational.fromBigInt(1n),
);

/** The same medium on the library's exact white, `whiteChromaticity`, with its matrices derived again from that white, for physical exactness. It is written with the same identifier, such as `color(srgb …)`, and its channels are worked out from the exact white, but a browser reads them on the white the standard writes, so its colors differ from the browser's in the fifth decimal place. */
export const onExactWhite = (medium: Medium): Medium =>
  mediumOf(medium.colorSpace, medium.primaries, whiteChromaticity, medium.peak);

/** Whether a color lies within the gamut of a medium, with each of its linear channels from 0 to the peak of the medium, decided exactly. */
export const isInGamut = (medium: Medium, color: Tristimulus): boolean =>
  transform(medium.xyzToLinear, [color.X, color.Y, color.Z]).every(
    (channel) =>
      Rational.isGreaterThanOrEqualTo(channel, Rational.fromBigInt(0n)) &&
      Rational.isLessThanOrEqualTo(channel, medium.peak),
  );

/** A color written in the CSS syntax of a medium, such as `color(srgb 1 0.5 0)`. Its linear channels are exact; each is rounded once to the nearest number and encoded in floating point by the medium's transfer function, as CSS Color 4 and CSS Color HDR encode it, including how they extend it to negative channels. The powers, logarithms and exponentials of the transfer functions are assumed accurate to one unit in the last place, since ECMAScript leaves their accuracy to the engines, so each encoded channel lies within a few units in the last place of the exact encoding; it is written as the shortest number that reads back as the same value. */
export const write = (medium: Medium, color: Tristimulus): string => {
  const encoded = transform(medium.xyzToLinear, [color.X, color.Y, color.Z]).map((channel) => {
    // A linear channel of a color lies far within the range of a number, so the conversion is finite.
    const linear = Rational.toNumberUnsafe(channel);
    return medium.colorSpace === 'srgb' || medium.colorSpace === 'display-p3'
      ? Math.abs(linear) <= Rational.toNumberUnsafe(srgbTransfer.linearThreshold)
        ? Rational.toNumberUnsafe(srgbTransfer.slope) * linear
        : Math.sign(linear) *
          ((1 + Rational.toNumberUnsafe(srgbTransfer.offset)) *
            Math.abs(linear) ** (1 / Rational.toNumberUnsafe(srgbTransfer.exponent)) -
            Rational.toNumberUnsafe(srgbTransfer.offset))
      : medium.colorSpace === 'rec2020'
        ? Math.sign(linear) *
          Math.abs(linear) ** (1 / Rational.toNumberUnsafe(rec2020TransferExponent))
        : medium.colorSpace === 'rec2100-pq'
          ? ((Rational.toNumberUnsafe(pqTransfer.c1) +
              Rational.toNumberUnsafe(pqTransfer.c2) *
                Math.max(
                  (linear * Rational.toNumberUnsafe(referenceWhiteLuminance)) /
                    Rational.toNumberUnsafe(pqPeakLuminance),
                  0,
                ) **
                  Rational.toNumberUnsafe(pqTransfer.m1)) /
              (1 +
                Rational.toNumberUnsafe(pqTransfer.c3) *
                  Math.max(
                    (linear * Rational.toNumberUnsafe(referenceWhiteLuminance)) /
                      Rational.toNumberUnsafe(pqPeakLuminance),
                    0,
                  ) **
                    Rational.toNumberUnsafe(pqTransfer.m1))) **
            Rational.toNumberUnsafe(pqTransfer.m2)
          : linear / Rational.toNumberUnsafe(hlgScale) <= 1 / 12
            ? Math.sign(linear) *
              Math.sqrt((3 * Math.abs(linear)) / Rational.toNumberUnsafe(hlgScale))
            : Rational.toNumberUnsafe(hlgTransfer.a) *
                Math.log(
                  (12 * linear) / Rational.toNumberUnsafe(hlgScale) -
                    Rational.toNumberUnsafe(hlgTransfer.b),
                ) +
              Rational.toNumberUnsafe(hlgTransfer.c);
  });
  return `color(${medium.colorSpace} ${encoded[0]} ${encoded[1]} ${encoded[2]})`;
};
