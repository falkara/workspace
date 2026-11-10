import {
  Array,
  Brand,
  Cause,
  Data,
  Effect,
  Exit,
  Option,
  Predicate,
  Rational,
  Record,
  Schema,
} from 'effect';

import * as Real from '#src/Real';

/** The tristimulus values of a color, a light, relative to the white, whose Y is 1. Branded apart from a direction, which has the same shape but is a change of a color rather than a light, so that only a light is written, tested for a gamut or given a chromaticity. */
export type Tristimulus = Brand.Branded<
  {
    readonly X: Rational.Rational;
    readonly Y: Rational.Rational;
    readonly Z: Rational.Rational;
  },
  'Tristimulus'
>;

/** The tristimulus values of a color as a caller writes them, branded as they are, as every function that takes a color judges it itself, refusing what lies outside a medium. */
export const tristimulus = Brand.nominal<Tristimulus>();

/**
 * The tristimulus values of CIE standard illuminant D65 under the CIE 1931 2° observer, worked out once from the CIE datasets (SHA-256 `fa663e3535a7e0763a745993a1f0a192eb0275ac46ad2d1befd7626841e713c1` and `e76f210bffff3d552ef7113025da5f325d5dfec200dd4b878b1a2f3a507032cb`) by summing every 1 nm from 360 nm to 830 nm, as CIE 015 prescribes.
 *
 * @see https://cie.co.at/publications/colorimetry-part-2-cie-standard-illuminants-0
 * @see https://cie.co.at/publications/colorimetry-part-1-cie-standard-colorimetric-observers-0
 * @see https://doi.org/10.25039/CIE.DS.xvudnb9b
 * @see https://doi.org/10.25039/CIE.DS.hjfjmt59
 * @see https://doi.org/10.25039/TR.015.2018
 */
export const whiteTristimulus: Tristimulus = tristimulus({
  X: Rational.makeUnsafe(71740714395483087745n, 75479154764200873016n),
  Y: Rational.fromBigInt(1n),
  Z: Rational.makeUnsafe(10272984088266781770n, 9434894345525109127n),
});

/** The chromaticity coordinates of a color: its position in the chromaticity plane, a view of its tristimulus values for people and diagrams. Dividing by X + Y + Z drops the intensity and mixes lights non-linearly, so nothing is computed in it. */
export interface Chromaticity {
  readonly x: Rational.Rational;
  readonly y: Rational.Rational;
}

/** The chromaticity coordinates of a color, X and Y over X + Y + Z; none for a color whose X + Y + Z is 0, such as black, which has no chromaticity. */
export const chromaticityOf = (color: Tristimulus): Option.Option<Chromaticity> =>
  Option.zipWith(
    Rational.divide(color.X, Rational.sumAll([color.X, color.Y, color.Z])),
    Rational.divide(color.Y, Rational.sumAll([color.X, color.Y, color.Z])),
    (x, y) => ({ x, y }),
  );

/** The chromaticity coordinates of the library's white. */
export const whiteChromaticity: Chromaticity = {
  x: Rational.divideUnsafe(
    whiteTristimulus.X,
    // The tristimulus values of the white are positive, so their sum is and the division cannot fail.
    Rational.sumAll([whiteTristimulus.X, whiteTristimulus.Y, whiteTristimulus.Z]),
  ),
  y: Rational.divideUnsafe(
    whiteTristimulus.Y,
    // The tristimulus values of the white are positive, so their sum is and the division cannot fail.
    Rational.sumAll([whiteTristimulus.X, whiteTristimulus.Y, whiteTristimulus.Z]),
  ),
};

/** A vector in XYZ that is not a light but a change of one: added to a color, it moves the color along a hue, and its values may be negative. Branded apart from a color, which has the same shape, so that it is never written, tested for a gamut or given a chromaticity. */
export type Direction = Brand.Branded<
  {
    readonly X: Rational.Rational;
    readonly Y: Rational.Rational;
    readonly Z: Rational.Rational;
  },
  'Direction'
>;

/** A direction made from its values in XYZ, which only the library does, from the spectral light of a wavelength. */
const makeDirection = Brand.nominal<Direction>();

/** A color with a direction added: the color moved along the hue the direction gives, the sum of their values in XYZ. */
export const add = (color: Tristimulus, change: Direction): Tristimulus =>
  tristimulus({
    X: Rational.sum(color.X, change.X),
    Y: Rational.sum(color.Y, change.Y),
    Z: Rational.sum(color.Z, change.Z),
  });

/** A direction scaled by a factor: as much more or less of the same change, and its opposite for a negative factor. */
export const scale = (change: Direction, factor: Rational.Rational): Direction =>
  makeDirection({
    X: Rational.multiply(change.X, factor),
    Y: Rational.multiply(change.Y, factor),
    Z: Rational.multiply(change.Z, factor),
  });

/**
 * A hue given by a wavelength, as a mixture of two lights, which add as vectors in XYZ: the library's white, W, `whiteTristimulus`, and a direction, D, the spectral light S = (x̄, ȳ, z̄) of the wavelength for a dominant wavelength and its opposite, −S, for a complementary one. Its colors are α·W + β·D with α > 0 and β ≥ 0. The colors of a dominant wavelength mix the white with its spectral light, and a color of a complementary wavelength, mixed with its spectral light, gives white, as CIE S 017 defines the two. Every operation of colorimetry is linear in XYZ, so the hue is held there; the chromaticity of its spectral light, `chromaticityOf(spectralLight)`, is only a view.
 *
 * @see https://cie.co.at/eilvterm/17-23-062
 * @see https://cie.co.at/eilvterm/17-23-063
 */
