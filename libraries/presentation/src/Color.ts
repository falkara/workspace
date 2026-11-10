import {
  Array,
  BigDecimal,
  Effect,
  Exit,
  Function,
  Option,
  Rational,
  Schema,
  SchemaIssue,
  SchemaTransformation,
  Struct,
} from 'effect';

import * as Colorimetry from '#src/Colorimetry';
import * as Length from '#src/Length';
import * as Real from '#src/Real';
import * as Typography from '#src/Typography';

/**
 * The contrast ratio that WCAG 2.2 Contrast (Enhanced) requires for text.
 *
 * @see https://www.w3.org/TR/WCAG22/#contrast-enhanced
 */
export const enhancedContrastRatio = Rational.fromBigInt(7n);

/**
 * The contrast ratio that WCAG 2.2 Contrast (Enhanced) requires for large-scale text.
 *
 * @see https://www.w3.org/TR/WCAG22/#contrast-enhanced
 */
export const largeTextEnhancedContrastRatio = Rational.makeUnsafe(9n, 2n);

/**
 * The font size from which WCAG 2.2 counts text as large-scale. Measured in CSS points.
 *
 * @see https://www.w3.org/TR/WCAG22/#dfn-large-scale
 */
export const largeTextPointSize = Rational.fromBigInt(18n);

/**
 * The font size from which WCAG 2.2 counts bold text as large-scale. Measured in CSS points.
 *
 * @see https://www.w3.org/TR/WCAG22/#dfn-large-scale
 */
export const largeBoldTextPointSize = Rational.fromBigInt(14n);

/** The font size from which text is large-scale, the large text point size in CSS points. Measured in CSS pixels. */
export const largeTextSize = Rational.multiply(largeTextPointSize, Length.point);

/** The font size from which bold text is large-scale, the large bold text point size in CSS points. Measured in CSS pixels. */
export const largeBoldTextSize = Rational.multiply(largeBoldTextPointSize, Length.point);

/**
 * The number of steps between the darkest and the lightest level of an 8-bit sRGB channel.
 *
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#hex-notation
 */
export const channelSteps = 255;

/** The distance a gamma-encoded sRGB channel may lie outside its range and still count as inside, half a step of an 8-bit channel, which rounding it to the 8 bits of a hex color takes back to the edge of its range, so that a color read from hex and written in oklch() with a few decimal places is not refused for leaving sRGB by less than its hex form can tell, nor a color on its edge, such as white, whose red channel the matrices of CSS Color 4 put a little above 1. */
export const gamutTolerance = Rational.makeUnsafe(1n, BigInt(2 * channelSteps));

/**
 * The matrix from Oklab to the cube roots of the LMS cone responses that CSS Color 4 converts through, each entry the decimal it writes, taken exactly.
 *
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#color-conversion-code
 */
export const oklabToLms: Colorimetry.Matrix<'Oklab', 'cube roots of LMS'> = [
  [
    Rational.fromBigInt(1n),
    Rational.makeUnsafe(3963377773761749n, 10n ** 16n),
    Rational.makeUnsafe(2158037573099136n, 10n ** 16n),
  ],
  [
    Rational.fromBigInt(1n),
    Rational.makeUnsafe(-1055613458156586n, 10n ** 16n),
    Rational.makeUnsafe(-638541728258133n, 10n ** 16n),
  ],
  [
    Rational.fromBigInt(1n),
    Rational.makeUnsafe(-894841775298119n, 10n ** 16n),
    Rational.makeUnsafe(-12914855480194092n, 10n ** 16n),
  ],
];

/**
 * The matrix from LMS cone responses to CIE XYZ with the D65 white point that CSS Color 4 converts through, each entry the decimal it writes, taken exactly.
 *
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#color-conversion-code
 */
export const lmsToXyz: Colorimetry.Matrix<'LMS', 'XYZ'> = [
  [
    Rational.makeUnsafe(12268798758459243n, 10n ** 16n),
    Rational.makeUnsafe(-5578149944602171n, 10n ** 16n),
    Rational.makeUnsafe(2813910456659647n, 10n ** 16n),
  ],
  [
    Rational.makeUnsafe(-405757452148008n, 10n ** 16n),
    Rational.makeUnsafe(1112286803280317n, 10n ** 15n),
    Rational.makeUnsafe(-717110580655164n, 10n ** 16n),
  ],
  [
    Rational.makeUnsafe(-763729366746601n, 10n ** 16n),
    Rational.makeUnsafe(-4214933324022432n, 10n ** 16n),
    Rational.makeUnsafe(15869240198367816n, 10n ** 16n),
  ],
];

/**
 * The chroma that CSS Color 4 sets as 100 % in oklch().
 *
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#specifying-oklab-oklch
 */
export const fullChroma = Rational.makeUnsafe(2n, 5n);

/**
 * The weights of the linear sRGB channels in relative luminance as WCAG 2.2 gives it for sRGB.
 *
 * @see https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 */
export const luminanceWeights: readonly [Rational.Rational, Rational.Rational, Rational.Rational] =
  [
    Rational.makeUnsafe(2126n, 10000n),
    Rational.makeUnsafe(7152n, 10000n),
    Rational.makeUnsafe(722n, 10000n),
  ];

/**
 * The flare WCAG 2.2 adds to both relative luminances of a contrast ratio.
 *
 * @see https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
 */
export const contrastFlare = Rational.makeUnsafe(1n, 20n);

/** The largest contrast ratio WCAG 2.2 defines, of black against white: the largest relative luminance, 1, over the smallest, 0, with the flare added to both. */
export const maximumContrastRatio = Rational.divideUnsafe(
  Rational.sum(Rational.fromBigInt(1n), contrastFlare),
  contrastFlare,
);

/**
 * The half turn in each unit of angle CSS Values 4 defines but the radian, whose half turn, π, is irrational, so that a hue in these units is reduced to one turn exactly.
 *
 * @see https://www.w3.org/TR/2024/WD-css-values-4-20240312/#angles
 */
export const halfTurns: {
  readonly deg: Rational.Rational;
  readonly grad: Rational.Rational;
  readonly turn: Rational.Rational;
} = {
  deg: Rational.fromBigInt(180n),
  grad: Rational.fromBigInt(200n),
  turn: Rational.makeUnsafe(1n, 2n),
};

/**
 * The gamma-encoded sRGB value up to which the sRGB transfer function reads a channel as linear.
 *
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#color-conversion-code
 */
export const encodedTransferThreshold = Rational.makeUnsafe(4045n, 100000n);