export interface Hue {
  /** The spectral light S of the wavelength, a light, as the observer's values are published. */
  readonly spectralLight: Tristimulus;
  /** The change mixed with the white: S for a dominant wavelength and −S for a complementary one. */
  readonly direction: Direction;
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
        'Expected x̄, ȳ and z̄ not to be all 0, so that there is a spectral light to mix with the white',
    ),
    Schema.makeFilter(
      (row) =>
        // A row of 0 is refused by the check above, with its own reason.
        Rational.isZero(Rational.sumAll([row.xBar, row.yBar, row.zBar])) ||
        // Parallel exactly when every component of the cross product of the spectral light and the white is 0.
        !Rational.isZero(
          Rational.subtract(
            Rational.multiply(row.yBar, whiteTristimulus.Z),
            Rational.multiply(row.zBar, whiteTristimulus.Y),
          ),
        ) ||
        !Rational.isZero(
          Rational.subtract(
            Rational.multiply(row.zBar, whiteTristimulus.X),
            Rational.multiply(row.xBar, whiteTristimulus.Z),
          ),
        ) ||
        !Rational.isZero(
          Rational.subtract(
            Rational.multiply(row.xBar, whiteTristimulus.Y),
            Rational.multiply(row.yBar, whiteTristimulus.X),
          ),
        ) ||
        'Expected a spectral light not parallel to the white, so that mixing it with the white changes the hue, as no spectral light of the observer has the chromaticity of the white',
    ),
  ),
);

/** A dominant wavelength and the values of the observer's color-matching functions at it, as they are written. */
export type DominantWavelengthOptions = typeof DominantWavelengthOptions.Encoded;

/**
 * The hue of a dominant wavelength, as CIE S 017 defines it: the mixtures of the white with the spectral light of that wavelength, its values of the observer taken as they are published. Worked out exactly; or a failure with the reason when the wavelength is out of range or the values cannot be a row of the observer.
 *
 * @see https://cie.co.at/eilvterm/17-23-062
 */
export const dominantWavelength = (
  options: DominantWavelengthOptions,
): Exit.Exit<Hue, Schema.SchemaError> =>
  Exit.map(Schema.decodeExit(DominantWavelengthOptions)(options, { errors: 'all' }), (row) => ({
    spectralLight: tristimulus({ X: row.xBar, Y: row.yBar, Z: row.zBar }),
    direction: makeDirection({ X: row.xBar, Y: row.yBar, Z: row.zBar }),
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
        'Expected x̄, ȳ and z̄ not to be all 0, so that there is a spectral light to mix with the white',
    ),
    Schema.makeFilter(
      (row) =>
        // A row of 0 is refused by the check above, with its own reason.
        Rational.isZero(Rational.sumAll([row.xBar, row.yBar, row.zBar])) ||
        // Parallel exactly when every component of the cross product of the spectral light and the white is 0.
        !Rational.isZero(
          Rational.subtract(
            Rational.multiply(row.yBar, whiteTristimulus.Z),
            Rational.multiply(row.zBar, whiteTristimulus.Y),
          ),
        ) ||
        !Rational.isZero(
          Rational.subtract(
            Rational.multiply(row.zBar, whiteTristimulus.X),
            Rational.multiply(row.xBar, whiteTristimulus.Z),
          ),
        ) ||
        !Rational.isZero(
          Rational.subtract(
            Rational.multiply(row.xBar, whiteTristimulus.Y),
            Rational.multiply(row.yBar, whiteTristimulus.X),
          ),
        ) ||
        'Expected a spectral light not parallel to the white, so that mixing it with the white changes the hue, as no spectral light of the observer has the chromaticity of the white',
    ),
  ),
);

/** A complementary wavelength and the values of the observer's color-matching functions at it, as they are written. */
export type ComplementaryWavelengthOptions = typeof ComplementaryWavelengthOptions.Encoded;

/**
 * The hue of a complementary wavelength, as CIE S 017 defines it for purples, which no single wavelength produces: the mixtures of the white with the opposite of the spectral light of that wavelength, so that each, mixed with that spectral light, gives white. Its values of the observer are taken as they are published. Worked out exactly; or a failure with the reason when the wavelength is out of range or the values cannot be a row of the observer.
 *
 * @see https://cie.co.at/eilvterm/17-23-063
 */
export const complementaryWavelength = (
  options: ComplementaryWavelengthOptions,
): Exit.Exit<Hue, Schema.SchemaError> =>
  Exit.map(
    Schema.decodeExit(ComplementaryWavelengthOptions)(options, { errors: 'all' }),
    (row) => ({
      spectralLight: tristimulus({ X: row.xBar, Y: row.yBar, Z: row.zBar }),
      direction: makeDirection({
        X: Rational.negate(row.xBar),
        Y: Rational.negate(row.yBar),
        Z: Rational.negate(row.zBar),
      }),
    }),
  );

/** Three exact numbers in a space, such as XYZ or the linear channels of a medium. The space is a phantom parameter, a property that exists in the type alone and is never present, so that a vector of one space is refused where a vector of another is expected, while a vector written by hand fits any space. It is covariant, so that the vector of one medium fits where that of any medium is expected, which a brand of Effect, being invariant, would refuse. */
export type Vector<Space extends string> = readonly [
  Rational.Rational,
  Rational.Rational,
  Rational.Rational,
] & { readonly '~space'?: Space };

/** Three rows of three exact numbers, which turn a vector of one space into a vector of another. The two spaces are phantom parameters, as that of a vector is, so that a matrix applies only to a vector of the space it converts from. */
export type Matrix<From extends string, To extends string> = readonly [
  readonly [Rational.Rational, Rational.Rational, Rational.Rational],
  readonly [Rational.Rational, Rational.Rational, Rational.Rational],
  readonly [Rational.Rational, Rational.Rational, Rational.Rational],
] & { readonly '~spaces'?: { readonly from: From; readonly to: To } };

/** The vector in XYZ of a color or of a direction, both of which live there. */
export const xyzOf = (value: Tristimulus | Direction): Vector<'XYZ'> => [value.X, value.Y, value.Z];

/** The product of a matrix and a vector of the space it converts from, worked out exactly: the vector in the space it converts to. The space of the vector is not inferred from the vector, so that a vector of another space is refused rather than widening it. */
export const transform = <From extends string, To extends string>(
  [first, second, third]: Matrix<From, To>,
  [x, y, z]: Vector<NoInfer<From>>,
): Vector<To> => [
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
const inverseOf = <From extends string, To extends string>([
  [a, b, c],
  [d, e, f],
  [g, h, i],
]: Matrix<From, To>): Matrix<To, From> => {
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

/** The identifiers with which CSS writes the media in `color()`, each of which also names a transfer function. */
export type ColorSpace = 'srgb' | 'display-p3' | 'rec2020' | 'rec2100-pq' | 'rec2100-hlg';

/** The white the matrices of a medium are worked out on: the one its standard writes, or the library's exact white, as `onExactWhite` gives it. The linear channels of a color differ between the two, so the white is part of their space. */
export type MediumWhite = 'standard' | 'exact';

/** The space of the linear channels of a medium on a white. */
export type LinearSpace<
  Space extends ColorSpace,
  White extends MediumWhite,
> = `linear ${Space}, ${White} white`;

/** A luminance in candelas per square meter, absolute, as BT.2100 gives it. Branded apart from a value relative to the white, in which a medium works, so that the one is never taken for the other. */
export type Luminance = Brand.Branded<Rational.Rational, 'cd/m²'>;

/** A luminance made from its value, which only the library does, from the standards. */
const luminance = Brand.nominal<Luminance>();

/** A value relative to the white, whose linear channels are 1: a linear channel, a headroom or the peak of a medium. Branded apart from a luminance in cd/m², which HDR scales by the luminance of the white. */
export type RelativeToWhite = Brand.Branded<Rational.Rational, 'relative to the white'>;

/** A value relative to the white as a caller writes it, such as a headroom, branded as it is, as every function that takes one checks it itself. */
export const relativeToWhite = Brand.nominal<RelativeToWhite>();

/**
 * A relative luminance: the luminance Y of a color relative to that of the white, whose Y is 1, as WCAG 2.2 defines it, 0 for black and 1 for white. Branded apart from a value relative to the white, which bounds a linear channel rather than Y, as the red of sRGB has a channel of 1 and a relative luminance of 0.2126.
 *
 * @see https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 */
export type RelativeLuminance = Brand.Branded<Rational.Rational, 'relative luminance'>;

/** A relative luminance as a caller writes it, branded as it is, as every function that takes one checks it itself. */
export const relativeLuminance = Brand.nominal<RelativeLuminance>();

/**
 * A medium: a display color space in which a color is written. It holds what its standard defines (its primaries, its white and, through its CSS identifier, its transfer function) and the matrices that follow from them. It is plain data, so `Equal.equals` compares two media by value. Its space and its white are type parameters, which the space of its linear channels carries, so that channels worked out in one medium, or on one white, are refused by the matrices of another; by default they are any, so that `Medium` is every medium.
 */
export interface Medium<
  Space extends ColorSpace = ColorSpace,
  White extends MediumWhite = MediumWhite,
> {
  /** The identifier with which CSS writes the medium in `color()`, which also names its transfer function. */
  readonly colorSpace: Space;
  readonly primaries: Primaries;
  readonly white: Chromaticity;
  /** From linear channels to tristimulus values relative to the white, whose Y is 1. */
  readonly linearToXyz: Matrix<LinearSpace<Space, White>, 'XYZ'>;
  /** From tristimulus values relative to the white to linear channels, the inverse of `linearToXyz`. */
  readonly xyzToLinear: Matrix<'XYZ', LinearSpace<Space, White>>;
  /** The largest linear channel the medium holds, relative to its white. */
  readonly peak: RelativeToWhite;
}

/** The medium with the given primaries, white and peak, with its matrices derived exactly as the standards derive them: the tristimulus values of each primary at a Y of 1, scaled so that the three add up to the white. */
const mediumOf = <Space extends ColorSpace, White extends MediumWhite>(
  colorSpace: Space,
  primaries: Primaries,
  white: Chromaticity,
  peak: RelativeToWhite,
): Medium<Space, White> => {
  // The y of every primary and of every white is positive, so none of the divisions by it below can fail.
  const unscaled: Matrix<'primaries at a Y of 1', 'XYZ'> = [
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
  const linearToXyz: Matrix<LinearSpace<Space, White>, 'XYZ'> = [
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
export const pqPeakLuminance: Luminance = luminance(Rational.fromBigInt(10000n));

/**
 * The luminance of HDR Reference White, that of a white card of 100% reflectance, to which the library maps its white, so that a color as bright as the white looks as bright as paper in an HDR picture. Measured in candelas per square meter.
 *
 * @see https://www.itu.int/pub/R-REP-BT.2408-9-2026
 */
export const referenceWhiteLuminance: Luminance = luminance(Rational.fromBigInt(203n));

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
export const srgb: Medium<'srgb', 'standard'> = mediumOf(
  'srgb',
  {
    red: { x: Rational.makeUnsafe(640n, 1000n), y: Rational.makeUnsafe(330n, 1000n) },
    green: { x: Rational.makeUnsafe(300n, 1000n), y: Rational.makeUnsafe(600n, 1000n) },
    blue: { x: Rational.makeUnsafe(150n, 1000n), y: Rational.makeUnsafe(60n, 1000n) },
  },
  standardWhiteChromaticity,
  relativeToWhite(Rational.fromBigInt(1n)),
);

/**
 * Display P3 on the white its standard writes, with the transfer function of sRGB.
 *
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#predefined-display-p3
 */
export const displayP3: Medium<'display-p3', 'standard'> = mediumOf(
  'display-p3',
  {
    red: { x: Rational.makeUnsafe(680n, 1000n), y: Rational.makeUnsafe(320n, 1000n) },
    green: { x: Rational.makeUnsafe(265n, 1000n), y: Rational.makeUnsafe(690n, 1000n) },
    blue: { x: Rational.makeUnsafe(150n, 1000n), y: Rational.makeUnsafe(60n, 1000n) },
  },
  standardWhiteChromaticity,
  relativeToWhite(Rational.fromBigInt(1n)),
);

/**
 * Rec. 2020 on the white its standard writes, with the display curve of ITU-R BT.1886-0.
 *
 * @see https://www.itu.int/rec/R-REC-BT.2020-2-201510-I/en
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#predefined-rec2020
 */
export const rec2020: Medium<'rec2020', 'standard'> = mediumOf(
  'rec2020',
  {
    red: { x: Rational.makeUnsafe(708n, 1000n), y: Rational.makeUnsafe(292n, 1000n) },
    green: { x: Rational.makeUnsafe(170n, 1000n), y: Rational.makeUnsafe(797n, 1000n) },
    blue: { x: Rational.makeUnsafe(131n, 1000n), y: Rational.makeUnsafe(46n, 1000n) },
  },
  standardWhiteChromaticity,
  relativeToWhite(Rational.fromBigInt(1n)),
);

/**
 * BT.2100 with PQ on the white its standard writes, with the primaries of Rec. 2020. Its luminance is absolute, up to 10 000 cd/m², and the library maps its white, a Y of 1, to HDR Reference White, so that a linear channel of 1 is 203 cd/m² and the peak is 10 000 / 203 times the white.
 *
 * @see https://www.itu.int/rec/R-REC-BT.2100-3-202502-I/en
 * @see https://www.w3.org/TR/2026/WD-css-color-hdr-1-20261026/#rec2100-pq
 */
export const rec2100Pq: Medium<'rec2100-pq', 'standard'> = mediumOf(
  'rec2100-pq',
  rec2020.primaries,
  standardWhiteChromaticity,
  // A luminance over the luminance of the white is relative to the white; the luminance of the white is positive, so the division cannot fail.
  relativeToWhite(Rational.divideUnsafe(pqPeakLuminance, referenceWhiteLuminance)),
);

/**
 * BT.2100 with HLG on the white its standard writes, with the primaries of Rec. 2020 and its white written at an HLG value of 0.75, to four decimal places. How far above the white it reaches is not a property of the medium, because the system gamma of HLG depends on the peak luminance of the display; its peak is therefore the white until the rule for luminance decides otherwise.
 *
 * @see https://www.itu.int/rec/R-REC-BT.2100-3-202502-I/en
 * @see https://www.w3.org/TR/2026/WD-css-color-hdr-1-20261026/#rec2100-hlg
 */
export const rec2100Hlg: Medium<'rec2100-hlg', 'standard'> = mediumOf(
  'rec2100-hlg',
  rec2020.primaries,
  standardWhiteChromaticity,
  relativeToWhite(Rational.fromBigInt(1n)),
);

/** The same medium on the library's exact white, `whiteChromaticity`, with its matrices derived again from that white, for physical exactness. It is written with the same identifier, such as `color(srgb …)`, and its channels are worked out from the exact white, but a browser reads them on the white the standard writes, so its colors differ from the browser's in the fifth decimal place. */
export const onExactWhite = <Space extends ColorSpace>(
  medium: Medium<Space>,
): Medium<Space, 'exact'> =>
  mediumOf(medium.colorSpace, medium.primaries, whiteChromaticity, medium.peak);

/**
 * The deepest channel the library judges colors in: 16 bits, the most an image format such as PNG holds, so that its steps are whole numbers.
 *
 * @see https://www.w3.org/TR/png-3/#11IHDR
 */
export const deepestChannelBits = 16;

/** The decimal places every number of a color is written with: the fewest that tell apart every step of the deepest channel, 1 / (2^16 − 1), and read back as the same step, as two steps a decimal place apart can round alike only when the decimal place is at least the step, and rounding moves a number by at most half of it. */
export const decimalPlaces = ((): number => {
  let places = 0;
  // 10^−d below a step of the deepest channel: 10^d above its number of steps.
  while (10n ** BigInt(places) <= (1n << BigInt(deepestChannelBits)) - 1n) {
    places++;
  }
  return places;
})();

/** A color of the given medium, the linear channels of a color decided to be from 0 to the peak of the medium; the space of the channels is the brand, so that it names the medium on its white. */
export type InGamut<M extends Medium> = Brand.Branded<
  Tristimulus,
  `in the gamut of ${NonNullable<M['xyzToLinear']['~spaces']>['to']}`
>;

/** The failure of a color that lies outside the gamut of a medium, a result of deciding it rather than a fault of the input. */
export class OutOfGamut extends Schema.TaggedError<OutOfGamut, { readonly brand: unique symbol }>()(
  'OutOfGamut',
  {
    /** The identifier of the medium the color lies outside of. */
    medium: Schema.String,
    /** Which channel leaves the gamut, and by how much. */
    message: Schema.String,
  },
) {}

/** A color marked as lying in the gamut of a medium, which only the library does, once the color is decided to lie there. The brand exists in the type alone, so the color is marked as it is: the precise type is the signature, which the checker holds compatible with the implementation, as the color in the gamut of a medium is a color. */
function markInGamut<M extends Medium>(medium: M, color: Tristimulus): InGamut<M>;
function markInGamut(_medium: Medium, color: Tristimulus): Tristimulus {
  return color;
}

/** A color proven to lie in the gamut of a medium, each of its linear channels from 0 to the peak of the medium, decided exactly; or the failure naming the first channel that leaves it and its value. Only through it, or through a definition, does a color reach `write`, so that nothing reaches CSS outside a gamut. */
export const inGamut = <M extends Medium>(
  medium: M,
  color: Tristimulus,
): Exit.Exit<InGamut<M>, OutOfGamut> => {
  const channels = transform(medium.xyzToLinear, xyzOf(color));
  const outside = [0, 1, 2].find(
    (index) =>
      Rational.isNegative(channels[index] ?? Rational.fromBigInt(0n)) ||
      Rational.isGreaterThan(channels[index] ?? Rational.fromBigInt(0n), medium.peak),
  );
  return outside === undefined
    ? Exit.succeed(markInGamut(medium, color))
    : Exit.fail(
        new OutOfGamut({
          medium: medium.colorSpace,
          message: `Expected a color within the gamut of ${medium.colorSpace}, each linear channel from 0 to ${Real.writeDecimals(medium.peak, decimalPlaces)}; its ${['red', 'green', 'blue'][outside] ?? ''} channel is ${Real.writeDecimals(channels[outside] ?? Rational.fromBigInt(0n), decimalPlaces)}`,
        }),
      );
};

/** A color written in the CSS syntax of a medium, whatever its channels, which only a color proven to lie in the gamut of the medium reaches from outside the module. */
const written = (medium: Medium, color: Tristimulus): string => {
  const encoded = transform(medium.xyzToLinear, xyzOf(color)).map((channel) => {
    const magnitude = Real.fromRational(Rational.abs(channel));
    const sign = Real.fromRational(Rational.fromBigInt(Rational.isNegative(channel) ? -1n : 1n));
    const value =
      medium.colorSpace === 'srgb' || medium.colorSpace === 'display-p3'
        ? Rational.isLessThanOrEqualTo(Rational.abs(channel), srgbTransfer.linearThreshold)
          ? Real.fromRational(Rational.multiply(srgbTransfer.slope, channel))
          : Real.multiply(
              sign,
              Real.subtract(
                Real.multiply(
                  Real.fromRational(Rational.sum(Rational.fromBigInt(1n), srgbTransfer.offset)),
                  Real.power(
                    magnitude,
                    // The exponent is positive, so its reciprocal is defined.
                    Rational.divideUnsafe(Rational.fromBigInt(1n), srgbTransfer.exponent),
                  ),
                ),
                Real.fromRational(srgbTransfer.offset),
              ),
            )
        : medium.colorSpace === 'rec2020'
          ? Real.multiply(
              sign,
              Real.power(
                magnitude,
                // The exponent is positive, so its reciprocal is defined.
                Rational.divideUnsafe(Rational.fromBigInt(1n), rec2020TransferExponent),
              ),
            )
          : medium.colorSpace === 'rec2100-pq'
            ? ((): Real.Real => {
                // The luminance relative to the peak, held at 0 below, as CSS Color HDR holds it; the peak luminance is positive, so the division cannot fail.
                const relative = Rational.max(
                  Rational.divideUnsafe(
                    Rational.multiply(channel, referenceWhiteLuminance),
                    pqPeakLuminance,
                  ),
                  Rational.fromBigInt(0n),
                );
                const raised = Real.power(Real.fromRational(relative), pqTransfer.m1);
                const value = Real.power(
                  Real.divide(
                    Real.add(
                      Real.fromRational(pqTransfer.c1),
                      Real.multiply(Real.fromRational(pqTransfer.c2), raised),
                    ),
                    Real.add(
                      Real.fromRational(Rational.fromBigInt(1n)),
                      Real.multiply(Real.fromRational(pqTransfer.c3), raised),
                    ),
                  ),
                  pqTransfer.m2,
                );
                // Irrational whenever u = y^m1 is: the base g = (c1 + c2 u) / (1 + c3 u) and u determine each other by a fractional linear map with rational coefficients, so they generate the same field; the degree of u divides 8192, a power of 2, and if g^m2 were rational, the degree of g would divide the odd 2523, so both degrees would be 1 and u rational.
                return { ...value, irrational: value.irrational || raised.irrational };
              })()
            : // HLG: the channel over its scale, a square root up to 1/12, below 0 included, and a logarithm above, whose argument is then above 1 − b, which is positive; the scale is positive, so the division cannot fail.
              Rational.isLessThanOrEqualTo(
                  Rational.divideUnsafe(channel, hlgScale),
                  Rational.makeUnsafe(1n, 12n),
                )
              ? Real.multiply(
                  sign,
                  Real.root(
                    Real.fromRational(
                      Rational.divideUnsafe(
                        Rational.multiply(Rational.fromBigInt(3n), Rational.abs(channel)),
                        hlgScale,
                      ),
                    ),
                    2,
                  ),
                )
              : Real.add(
                  Real.multiply(
                    Real.fromRational(hlgTransfer.a),
                    Real.ln(
                      Real.fromRational(
                        Rational.subtract(
                          Rational.divideUnsafe(
                            Rational.multiply(Rational.fromBigInt(12n), channel),
                            hlgScale,
                          ),
                          hlgTransfer.b,
                        ),
                      ),
                    ),
                  ),
                  Real.fromRational(hlgTransfer.c),
                );
    // Every encoded channel is known to be rational or irrational, as each step above states, so no bounds are ever taken as a halfway point and the width given is never used.
    return Real.writeDecimals(
      Real.roundToDecimals(value, decimalPlaces, Rational.fromBigInt(0n)),
      decimalPlaces,
    );
  });
  return `color(${medium.colorSpace} ${encoded[0]} ${encoded[1]} ${encoded[2]})`;
};

/**
 * A color proven to lie in the gamut of a medium, written in its CSS syntax, such as `color(srgb 1 0.5 0)`: its linear channels exactly, encoded exactly by the medium's transfer function, as CSS Color 4 and CSS Color HDR define it, including how they extend it to negative channels, and each rounded to `decimalPlaces` decimal places, to the nearest, a number exactly halfway toward +∞, as CSS Color 4 rounds the values it serializes.
 *
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#serializing-color-function-values
 */
export const write = <M extends Medium>(medium: M, color: InGamut<NoInfer<M>>): string =>
  written(medium, color);

/** The headroom at the level of the white, 1, at which a color is no brighter than the white allows in SDR and stays at the level of HDR Reference White in HDR, exactly as in SDR; the default headroom of `purest`. */
export const whiteLevel: RelativeToWhite = relativeToWhite(Rational.fromBigInt(1n));

/**
 * A schema of the hue and the headroom of the purest color of a hue, in whichever medium it is written. The hue is taken as the library makes it, by `dominantWavelength` and `complementaryWavelength`, and is not checked in depth, so it is not decoded from JSON. The headroom is the largest linear channel the color may reach, relative to the white, whose channels are 1: by default `whiteLevel`, 1, so that the color is no brighter than the white allows in SDR and stays at the level of HDR Reference White in HDR, exactly as in SDR. It bounds the largest channel rather than the luminance Y, as a bound on Y would brighten a color in HDR even at 1.
 *
 * Outside the library, the headroom is bounded by more than the medium: WCAG 2.2 says nothing about luminance above the white, as its contrast runs from black at 0 to white at 1; a display shows no more than its own peak; and a reader or a browser can lower it through `dynamic-range-limit`. If a color above the white flashes or pulses, WCAG 2.2 Three Flashes applies, and a bright HDR color makes a failure far more likely.
 *
 * @see https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 * @see https://www.w3.org/TR/2026/WD-css-color-hdr-1-20261026/#propdef-dynamic-range-limit
 * @see https://www.w3.org/TR/WCAG22/#three-flashes
 */
export const PurestOptions = Schema.Struct({
  /** The hue, as `dominantWavelength` or `complementaryWavelength` gives it. */
  hue: Schema.declare(
    (input): input is Hue =>
      Predicate.hasProperty(input, 'spectralLight') && Predicate.hasProperty(input, 'direction'),
  ),
  /** The largest linear channel the color may reach, relative to the white; 1 when it is not given. */
  headroom: Schema.optionalKey(
    Schema.declare((input): input is RelativeToWhite => Rational.isRational(input)).pipe(
      Schema.check(
        Schema.makeIsGreaterThan({ order: Rational.Order, formatter: Rational.format })(
          Rational.fromBigInt(0n),
          {
            message:
              'Expected a positive headroom, so that the color gives off light, as the purest color of a hue is not black',
          },
        ),
      ),
    ),
  ),
});

/** The hue and the headroom of the purest color of a hue, as they are written. */
export type PurestOptions = typeof PurestOptions.Encoded;

/** A schema of the options of the purest color together with the medium it is worked out in, which refuses a headroom above the peak of the medium. The medium is taken as the library makes it and is not checked in depth. */
const PurestInMedium = Schema.Struct({
  ...PurestOptions.fields,
  /** The medium, one of the media of the library or one `onExactWhite` builds. */
  medium: Schema.declare(
    (input): input is Medium =>
      Predicate.hasProperty(input, 'colorSpace') &&
      Predicate.hasProperty(input, 'xyzToLinear') &&
      Predicate.hasProperty(input, 'linearToXyz') &&
      Predicate.hasProperty(input, 'peak'),
  ),
}).pipe(
  Schema.check(
    Schema.makeFilter(
      (options) =>
        options.headroom === undefined ||
        Rational.isLessThanOrEqualTo(options.headroom, options.medium.peak) || {
          path: ['headroom'],
          issue:
            options.medium.colorSpace === 'rec2100-pq'
              ? `Expected a headroom of at most ${Rational.format(options.medium.peak)} for rec2100-pq, so that the color stays within the medium, as BT.2100 encodes no luminance above 10 000 cd/m²`
              : options.medium.colorSpace === 'rec2100-hlg'
                ? 'Expected a headroom of at most 1 for rec2100-hlg, so that the color stays within the medium, as how far HLG reaches above the white is not decided yet'
                : `Expected a headroom of at most 1 for ${options.medium.colorSpace}, so that the color stays within the medium, as its channels reach no further than its white`,
        },
    ),
  ),
);

/** A color independent of the medium it is written in: for any medium M, a color in the gamut of M, or a failure with the reason. It computes nothing until it is evaluated in a medium, by `inMedium`, `inMedia` or `writeMedia`. */
export interface Definition<E = never> {
  /** The rule that gives the color in a medium, which only a color of that medium satisfies. */
  readonly rule: <M extends Medium>(medium: M) => Exit.Exit<InGamut<M>, E>;
}

/**
 * The purest color of a hue in every medium, at the highest luminance the headroom allows, as tristimulus values relative to the white, worked out exactly; or, in a medium, a failure with the reason when the headroom is not positive or exceeds the peak of the medium. In the medium, the linear channels of a color α·W + β·D of the hue are α·w + β·d, with w and d those of the white and of the direction. The purest is the one with the largest β/α at which no channel is below 0: with α = 1, the smallest w_i / (−d_i) over the channels the direction lowers. Where the direction lowers none, the gamut holds the spectral light itself, and the purest color is the direction alone, α = 0, as Rec. 2020 and BT.2100 hold 532 nm and 630 nm, which their rounded primaries enclose. Every measure of purity CIE defines, such as excitation purity and colorimetric purity, grows with β/α along a hue, so the result does not depend on which one is meant. The color is then scaled until its largest linear channel reaches the headroom. Every step is rational, so the result is exact.
 */
export const purest = (options: PurestOptions): Definition<Schema.SchemaError> => ({
  rule: (medium) =>
    Exit.map(
      Schema.decodeExit(PurestInMedium)({ ...options, medium }, { errors: 'all' }),
      (options) => {
        const white = transform(options.medium.xyzToLinear, xyzOf(whiteTristimulus));
        const direction = transform(options.medium.xyzToLinear, xyzOf(options.hue.direction));
        // The β at which each channel the direction lowers reaches 0, with α = 1: every channel of the white is positive, as the white lies inside every gamut, so only a channel the direction lowers ever reaches 0.
        const limits = [0, 1, 2]
          .filter((channel) => Rational.isNegative(direction[channel] ?? Rational.fromBigInt(0n)))
          .map((channel) =>
            Rational.divideUnsafe(
              white[channel] ?? Rational.fromBigInt(0n),
              // Only a channel the direction lowers reaches this division, so the divisor is never 0.
              Rational.negate(direction[channel] ?? Rational.fromBigInt(-1n)),
            ),
          );
        // Where the direction lowers no channel, the direction alone, which only a dominant wavelength can give: the opposite of a light lowers a channel, as the Y of a light and of every primary is positive.
        const channels = Array.isArrayNonEmpty(limits)
          ? ([
              Rational.sum(
                white[0],
                Rational.multiply(Array.min(limits, Rational.Order), direction[0]),
              ),
              Rational.sum(
                white[1],
                Rational.multiply(Array.min(limits, Rational.Order), direction[1]),
              ),
              Rational.sum(
                white[2],
                Rational.multiply(Array.min(limits, Rational.Order), direction[2]),
              ),
            ] as const)
          : direction;
        // No channel is negative, and they are not all 0: the direction is not 0, and not parallel to the white, so no mixture of the two is black. The largest is positive and the division cannot fail.
        const scale = Rational.divideUnsafe(
          options.headroom ?? whiteLevel,
          Rational.max(Rational.max(channels[0], channels[1]), channels[2]),
        );
        const [X, Y, Z] = transform(options.medium.linearToXyz, [
          Rational.multiply(channels[0], scale),
          Rational.multiply(channels[1], scale),
          Rational.multiply(channels[2], scale),
        ]);
        // No channel is below 0 and the largest is the headroom, at most the peak of the medium, so the color lies in its gamut.
        return markInGamut(medium, tristimulus({ X, Y, Z }));
      },
    ),
});

/** A color of the consumer's own rule, which for a medium gives a color in its gamut, through `inGamut` or another definition, or fails with its reason. The rule is an effect with no requirements, and an `Exit` is one, so a rule may return what `inGamut` returns or be written with `Effect.gen`; it runs synchronously when the definition is evaluated, and a rule that does not finish synchronously fails with a defect. */
export const define = <E>(
  rule: <M extends Medium>(medium: M) => Effect.Effect<InGamut<M>, E>,
): Definition<E> => ({
  rule: (medium) => Effect.runSyncExit(rule(medium)),
});

/** The white of each medium, its linear channels all at 1: in a medium on the white its standard writes, that white, and in one on the exact white, the library's white, which can lie a little outside the gamut of a standard medium. */
export const white: Definition = {
  rule: (medium) => {
    const [X, Y, Z] = transform(medium.linearToXyz, [
      Rational.fromBigInt(1n),
      Rational.fromBigInt(1n),
      Rational.fromBigInt(1n),
    ]);
    // Every channel is 1, from 0 to the peak of the medium, which is at least 1, so the white lies in its gamut.
    return Exit.succeed(markInGamut(medium, tristimulus({ X, Y, Z })));
  },
};

/** The failure of a mixture that gives off no light, which no scale brings to a luminance, a result of mixing rather than a fault of the input. */
export class BlackMixture extends Schema.TaggedError<
  BlackMixture,
  { readonly brand: unique symbol }
>()('BlackMixture', {
  /** The identifier of the medium the base and the tint mix to black in. */
  medium: Schema.String,
  /** Why the mixture cannot be scaled. */
  message: Schema.String,
}) {}

/** A schema of the amounts of a mixture: the share of the tint and the relative luminance the mixture is scaled to, each a decision of its own, so that the share sets the chromaticity and the luminance the lightness. */
export const MixAmounts = Schema.Struct({
  /** The share of the tint, from 0 for the base alone to 1 for the tint alone: the percentage of the tint in `color-mix()`, over 100. */
  share: Schema.Rational.pipe(
    Schema.check(
      Schema.makeIsBetween({ order: Rational.Order, formatter: Rational.format })(
        { minimum: Rational.fromBigInt(0n), maximum: Rational.fromBigInt(1n) },
        {
          message:
            'Expected a share of the tint from 0 to 1, as the percentage of the tint in color-mix() runs from 0% to 100%',
        },
      ),
    ),
  ),
  /** The relative luminance the mixture is scaled to, above 0 and at most 1, that of the white. */
  luminance: Schema.Rational.pipe(
    Schema.check(
      Schema.makeIsGreaterThan({ order: Rational.Order, formatter: Rational.format })(
        Rational.fromBigInt(0n),
        { message: 'Expected a positive luminance, so that the surface gives off light' },
      ),
      Schema.makeIsLessThanOrEqualTo({ order: Rational.Order, formatter: Rational.format })(
        Rational.fromBigInt(1n),
        {
          message:
            'Expected a luminance of at most 1, the luminance of the white, as a surface is no brighter than the white',
        },
      ),
    ),
    Schema.brand('relative luminance'),
  ),
});

/** The amounts of a mixture as a mixture takes them, the luminance a relative luminance. */
export type MixAmounts = typeof MixAmounts.Type;

/** The colors of a mixture and its amounts: the base, the tint mixed into it, the share of the tint and the relative luminance of the mixture. */
export interface MixOptions<EBase, ETint> extends MixAmounts {
  /** The color the tint is mixed into, such as `white` for a surface. */
  readonly base: Definition<EBase>;
  /** The color mixed into the base, such as a brand, which mixes in each medium as the color it defines there. */
  readonly tint: Definition<ETint>;
}

/**
 * A mixture of two colors in each medium, as lights mix: the base and the tint taken in the medium, their tristimulus values mixed as CSS Color 5 `color-mix()` mixes them in `xyz-d65`, the tint at its share and the base at the rest, which is linear in light and so the same in any linear space; then scaled until its relative luminance is the one given, which CSS does not do, so that the share sets the chromaticity, that of `color-mix(in xyz-d65, base, tint P%)` with P the share times 100, and the luminance the lightness; and proven to lie in the gamut of the medium. It fails in a medium where the base or the tint fails, where the amounts are refused, where the base and the tint mix to black, or where the mixture at its luminance leaves the gamut, with the reason.
 *
 * @see https://www.w3.org/TR/2026/WD-css-color-5-20261029/#color-mix-result
 */
export const mix = <EBase, ETint>(
  options: MixOptions<EBase, ETint>,
): Definition<EBase | ETint | Schema.SchemaError | BlackMixture | OutOfGamut> =>
  define((medium) =>
    Effect.gen(function* () {
      const amounts = yield* Schema.decodeExit(MixAmounts)(
        { share: options.share, luminance: options.luminance },
        { errors: 'all' },
      );
      const base = yield* options.base.rule(medium);
      const tint = yield* options.tint.rule(medium);
      // The base at the rest of the share and the tint at the share, component by component.
      const mixture = {
        X: Rational.sum(
          Rational.multiply(Rational.subtract(Rational.fromBigInt(1n), amounts.share), base.X),
          Rational.multiply(amounts.share, tint.X),
        ),
        Y: Rational.sum(
          Rational.multiply(Rational.subtract(Rational.fromBigInt(1n), amounts.share), base.Y),
          Rational.multiply(amounts.share, tint.Y),
        ),
        Z: Rational.sum(
          Rational.multiply(Rational.subtract(Rational.fromBigInt(1n), amounts.share), base.Z),
          Rational.multiply(amounts.share, tint.Z),
        ),
      };
      // The base and the tint lie in the gamut, with no channel below 0, and every primary has a positive Y, so the Y of the mixture is not negative, and 0 only for black.
      if (Rational.isZero(mixture.Y)) {
        return yield* new BlackMixture({
          medium: medium.colorSpace,
          message: `Expected a mixture that gives off light, so that it can be scaled to a luminance; its base and tint mix to black in ${medium.colorSpace}`,
        });
      }
      return yield* inGamut(
        medium,
        tristimulus({
          // The Y of the mixture is positive, so the divisions cannot fail.
          X: Rational.divideUnsafe(Rational.multiply(mixture.X, amounts.luminance), mixture.Y),
          Y: amounts.luminance,
          Z: Rational.divideUnsafe(Rational.multiply(mixture.Z, amounts.luminance), mixture.Y),
        }),
      );
    }),
  );

/** Every medium of the library, on the white its standard writes, by name: the media `inMedia` and `writeMedia` evaluate by default, and the names `byMedium` takes. */
export const media = { srgb, displayP3, rec2020, rec2100Pq, rec2100Hlg } as const;

/** The name of a medium of the library in `media`. */
export type MediumName = keyof typeof media;

/** A definition with exceptions for some media, each another definition, keyed by the names of `media`, a name it does not know refused by the compiler. An exception applies to its medium on either white, as it is matched by the color space; every other medium follows the definition. The failures of the result are those of the definition and of every exception. */
export function byMedium<
  E,
  Exceptions extends { readonly [Name in MediumName]?: Definition<unknown> },
>(
  definition: Definition<E>,
  exceptions: Exceptions & { readonly [Name in Exclude<keyof Exceptions, MediumName>]: never },
): Definition<
  | E
  | {
      readonly [Name in keyof Exceptions]: Exceptions[Name] extends Definition<infer F> ? F : never;
    }[keyof Exceptions]
>;
export function byMedium(
  definition: Definition<unknown>,
  exceptions: { readonly [Name in MediumName]?: Definition<unknown> },
): Definition<unknown> {
  return {
    rule: (medium) =>
      Option.getOrElse(
        Option.map(
          Option.flatMapNullishOr(
            Array.findFirst(
              Record.keys(media),
              (name) => media[name].colorSpace === medium.colorSpace,
            ),
            (name) => exceptions[name],
          ),
          (exception) => exception.rule(medium),
        ),
        () => definition.rule(medium),
      ),
  };
}

/** The color of a definition in one medium, not written, for further computation such as contrast; or the failure of the definition there. */
export const inMedium = <E, M extends Medium>(
  definition: Definition<E>,
  medium: M,
): Exit.Exit<InGamut<M>, E> => definition.rule(medium);

/** The failure of a definition in a medium, naming the medium it arose in and holding the failure of the definition. */
export class FailedInMedium<E, Name extends string = MediumName> extends Data.TaggedError(
  'FailedInMedium',
)<{
  /** The name of the medium the definition failed in. */
  readonly medium: Name;
  /** The failure of the definition in that medium. */
  readonly error: E;
  /** The name of the medium followed by the reason of the failure. */
  readonly message: string;
}> {}

/** The colors of a definition in every medium of a record, `media` by default, keyed as the record is, so that a project on the exact white keeps the names; or a failure for every medium the definition fails in, each a `FailedInMedium` naming it, in the order of the record. A defect of a rule passes through unnamed. */
export function inMedia<E>(
  definition: Definition<E>,
): Exit.Exit<{ readonly [Name in MediumName]: InGamut<(typeof media)[Name]> }, FailedInMedium<E>>;
export function inMedia<E, Selected extends { readonly [name: string]: Medium }>(
  definition: Definition<E>,
  selected: Selected,
): Exit.Exit<
  { readonly [Name in keyof Selected]: InGamut<Selected[Name]> },
  FailedInMedium<E, keyof Selected & string>
>;
export function inMedia<E>(
  definition: Definition<E>,
  selected: { readonly [name: string]: Medium } = media,
): Exit.Exit<{ readonly [name: string]: Tristimulus }, FailedInMedium<E, string>> {
  const evaluated = Record.map(selected, (medium) => definition.rule(medium));
  const failures = Record.keys(evaluated).flatMap((name) => {
    const exit = evaluated[name];
    return exit !== undefined && Exit.isFailure(exit)
      ? [
          Cause.map(
            exit.cause,
            (error) =>
              new FailedInMedium({
                medium: name,
                error,
                message: `In ${name}: ${Predicate.isString(error) ? error : Predicate.hasProperty(error, 'message') && Predicate.isString(error.message) ? error.message : 'the definition failed'}`,
              }),
          ),
        ]
      : [];
  });
  return Array.isArrayNonEmpty(failures)
    ? Exit.failCause(failures.reduce((all, cause) => Cause.combine(all, cause)))
    : Exit.succeed(Record.getSomes(Record.map(evaluated, Exit.getSuccess)));
}

/** A definition written in every medium of a record, `media` by default, keyed as the record is; or a failure for every medium it fails in, as `inMedia` gives it. */
export function writeMedia<E>(
  definition: Definition<E>,
): Exit.Exit<{ readonly [Name in MediumName]: string }, FailedInMedium<E>>;
export function writeMedia<E, Selected extends { readonly [name: string]: Medium }>(
  definition: Definition<E>,
  selected: Selected,
): Exit.Exit<
  { readonly [Name in keyof Selected]: string },
  FailedInMedium<E, keyof Selected & string>
>;
export function writeMedia<E>(
  definition: Definition<E>,
  selected: { readonly [name: string]: Medium } = media,
): Exit.Exit<{ readonly [name: string]: string }, FailedInMedium<E, string>> {
  return Exit.map(inMedia(definition, selected), (colors) =>
    // Each color lies in the gamut of the medium of its name, as `inMedia` gives it.
    Record.intersection(selected, colors, (medium, color) => written(medium, color)),
  );
}