/** A step of the deepest channel the library judges colors in, as a gamma-encoded sRGB value: the smallest change of a channel that any display or tool it judges colors on can show. */
const deepestChannelStep = Rational.makeUnsafe(
  1n,
  (1n << BigInt(Colorimetry.deepestChannelBits)) - 1n,
);

/**
 * The smallest change of a linear sRGB channel that a step of the deepest channel makes: a step where the transfer function is linear, where it reads a step as the least linear change, as it grows steeper above.
 *
 * The cosine and the sine of a hue make the channels of a color written in oklch() numbers that the library cannot prove rational or irrational, so a decision on them may never settle where it falls exactly on its edge. Every such decision therefore follows one rule, a rule rather than a proof: a number closer to the edge than this smallest change, carried to what is decided, counts as lying on it, within sRGB or meeting the contrast, as WCAG 2.2 asks for a contrast of at least the ratio. The rule holds for every color written in oklch(), whatever is known of its numbers, so that two colors no display can tell apart are judged alike.
 */
const indistinguishableChannel = Rational.divideUnsafe(
  deepestChannelStep,
  Colorimetry.srgbTransfer.slope,
);

/** The smallest change of relative luminance that a step of the deepest channel makes: the smallest change of a linear channel, through the lightest weight, that of blue. */
const indistinguishableLuminance = Rational.multiply(luminanceWeights[2], indistinguishableChannel);

/** The smallest change of contrast that a step of the deepest channel makes: the smallest change of relative luminance over the largest relative luminance with the flare, 1 + 1/20, as changing either luminance of a pair changes its contrast by at least the change over that. */
const indistinguishableContrast = Rational.divideUnsafe(
  indistinguishableLuminance,
  Rational.sum(Rational.fromBigInt(1n), contrastFlare),
);

/** Three real numbers in a space, such as the components or the channels of a color, the space a phantom parameter as for a vector of `Colorimetry`. */
type Vector<Space extends string> = readonly [Real.Real, Real.Real, Real.Real] & {
  readonly '~space'?: Space;
};

/** The linear channels of a color in sRGB on the white its standard writes, in which WCAG 2.2 gives relative luminance. */
type LinearSrgb = Vector<Colorimetry.LinearSpace<'srgb', 'standard'>>;

/** The product of a matrix and a vector of real numbers of the space it converts from. */
const transform = <From extends string, To extends string>(
  [first, second, third]: Colorimetry.Matrix<From, To>,
  [x, y, z]: Vector<NoInfer<From>>,
): Vector<To> => {
  const row = (entries: Colorimetry.Matrix<From, To>[number]): Real.Real =>
    Real.add(
      Real.add(
        Real.multiply(Real.fromRational(entries[0]), x),
        Real.multiply(Real.fromRational(entries[1]), y),
      ),
      Real.multiply(Real.fromRational(entries[2]), z),
    );
  return [row(first), row(second), row(third)];
};

/** The units of angle a hue is written in. */
type HueUnit = 'deg' | 'grad' | 'rad' | 'turn';

/** The cosine and the sine of a hue in its unit of angle: reduced to one turn exactly and turned into radians, or taken as it is when it is already in radians, as the cosine and the sine reduce any angle themselves. */
const cosineSineOf = (
  hue: Rational.Rational,
  hueUnit: HueUnit,
): readonly [Real.Real, Real.Real] => {
  if (hueUnit === 'rad') {
    return Real.cosineSine(Real.fromRational(hue));
  }
  // A half turn is positive, so the division cannot fail.
  const halves = Rational.divideUnsafe(hue, halfTurns[hueUnit]);
  // The whole turns, the floor of the half turns over 2, toward −∞ whatever the sign.
  const turns =
    halves.numerator / (2n * halves.denominator) -
    (halves.numerator % (2n * halves.denominator) < 0n ? 1n : 0n);
  return Real.cosineSine(
    Real.multiply(
      Real.pi,
      Real.fromRational(Rational.subtract(halves, Rational.fromBigInt(2n * turns))),
    ),
  );
};

/** The linear sRGB channels of a color of the given lightness and chroma at a hue given by its cosine and sine, converted as CSS Color 4 converts it. */
const linearSrgbOf = (
  lightness: Rational.Rational,
  chroma: Rational.Rational,
  [cosine, sine]: readonly [Real.Real, Real.Real],
): LinearSrgb => {
  const [long, medium, short] = transform(oklabToLms, [
    Real.fromRational(lightness),
    Real.multiply(Real.fromRational(chroma), cosine),
    Real.multiply(Real.fromRational(chroma), sine),
  ]);
  return transform(
    Colorimetry.srgb.xyzToLinear,
    transform(lmsToXyz, [
      Real.multiply(long, Real.square(long)),
      Real.multiply(medium, Real.square(medium)),
      Real.multiply(short, Real.square(short)),
    ]),
  );
};

/** Whether linear sRGB channels lie within sRGB once encoded, up to a tolerance of an encoded value: from the tolerance below 0, read back on the linear segment of the transfer function, as the tolerance lies far within it, to the tolerance above 1, read back on its power, each decided by the rule of `indistinguishableChannel`. */
const isInGamut = (channels: LinearSrgb, tolerance: Rational.Rational): boolean => {
  // The slope and the offset added to 1 are positive, so neither division can fail.
  const lowest = Real.fromRational(
    Rational.negate(Rational.divideUnsafe(tolerance, Colorimetry.srgbTransfer.slope)),
  );
  const highest = Real.power(
    Real.fromRational(
      Rational.divideUnsafe(
        Rational.sumAll([Rational.fromBigInt(1n), tolerance, Colorimetry.srgbTransfer.offset]),
        Rational.sum(Rational.fromBigInt(1n), Colorimetry.srgbTransfer.offset),
      ),
    ),
    Colorimetry.srgbTransfer.exponent,
  );
  return channels.every(
    (channel) =>
      Real.sign(Real.subtract(channel, lowest), indistinguishableChannel) >= 0 &&
      Real.sign(Real.subtract(highest, channel), indistinguishableChannel) >= 0,
  );
};

/** The relative luminance of linear sRGB channels as WCAG 2.2 gives it for sRGB, each weighted and held within its range. */
const luminanceOf = (channels: LinearSrgb): Real.Real =>
  channels
    .map((channel, index) =>
      Real.multiply(
        // Three weights for three channels.
        Real.fromRational(luminanceWeights[index] ?? Rational.fromBigInt(0n)),
        Real.minimum(
          Real.maximum(channel, Real.fromRational(Rational.fromBigInt(0n))),
          Real.fromRational(Rational.fromBigInt(1n)),
        ),
      ),
    )
    .reduce(Real.add);

/** The contrast ratio of two relative luminances as WCAG 2.2 defines it, the lighter over the darker with the flare added to both; the darker with the flare is at least the flare, so the quotient is always found. */
const contrastOf = (first: Real.Real, second: Real.Real): Real.Real =>
  Real.divide(
    Real.add(Real.maximum(first, second), Real.fromRational(contrastFlare)),
    Real.add(Real.minimum(first, second), Real.fromRational(contrastFlare)),
  );

/** Whether a contrast ratio is at least the given one, decided by the rule of `indistinguishableChannel`. */
const meets = (contrast: Real.Real, ratio: Rational.Rational): boolean =>
  Real.sign(Real.subtract(contrast, Real.fromRational(ratio)), indistinguishableContrast) >= 0;

/** The relative luminance of a color as WCAG 2.2 gives it for sRGB. */
const relativeLuminance = (color: Color): Real.Real =>
  luminanceOf(linearSrgbOf(color.lightness, color.chroma, cosineSineOf(color.hue, color.hueUnit)));

/** The relative luminance of linear sRGB channels once each is rounded to a whole number of steps and read back, as a display or a tool that holds channels in whole steps shows and measures it: a rational part, from the channels read back on the linear segment of the transfer function, and the terms c · b^(12/5) of those read back on its power, each a weight and the base its step is raised from, so that it can be compared exactly. */
interface RoundedLuminance {
  readonly rational: Rational.Rational;
  readonly powers: ReadonlyArray<readonly [Rational.Rational, Rational.Rational]>;
}

/** The relative luminances of linear sRGB channels once each is held within its range, encoded, rounded to the nearest of a number of steps and read back: one for each step a channel rounds to once its encoded value is moved by each of the given shifts, so that every rounding a display or a tool may make within them is judged. A channel is rounded to the nearest step, a channel exactly halfway toward +∞, as CSS Color 4 rounds, by the rule of `indistinguishableChannel` carried to an encoded value, a step of the deepest channel. */
const roundedLuminancesOf = (
  channels: LinearSrgb,
  steps: bigint,
  shifts: Array.NonEmptyReadonlyArray<Rational.Rational>,
): Array.NonEmptyReadonlyArray<RoundedLuminance> =>
  channels.reduce<Array.NonEmptyReadonlyArray<RoundedLuminance>>(
    (luminances, channel, index) => {
      // Three weights for three channels.
      const weight = luminanceWeights[index] ?? Rational.fromBigInt(0n);
      const held = Real.minimum(
        Real.maximum(channel, Real.fromRational(Rational.fromBigInt(0n))),
        Real.fromRational(Rational.fromBigInt(1n)),
      );
      const encoded =
        Real.sign(
          Real.subtract(Real.fromRational(Colorimetry.srgbTransfer.linearThreshold), held),
          indistinguishableChannel,
        ) >= 0
          ? Real.multiply(Real.fromRational(Colorimetry.srgbTransfer.slope), held)
          : Real.subtract(
              Real.multiply(
                Real.fromRational(
                  Rational.sum(Rational.fromBigInt(1n), Colorimetry.srgbTransfer.offset),
                ),
                // The exponent is positive, so its reciprocal is defined.
                Real.power(
                  held,
                  Rational.divideUnsafe(Rational.fromBigInt(1n), Colorimetry.srgbTransfer.exponent),
                ),
              ),
              Real.fromRational(Colorimetry.srgbTransfer.offset),
            );
      const counts = Array.dedupe(
        Array.map(shifts, (shift) =>
          Real.round(
            Real.add(encoded, Real.fromRational(shift)),
            Rational.makeUnsafe(1n, steps),
            deepestChannelStep,
          ),
        ),
      );
      return Array.flatMap(luminances, (luminance) =>
        Array.map(counts, (count): RoundedLuminance => {
          const step = Rational.makeUnsafe(count, steps);
          // The slope and the offset added to 1 are positive, so neither division can fail.
          return Rational.isLessThanOrEqualTo(step, encodedTransferThreshold)
            ? {
                rational: Rational.sum(
                  luminance.rational,
                  Rational.multiply(
                    weight,
                    Rational.divideUnsafe(step, Colorimetry.srgbTransfer.slope),
                  ),
                ),
                powers: luminance.powers,
              }
            : {
                rational: luminance.rational,
                powers: [
                  ...luminance.powers,
                  [
                    weight,
                    Rational.divideUnsafe(
                      Rational.sum(step, Colorimetry.srgbTransfer.offset),
                      Rational.sum(Rational.fromBigInt(1n), Colorimetry.srgbTransfer.offset),
                    ),
                  ],
                ],
              };
        }),
      );
    },
    [{ rational: Rational.fromBigInt(0n), powers: [] }],
  );

/** A rounded relative luminance as a real number. */
const roundedLuminanceValue = (luminance: RoundedLuminance): Real.Real =>
  luminance.powers.reduce(
    (sum, [coefficient, base]) =>
      Real.add(
        sum,
        Real.multiply(
          Real.fromRational(coefficient),
          Real.power(Real.fromRational(base), Colorimetry.srgbTransfer.exponent),
        ),
      ),
    Real.fromRational(luminance.rational),
  );

/**
 * The sign of a rational number plus a sum of terms c · b^(12/5), with c rational and b a positive rational, decided exactly. By Besicovitch's theorem, the fifth roots of positive rational numbers no two of which differ by the fifth power of a rational factor are linearly independent over the rationals, together with 1, so such a sum is 0 only when the coefficients of each are. Each b^(12/5) is b² times the fifth root of b², so the terms whose bases differ by a factor q^5, whose powers then differ by the factor q^12, are gathered into one, and those whose base is itself the fifth power of q^5 are the rational q^12; the sum is 0 exactly when the rational part and every gathered coefficient are. When it is not, its bounds settle its sign in the end.
 *
 * @see https://doi.org/10.1112/jlms/s1-15.1.3
 */
const exactSign = (luminance: RoundedLuminance): -1 | 0 | 1 => {
  const gathered = luminance.powers.reduce<RoundedLuminance>(
    (sum, [coefficient, base]) => {
      const own = Real.root(Real.fromRational(base), 5).rational;
      const index = sum.powers.findIndex(
        ([, representative]) =>
          // Every base is positive, so the division cannot fail.
          Real.root(Real.fromRational(Rational.divideUnsafe(base, representative)), 5).rational !==
          undefined,
      );
      const factor =
        index === -1
          ? undefined
          : Real.root(
              Real.fromRational(
                Rational.divideUnsafe(base, sum.powers[index]?.[1] ?? Rational.fromBigInt(1n)),
              ),
              5,
            ).rational;
      return own !== undefined
        ? {
            rational: Rational.sum(
              sum.rational,
              Rational.multiply(
                coefficient,
                Rational.makeUnsafe(own.numerator ** 12n, own.denominator ** 12n),
              ),
            ),
            powers: sum.powers,
          }
        : factor === undefined
          ? { rational: sum.rational, powers: [...sum.powers, [coefficient, base]] }
          : {
              rational: sum.rational,
              powers: sum.powers.map(([gatheredCoefficient, representative], other) =>
                other === index
                  ? [
                      Rational.sum(
                        gatheredCoefficient,
                        Rational.multiply(
                          coefficient,
                          Rational.makeUnsafe(factor.numerator ** 12n, factor.denominator ** 12n),
                        ),
                      ),
                      representative,
                    ]
                  : [gatheredCoefficient, representative],
              ),
            };
    },
    { rational: luminance.rational, powers: [] },
  );
  return Rational.isZero(gathered.rational) &&
    gathered.powers.every(([coefficient]) => Rational.isZero(coefficient))
    ? 0
    : // Not 0, so its bounds exclude 0 in the end.
      Real.sign(roundedLuminanceValue(gathered), Rational.fromBigInt(0n));
};

/** Whether colors of rounded relative luminances have a contrast ratio of at least the given one, decided exactly: the lighter with the flare is at least the ratio times the darker with the flare, which, as the ratio is at least 1, holds for one of the two orders exactly when the contrast reaches it. */
const meetsRounded = (
  text: RoundedLuminance,
  background: RoundedLuminance,
  ratio: Rational.Rational,
): boolean =>
  [
    [text, background],
    [background, text],
  ].some(
    ([lighter, darker]) =>
      lighter !== undefined &&
      darker !== undefined &&
      exactSign({
        rational: Rational.sumAll([
          lighter.rational,
          contrastFlare,
          Rational.negate(Rational.multiply(ratio, Rational.sum(darker.rational, contrastFlare))),
        ]),
        powers: [
          ...lighter.powers,
          ...darker.powers.map(
            ([coefficient, base]) =>
              [Rational.negate(Rational.multiply(ratio, coefficient)), base] as const,
          ),
        ],
      }) >= 0,
  );

/** A schema of a number CSS writes in decimal: a rational number whose decimal expansion ends, so that a color is written exactly as it is read. */
const Decimal = Schema.Rational.pipe(
  Schema.check(
    Schema.makeFilter(
      (value) =>
        Rational.isInteger(
          Rational.multiply(
            value,
            Rational.fromBigInt(10n ** BigInt(Real.exactDecimalPlaces(value))),
          ),
        ) || 'Expected a number whose decimal expansion ends, as CSS writes numbers in decimal',
    ),
  ),
);

/** A schema of the components of an oklch() color as CSS Color 4 defines them, opaque and within sRGB, the color space whose relative luminance WCAG 2.2 gives and in which it asks authors to evaluate contrast. */
const Components = Schema.Struct({
  /** The lightness, from 0 for black to 1 for white. */
  lightness: Decimal,
  /** The chroma, 0 for a gray. */
  chroma: Decimal,
  /** The hue. Measured in its unit of angle. */
  hue: Decimal,
  /** The unit of angle the hue is written in, degrees when it is written as a number. */
  hueUnit: Schema.Literals(['deg', 'grad', 'rad', 'turn']),
  /** The alpha, from 0 for transparent to 1 for opaque. */
  alpha: Decimal,
}).pipe(
  Schema.check(
    Schema.makeFilter(
      (color) =>
        Rational.isGreaterThanOrEqualTo(color.alpha, Rational.fromBigInt(1n)) ||
        'Expected an opaque color, as WCAG 2.2 defines no contrast for a translucent one',
    ),
    Schema.makeFilter(
      (color) =>
        isInGamut(
          linearSrgbOf(color.lightness, color.chroma, cosineSineOf(color.hue, color.hueUnit)),
          gamutTolerance,
        ) ||
        'Expected a color within sRGB, the color space whose relative luminance WCAG 2.2 gives and in which it asks authors to evaluate contrast unless another is known to be used',
    ),
  ),
);

/** A schema of a color written in oklch() as CSS Color 4 writes it, its function named in any case, each component a number, a percentage or none, the hue a number or an angle in any unit, apart from math functions and relative colors, which name no value until a browser computes them. Decoded once into its lightness, chroma, hue and alpha, each number read exactly as the decimal it is written as, none read as 0 and each component clamped to its range as CSS Color 4 clamps it, and checked to be opaque and within sRGB, where WCAG 2.2 defines contrast. Encoded with each number written exactly in decimal, which it decodes again into the same components. */
export const Color = Schema.String.pipe(
  Schema.decodeTo(
    Components,
    SchemaTransformation.transformEffect({
      decode: (color, options) => {
        // A number as CSS Syntax reads it, a sign, a whole or a decimal part, and an exponent each optional, and whitespace as CSS Syntax counts it.
        const match =
          /^oklch\([\t\n\f\r ]*(?:([+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?)(%)?|none)[\t\n\f\r ]+(?:([+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?)(%)?|none)[\t\n\f\r ]+(?:([+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?)(deg|grad|rad|turn)?|none)[\t\n\f\r ]*(?:(\/)[\t\n\f\r ]*(?:([+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?)(%)?|none)[\t\n\f\r ]*)?\)$/i.exec(
            color,
          );
        if (match === null) {
          return Effect.fail(
            new SchemaIssue.InvalidValue(
              {
                message:
                  'Expected a color written in oklch() as CSS Color 4 writes it, such as oklch(64% 0.17 147), with no math function or relative color',
              },
              color,
              options,
            ),
          );
        }
        const [, , lightnessPercent, , chromaPercent, , hueUnit, slash, , alphaPercent] = match;
        // Each number read exactly as the decimal it is written as, or none when its exponent lies beyond the range BigDecimal reads exactly.
        const numbers = Option.all(
          [match[1], match[3], match[5], match[8]].map((written) =>
            written === undefined
              ? Option.some(undefined)
              : Option.map(BigDecimal.fromString(written), Rational.fromBigDecimal),
          ),
        );
        if (Option.isNone(numbers)) {
          return Effect.fail(
            new SchemaIssue.InvalidValue(
              {
                message:
                  'Expected each number within the range BigDecimal reads exactly, an exponent of at most 10000 either way',
              },
              color,
              options,
            ),
          );
        }
        const [lightness, chroma, hue, alpha] = numbers.value;
        return Effect.succeed({
          lightness:
            lightness === undefined
              ? Rational.fromBigInt(0n)
              : Rational.min(
                  Rational.max(
                    lightnessPercent === '%'
                      ? Rational.divideUnsafe(lightness, Rational.fromBigInt(100n))
                      : lightness,
                    Rational.fromBigInt(0n),
                  ),
                  Rational.fromBigInt(1n),
                ),
          chroma:
            chroma === undefined
              ? Rational.fromBigInt(0n)
              : Rational.max(
                  chromaPercent === '%'
                    ? Rational.divideUnsafe(
                        Rational.multiply(chroma, fullChroma),
                        Rational.fromBigInt(100n),
                      )
                    : chroma,
                  Rational.fromBigInt(0n),
                ),
          hue: hue ?? Rational.fromBigInt(0n),
          hueUnit:
            hueUnit?.toLowerCase() === 'grad'
              ? 'grad'
              : hueUnit?.toLowerCase() === 'rad'
                ? 'rad'
                : hueUnit?.toLowerCase() === 'turn'
                  ? 'turn'
                  : 'deg',
          alpha:
            slash === undefined
              ? Rational.fromBigInt(1n)
              : alpha === undefined
                ? Rational.fromBigInt(0n)
                : Rational.min(
                    Rational.max(
                      alphaPercent === '%'
                        ? Rational.divideUnsafe(alpha, Rational.fromBigInt(100n))
                        : alpha,
                      Rational.fromBigInt(0n),
                    ),
                    Rational.fromBigInt(1n),
                  ),
        });
      },
      encode: (color) =>
        Effect.succeed(
          `oklch(${Real.writeDecimals(color.lightness, Real.exactDecimalPlaces(color.lightness))} ${Real.writeDecimals(color.chroma, Real.exactDecimalPlaces(color.chroma))} ${Real.writeDecimals(color.hue, Real.exactDecimalPlaces(color.hue))}${color.hueUnit === 'deg' ? '' : color.hueUnit} / ${Real.writeDecimals(color.alpha, Real.exactDecimalPlaces(color.alpha))})`,
        ),
    }),
  ),
);

/** A color with its lightness, chroma, hue in its unit of angle and alpha, opaque and within sRGB. */
export type Color = typeof Color.Type;

/** A schema of the number of bits each sRGB channel is held in by a display or a tool that colors are judged on, from 1 to the deepest channel the library judges colors in. */
const ChannelBits = Schema.Int.pipe(
  Schema.check(
    Schema.isBetween(
      { minimum: 1, maximum: Colorimetry.deepestChannelBits },
      {
        message: `Expected from 1 to ${Colorimetry.deepestChannelBits} bits per channel, as displays and image formats hold them`,
      },
    ),
  ),
);

/** A schema of the colors of a piece of text and its background, and the bits per channel of a display or a tool they are judged on, which rounds each channel to its steps; the exact colors are judged when none is given. */
export const Colors = Schema.Struct({
  /** The color of the text. */
  text: Color,
  /** The color of the background. */
  background: Color,
  /** The bits per sRGB channel of a display or a tool the colors are judged on, such as 8 for a color written in hex. */
  channelBits: Schema.optional(ChannelBits),
});

/** The colors of a piece of text and its background, and the bits per channel they are judged on, as they are written. */
export type Colors = typeof Colors.Encoded;

/** The contrast ratio of text over its background as WCAG 2.2 defines it, the number JavaScript holds nearest to the exact contrast of the colors as the matrices of CSS Color 4 convert them, or a failure naming the color that is not opaque or not within sRGB. By those matrices white has a relative luminance a little below 1, so black against white gives 20.999999999999993, the number nearest to its exact contrast. Whether it meets a ratio is decided by `reaches` or `verify`, on the exact contrast rather than on this number. */
export const contrast = (text: string, background: string): Exit.Exit<number, Schema.SchemaError> =>
  Exit.map(Schema.decodeExit(Colors)({ text, background }, { errors: 'all' }), (colors) =>
    Real.nearestNumber(
      contrastOf(relativeLuminance(colors.text), relativeLuminance(colors.background)),
    ),
  );

/** A schema of the colors of a piece of text and its background, the bits per channel they are judged on, and a contrast ratio from 1:1 to the largest WCAG 2.2 defines that they are to reach. */
const Threshold = Schema.Struct({
  ...Colors.fields,
  /** The contrast ratio the colors are to reach. */
  ratio: Schema.Rational.pipe(
    Schema.check(
      Schema.makeIsBetween({ order: Rational.Order, formatter: Rational.format })(
        { minimum: Rational.fromBigInt(1n), maximum: maximumContrastRatio },
        {
          message: `Expected a contrast ratio from 1:1 to ${Real.writeDecimals(maximumContrastRatio, Colorimetry.decimalPlaces)}:1, the range of the contrast WCAG 2.2 defines`,
        },
      ),
    ),
  ),
});

/** Whether text over its background reaches a contrast ratio as WCAG 2.2 defines it, decided as `verify` decides it: on the exact colors, by the rule of `indistinguishableChannel`, so that colors no display can tell from colors that meet the ratio meet it too; or a failure with the reason when a color or the ratio is not valid. With bits per channel, the colors are judged as a display or a tool holding channels in that many bits shows and measures them, each channel rounded to the nearest step, and their contrast is decided exactly. */
export const reaches: {
  (ratio: Rational.Rational): (colors: Colors) => Exit.Exit<boolean, Schema.SchemaError>;
  (colors: Colors, ratio: Rational.Rational): Exit.Exit<boolean, Schema.SchemaError>;
} = Function.dual(
  2,
  (colors: Colors, ratio: Rational.Rational): Exit.Exit<boolean, Schema.SchemaError> =>
    Exit.map(Schema.decodeExit(Threshold)({ ...colors, ratio }, { errors: 'all' }), (threshold) =>
      threshold.channelBits === undefined
        ? meets(
            contrastOf(relativeLuminance(threshold.text), relativeLuminance(threshold.background)),
            threshold.ratio,
          )
        : meetsRounded(
            Array.headNonEmpty(
              roundedLuminancesOf(
                linearSrgbOf(
                  threshold.text.lightness,
                  threshold.text.chroma,
                  cosineSineOf(threshold.text.hue, threshold.text.hueUnit),
                ),
                (1n << BigInt(threshold.channelBits)) - 1n,
                [Rational.fromBigInt(0n)],
              ),
            ),
            Array.headNonEmpty(
              roundedLuminancesOf(
                linearSrgbOf(
                  threshold.background.lightness,
                  threshold.background.chroma,
                  cosineSineOf(threshold.background.hue, threshold.background.hueUnit),
                ),
                (1n << BigInt(threshold.channelBits)) - 1n,
                [Rational.fromBigInt(0n)],
              ),
            ),
            threshold.ratio,
          ),
    ),
);

/** A schema of the step of the type scale a piece of text is set in, without its position, which the contrast never reads. The check of the step is kept, as it reads the sizes alone: the step never shrinks, so that its size at the minimum viewport width is its smallest, the size the contrast it needs rests on. */
const TextStep = Typography.Step.mapFields(Struct.omit(['position']), {
  unsafePreserveChecks: true,
});

/** The contrast ratio a piece of text needs as WCAG 2.2 Contrast (Enhanced) sets it, from its size at the minimum viewport width, its smallest, and its font weight, counted as bold from the weight CSS Fonts gives the bold keyword, as WCAG 2.2 counts 14 point bold text as large-scale without saying which weight is bold. */
const requiredContrast = (step: typeof TextStep.Type, fontWeight: number): Rational.Rational =>
  Rational.isGreaterThanOrEqualTo(step.minimumSize, largeTextSize) ||
  (fontWeight >= Typography.boldFontWeight &&
    Rational.isGreaterThanOrEqualTo(step.minimumSize, largeBoldTextSize))
    ? largeTextEnhancedContrastRatio
    : enhancedContrastRatio;

/** A schema of a font weight, from the lightest to the heaviest that CSS Fonts allows. */
const FontWeight = Schema.Finite.pipe(
  Schema.check(
    Schema.isBetween(
      { minimum: Typography.minimumFontWeight, maximum: Typography.maximumFontWeight },
      {
        message: `Expected a font weight from ${Typography.minimumFontWeight} to ${Typography.maximumFontWeight}, as CSS Fonts allows`,
      },
    ),
  ),
);

/** A schema of a contrast ratio stricter than the standards that a project may ask for, at most the largest contrast WCAG 2.2 defines, which some colors can reach. */
const MinimumContrast = Schema.Rational.pipe(
  Schema.check(
    Schema.makeIsLessThanOrEqualTo({ order: Rational.Order, formatter: Rational.format })(
      maximumContrastRatio,
      {
        message: `Expected a minimum contrast of at most ${Real.writeDecimals(maximumContrastRatio, Colorimetry.decimalPlaces)}:1, the largest contrast WCAG 2.2 defines, of black against white`,
      },
    ),
  ),
);

/** A check that the contrast ratio a project asks for is at least the one WCAG 2.2 Contrast (Enhanced) requires for its text, so that a project can only be stricter than the standards. */
const isAtLeastRequiredContrast = Schema.makeFilter(
  (text: {
    readonly step: typeof TextStep.Type;
    readonly fontWeight: number;
    readonly minimumContrast?: Rational.Rational | undefined;
  }) =>
    text.minimumContrast === undefined ||
    Rational.isGreaterThanOrEqualTo(
      text.minimumContrast,
      requiredContrast(text.step, text.fontWeight),
    ) || {
      path: ['minimumContrast'],
      issue: `Expected a minimum contrast of at least ${Real.writeDecimals(requiredContrast(text.step, text.fontWeight), Colorimetry.decimalPlaces)}:1, the ratio WCAG 2.2 Contrast (Enhanced) requires for text of ${Real.writeDecimals(text.step.minimumSize, Typography.decimalPlaces)} px at weight ${text.fontWeight}`,
    },
);

/** A schema of the colors of a piece of text and its background, the step of the type scale it is set in, its font weight, and a contrast ratio stricter than the standards that the project may ask for. */
export const Pair = Schema.Struct({
  /** The color of the text. */
  text: Color,
  /** The color of the background. */
  background: Color,
  /** The step of the type scale the text is set in, its position aside. */
  step: TextStep,
  /** The font weight of the text, bold from the weight CSS Fonts gives the bold keyword, which WCAG 2.2 leaves unsaid. */
  fontWeight: FontWeight,
  /** A contrast ratio stricter than the standards that the project may ask for. */
  minimumContrast: Schema.optional(MinimumContrast),
  /** The bits per sRGB channel of a display or a tool the colors are judged on, such as 8 for a color written in hex. */
  channelBits: Schema.optional(ChannelBits),
}).pipe(Schema.check(isAtLeastRequiredContrast));

/** The colors of a piece of text and its background, the step of the type scale it is set in, its font weight, a contrast ratio stricter than the standards that the project may ask for, and the bits per channel the colors are judged on, as they are written. */
export type Pair = typeof Pair.Encoded;

/** The failure of a pair whose contrast falls short of what its text needs, a result of comparing the colors rather than a fault of the input. */
export class ContrastShortfall extends Schema.TaggedError<
  ContrastShortfall,
  { readonly brand: unique symbol }
>()('ContrastShortfall', {
  /** The contrast ratio of the colors, the number JavaScript holds nearest to it. */
  contrast: Schema.Finite,
  /** The contrast ratio the text needs, which WCAG 2.2 Contrast (Enhanced) requires or the project asks for. */
  requiredContrast: Schema.Rational,
  /** Why the pair falls short. */
  message: Schema.String,
}) {}

/** The contrast ratio of a pair, the number JavaScript holds nearest to it; or a failure with the reason when the input is not valid, or a contrast shortfall when the pair falls short of what WCAG 2.2 Contrast (Enhanced) requires for its text, or of the stricter ratio the project asks for. Whether it falls short is decided on the exact colors, by the rule of `indistinguishableChannel`, rather than on the number returned. With bits per channel, the colors are judged as a display or a tool holding channels in that many bits shows and measures them, each channel rounded to the nearest step, the ratio returned is theirs, and whether it falls short is decided exactly. */
export const verify = (pair: Pair): Exit.Exit<number, Schema.SchemaError | ContrastShortfall> =>
  Exit.match(Schema.decodeExit(Pair)(pair, { errors: 'all' }), {
    onFailure: Exit.failCause,
    onSuccess: (colors) => {
      const target = colors.minimumContrast ?? requiredContrast(colors.step, colors.fontWeight);
      const steps =
        colors.channelBits === undefined ? undefined : (1n << BigInt(colors.channelBits)) - 1n;
      const text = linearSrgbOf(
        colors.text.lightness,
        colors.text.chroma,
        cosineSineOf(colors.text.hue, colors.text.hueUnit),
      );
      const background = linearSrgbOf(
        colors.background.lightness,
        colors.background.chroma,
        cosineSineOf(colors.background.hue, colors.background.hueUnit),
      );
      const rounded =
        steps === undefined
          ? undefined
          : ([
              Array.headNonEmpty(roundedLuminancesOf(text, steps, [Rational.fromBigInt(0n)])),
              Array.headNonEmpty(roundedLuminancesOf(background, steps, [Rational.fromBigInt(0n)])),
            ] as const);
      const contrast = Real.nearestNumber(
        rounded === undefined
          ? contrastOf(luminanceOf(text), luminanceOf(background))
          : contrastOf(roundedLuminanceValue(rounded[0]), roundedLuminanceValue(rounded[1])),
      );
      return (
        rounded === undefined
          ? meets(contrastOf(luminanceOf(text), luminanceOf(background)), target)
          : meetsRounded(rounded[0], rounded[1], target)
      )
        ? Exit.succeed(contrast)
        : Exit.fail(
            new ContrastShortfall({
              contrast,
              requiredContrast: target,
              message:
                colors.minimumContrast === undefined
                  ? `Expected a contrast of at least ${Real.writeDecimals(target, Colorimetry.decimalPlaces)}:1 for text of ${Real.writeDecimals(colors.step.minimumSize, Typography.decimalPlaces)} px at weight ${colors.fontWeight}, as WCAG 2.2 Contrast (Enhanced) requires`
                  : `Expected a contrast of at least ${Real.writeDecimals(target, Colorimetry.decimalPlaces)}:1, the ratio the project asks for`,
            }),
          );
    },
  });

/** The failure of a brand color no shade of which within sRGB reaches the contrast its text needs against the background, a result of searching the shades rather than a fault of the input. */
export class NoLegibleShade extends Schema.TaggedError<
  NoLegibleShade,
  { readonly brand: unique symbol }
>()('NoLegibleShade', {
  /** The contrast ratio the text needs, which WCAG 2.2 Contrast (Enhanced) requires or the project asks for. */
  requiredContrast: Schema.Rational,
  /** Why no shade reaches it. */
  message: Schema.String,
}) {}

/** A schema of a color of a brand, the background of text set in it, the step of the type scale the text is set in, its font weight, and a contrast ratio stricter than the standards that the project may ask for. */
export const Brand = Schema.Struct({
  /** The color of the brand. */
  color: Color,
  /** The color of the background. */
  background: Color,
  /** The step of the type scale the text is set in, its position aside. */
  step: TextStep,
  /** The font weight of the text, bold from the weight CSS Fonts gives the bold keyword, which WCAG 2.2 leaves unsaid. */
  fontWeight: FontWeight,
  /** A contrast ratio stricter than the standards that the project may ask for. */
  minimumContrast: Schema.optional(MinimumContrast),
}).pipe(Schema.check(isAtLeastRequiredContrast));

/** A color of a brand, the background of text set in it, the step of the type scale the text is set in, its font weight, and a contrast ratio stricter than the standards that the project may ask for, as they are written. */
export type Brand = typeof Brand.Encoded;

/** The lightness and chroma of the shade of a brand color closest to it by deltaEOK that keeps its hue and reaches the contrast ratio against the background both exactly and once it and the background are rounded to 8-bit channels, as most displays show them and tools measure them, however a channel within a step of the deepest channel of the edge between two steps rounds: the brand color itself, its chroma reduced where sRGB cannot hold it, when it reaches the ratio; otherwise a lightness and a chroma written with the decimal places of the library, so that the shade written is the shade judged. Its chroma is kept or, where sRGB cannot hold it at that lightness, reduced at constant lightness and hue to the largest written chroma sRGB holds, the reduction every gamut mapping algorithm of CSS Color 4 aims at; or none when no shade reaches the ratio. */
const closestShade = (
  color: Color,
  background: Color,
  target: Rational.Rational,
): readonly [Rational.Rational, Rational.Rational] | undefined => {
  const angle = cosineSineOf(color.hue, color.hueUnit);
  // The numbers written: whole numbers of 10^−d.
  const places = 10n ** BigInt(Colorimetry.decimalPlaces);
  const backgroundChannels = linearSrgbOf(
    background.lightness,
    background.chroma,
    cosineSineOf(background.hue, background.hueUnit),
  );
  const backgroundLuminance = luminanceOf(backgroundChannels);
  // Every rounding a tool may make of a channel within a step of the deepest channel of the edge between two steps, as tools compute in numbers that round.
  const shifts = [Rational.negate(deepestChannelStep), deepestChannelStep] as const;
  const backgroundRounded = roundedLuminancesOf(backgroundChannels, BigInt(channelSteps), shifts);
  // Reduced strictly within sRGB rather than within the tolerance a color is read with, as a browser maps a color outside sRGB into it on an sRGB display and shows it outside sRGB on a wider one, so that either way it would not be the color whose contrast was judged. The largest chroma sRGB holds at a lightness and hue is found by halving the written chromas, those below it held and those above not; none when sRGB holds not even the gray, as at the lightness of white, whose red channel the matrices of CSS Color 4 put above 1.
  const chromas = new Map<string, Rational.Rational | undefined>();
  const chromaAt = (lightness: Rational.Rational): Rational.Rational | undefined => {
    const key = Rational.format(lightness);
    if (!chromas.has(key)) {
      if (isInGamut(linearSrgbOf(lightness, color.chroma, angle), Rational.fromBigInt(0n))) {
        chromas.set(key, color.chroma);
      } else if (
        !isInGamut(linearSrgbOf(lightness, Rational.fromBigInt(0n), angle), Rational.fromBigInt(0n))
      ) {
        chromas.set(key, undefined);
      } else {
        let held = 0n;
        // The chroma is outside sRGB, so the first written chroma at least as large is too.
        let outside = -((-color.chroma.numerator * places) / color.chroma.denominator);
        while (outside - held > 1n) {
          const middle = (held + outside) / 2n;
          if (
            isInGamut(
              linearSrgbOf(lightness, Rational.makeUnsafe(middle, places), angle),
              Rational.fromBigInt(0n),
            )
          ) {
            held = middle;
          } else {
            outside = middle;
          }
        }
        chromas.set(key, Rational.makeUnsafe(held, places));
      }
    }
    return chromas.get(key);
  };
  // The channels of the shade at a lightness, the gray where sRGB holds no chroma there.
  const channelsAt = (lightness: Rational.Rational): LinearSrgb =>
    linearSrgbOf(lightness, chromaAt(lightness) ?? Rational.fromBigInt(0n), angle);
  const reaches = (lightness: Rational.Rational): boolean =>
    chromaAt(lightness) !== undefined &&
    meets(contrastOf(luminanceOf(channelsAt(lightness)), backgroundLuminance), target);
  // A shade passes when it reaches the contrast exactly and once rounded to 8-bit channels, however a channel on the edge between two steps rounds.
  const passes = (lightness: Rational.Rational): boolean =>
    reaches(lightness) &&
    roundedLuminancesOf(channelsAt(lightness), BigInt(channelSteps), shifts).every((text) =>
      backgroundRounded.every((rounded) => meetsRounded(text, rounded, target)),
    );
  if (passes(color.lightness)) {
    return [color.lightness, chromaAt(color.lightness) ?? Rational.fromBigInt(0n)];
  }
  // The written lightness at a whole number of 10^−d.
  const written = (index: bigint): Rational.Rational => Rational.makeUnsafe(index, places);
  // The last written lightness from which a condition stops holding, halving between one where it holds and one where it does not.
  const boundary = (holds: (index: bigint) => boolean, inside: bigint, outside: bigint): bigint => {
    let held = inside;
    let failed = outside;
    while (failed - held > 1n || held - failed > 1n) {
      const middle = (held + failed) / 2n;
      if (holds(middle)) {
        held = middle;
      } else {
        failed = middle;
      }
    }
    return held;
  };
  // The first written lightness that passes, from one that reaches the contrast exactly onward to the end of the lightness: rounded contrast rises with lightness in steps, but a channel may round down while another rounds up, so the shades are stepped through by a 4096th of the lightness, finer than a step of an 8-bit channel moves it, and the last step is halved.
  const stride = places / 4096n;
  const firstPassing = (reaching: bigint, end: bigint): bigint | undefined => {
    let failing = reaching;
    for (;;) {
      const next =
        end < failing
          ? failing - stride < end
            ? end
            : failing - stride
          : failing + stride > end
            ? end
            : failing + stride;
      if (passes(written(next))) {
        return boundary((index) => passes(written(index)), next, failing);
      }
      if (next === end) {
        return undefined;
      }
      failing = next;
    }
  };
  // Luminance rises with lightness, so contrast falls toward the lightness of the background from either side: the last written lightness at most as luminous as the background.
  const backgroundIndex = boundary(
    (index) =>
      Real.sign(
        Real.subtract(backgroundLuminance, luminanceOf(channelsAt(written(index)))),
        indistinguishableLuminance,
      ) >= 0,
    0n,
    places + 1n,
  );
  // The written lightnesses at most and at least that of the brand color, the floor and the ceiling of it in whole numbers of 10^−d.
  const below = (color.lightness.numerator * places) / color.lightness.denominator;
  const above = -((-color.lightness.numerator * places) / color.lightness.denominator);
  const darkEnd = below < backgroundIndex ? below : backgroundIndex;
  const lightStart = above > backgroundIndex + 1n ? above : backgroundIndex + 1n;
  const exactlyDarker = reaches(written(darkEnd))
    ? darkEnd
    : reaches(written(0n))
      ? boundary((index) => reaches(written(index)), 0n, darkEnd)
      : undefined;
  const exactlyLighter =
    lightStart > places
      ? undefined
      : reaches(written(lightStart))
        ? lightStart
        : reaches(written(places))
          ? boundary((index) => reaches(written(index)), places, lightStart)
          : undefined;
  const darker =
    exactlyDarker === undefined || passes(written(exactlyDarker))
      ? exactlyDarker
      : firstPassing(exactlyDarker, 0n);
  const lighter =
    exactlyLighter === undefined || passes(written(exactlyLighter))
      ? exactlyLighter
      : firstPassing(exactlyLighter, places);
  // The largest chroma sRGB holds at a hue rises with lightness to one peak and falls after it, so on each side the shade nearest in lightness also loses the least chroma and is the closest by deltaEOK, which at a shared hue is the hypotenuse of the lightness and chroma differences, compared here by their squares.
  const distance = (index: bigint): Rational.Rational =>
    Rational.sum(
      Rational.multiply(
        Rational.subtract(color.lightness, written(index)),
        Rational.subtract(color.lightness, written(index)),
      ),
      Rational.multiply(
        Rational.subtract(color.chroma, chromaAt(written(index)) ?? Rational.fromBigInt(0n)),
        Rational.subtract(color.chroma, chromaAt(written(index)) ?? Rational.fromBigInt(0n)),
      ),
    );
  const closest =
    darker === undefined
      ? lighter
      : lighter === undefined || Rational.isLessThanOrEqualTo(distance(darker), distance(lighter))
        ? darker
        : lighter;
  return closest === undefined
    ? undefined
    : [written(closest), chromaAt(written(closest)) ?? Rational.fromBigInt(0n)];
};

/**
 * The shade of a brand color, written in oklch(), that is closest to it by deltaEOK, the color difference CSS Color 4 defines, among the colors that keep its hue and differ from it only in lightness, its chroma reduced at constant lightness and hue only where sRGB cannot hold it, as CSS Color 4 gamut mapping aims to reduce it, and that reaches the contrast WCAG 2.2 Contrast (Enhanced) requires for its text against the background, or the stricter ratio the project asks for, both exactly and once it and the background are written in hex, rounded to the 8-bit channels most displays show and tools measure, however a channel within a step of the deepest channel of the edge between two steps rounds; or a failure with the reason when the input is not valid, or no legible shade when no shade within sRGB reaches it. A shade other than the brand color is searched among the lightnesses and chromas written with the decimal places of the library, so that the shade written is exactly the shade judged. Colors of another hue or of less chroma are not searched.
 *
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#color-difference-OK
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#css-gamut-mapping-algorithms
 */
export const shade = (brand: Brand): Exit.Exit<string, Schema.SchemaError | NoLegibleShade> =>
  Exit.match(Schema.decodeExit(Brand)(brand, { errors: 'all' }), {
    onFailure: Exit.failCause,
    onSuccess: (colors) => {
      const target = colors.minimumContrast ?? requiredContrast(colors.step, colors.fontWeight);
      // The shade is found once, and its absence is the failure.
      const closest = closestShade(colors.color, colors.background, target);
      return closest === undefined
        ? Exit.fail(
            new NoLegibleShade({
              requiredContrast: target,
              message: `Expected a background against which a shade of the color within sRGB reaches ${Real.writeDecimals(target, Colorimetry.decimalPlaces)}:1, the contrast ${colors.minimumContrast === undefined ? `WCAG 2.2 Contrast (Enhanced) requires for text of ${Real.writeDecimals(colors.step.minimumSize, Typography.decimalPlaces)} px at weight ${colors.fontWeight}` : 'the project asks for'}`,
            }),
          )
        : Exit.succeed(
            `oklch(${Real.writeDecimals(closest[0], Real.exactDecimalPlaces(closest[0]))} ${Real.writeDecimals(closest[1], Real.exactDecimalPlaces(closest[1]))} ${Real.writeDecimals(colors.color.hue, Real.exactDecimalPlaces(colors.color.hue))}${colors.color.hueUnit === 'deg' ? '' : colors.color.hueUnit})`,
          );
    },
  });
