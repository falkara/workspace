import { Effect, Exit, Function, Schema, SchemaIssue, SchemaTransformation, Struct } from 'effect';

import * as Fluid from '#src/Fluid';
import * as Fraction from '#src/Fraction';
import * as Length from '#src/Length';
import * as Typography from '#src/Typography';

/**
 * The contrast ratio that WCAG 2.2 Contrast (Enhanced) requires for text.
 *
 * @see https://www.w3.org/TR/WCAG22/#contrast-enhanced
 */
export const enhancedContrastRatio = 7;

/**
 * The contrast ratio that WCAG 2.2 Contrast (Enhanced) requires for large-scale text.
 *
 * @see https://www.w3.org/TR/WCAG22/#contrast-enhanced
 */
export const largeTextEnhancedContrastRatio = 9 / 2;

/**
 * The font size from which WCAG 2.2 counts text as large-scale. Measured in CSS points.
 *
 * @see https://www.w3.org/TR/WCAG22/#dfn-large-scale
 */
export const largeTextPointSize = Fraction.makeUnsafe(18n, 1n);

/**
 * The font size from which WCAG 2.2 counts bold text as large-scale. Measured in CSS points.
 *
 * @see https://www.w3.org/TR/WCAG22/#dfn-large-scale
 */
export const largeBoldTextPointSize = Fraction.makeUnsafe(14n, 1n);

/** The font size from which text is large-scale, the large text point size in CSS points. Measured in CSS pixels. */
export const largeTextSize = Fraction.multiply(largeTextPointSize, Length.point);

/** The font size from which bold text is large-scale, the large bold text point size in CSS points. Measured in CSS pixels. */
export const largeBoldTextSize = Fraction.multiply(largeBoldTextPointSize, Length.point);

/**
 * The number of steps between the darkest and the lightest level of an 8-bit sRGB channel.
 *
 * @see https://www.w3.org/TR/css-color-4/#hex-notation
 */
export const channelSteps = 255;

/** The distance a gamma-encoded sRGB channel may lie outside its range and still count as inside, half a step of an 8-bit channel, which no display can show. */
export const gamutTolerance = 1 / (2 * channelSteps);

/** Three numbers in order, such as the components or the channels of a color. */
type Vector = readonly [number, number, number];

/** Three rows of three numbers, which turn one vector of a color into another. */
type Matrix = readonly [Vector, Vector, Vector];

/**
 * The matrix from Oklab to the LMS cone responses that CSS Color 4 converts through.
 *
 * @see https://www.w3.org/TR/css-color-4/#color-conversion-code
 */
export const oklabToLms: Matrix = [
  [1, 0.3963377773761749, 0.2158037573099136],
  [1, -0.1055613458156586, -0.0638541728258133],
  [1, -0.0894841775298119, -1.2914855480194092],
];

/**
 * The matrix from LMS cone responses to CIE XYZ with the D65 white point that CSS Color 4 converts through.
 *
 * @see https://www.w3.org/TR/css-color-4/#color-conversion-code
 */
export const lmsToXyz: Matrix = [
  [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
  [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
  [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
];

/**
 * The matrix from CIE XYZ with the D65 white point to linear sRGB that CSS Color 4 converts through.
 *
 * @see https://www.w3.org/TR/css-color-4/#color-conversion-code
 */
export const xyzToLinearSrgb: Matrix = [
  [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
  [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
  [0.05563007969699366, -0.20397695888897652, 1.0569715142428786],
];

/**
 * The chroma that CSS Color 4 sets as 100 % in oklch().
 *
 * @see https://www.w3.org/TR/css-color-4/#specifying-oklab-oklch
 */
export const fullChroma = 2 / 5;

/**
 * The weights of the linear sRGB channels in relative luminance as WCAG 2.2 defines it.
 *
 * @see https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 */
export const luminanceWeights: Vector = [0.2126, 0.7152, 0.0722];

/**
 * The flare WCAG 2.2 adds to both relative luminances of a contrast ratio.
 *
 * @see https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
 */
export const contrastFlare = 1 / 20;

/** The largest contrast ratio WCAG 2.2 defines, of black against white: the largest relative luminance, 1, over the smallest, 0, with the flare added to both. */
export const maximumContrastRatio = (1 + contrastFlare) / contrastFlare;

/**
 * The unit roundoff of JavaScript numbers, half their machine epsilon: the largest relative error of an arithmetic operation, which ECMAScript rounds to the nearest number as IEEE 754 does. The engines of the Baseline core browsers compute the cosine, the sine and powers within one unit in the last place, twice the unit roundoff.
 *
 * @see https://tc39.es/ecma262/#sec-ecmascript-language-types-number-type
 */
export const unitRoundoff = Number.EPSILON / 2;

/**
 * The half turn in each unit of angle CSS Values 4 defines but the radian, whose half turn, π, no number holds exactly, so that a hue in these units is reduced to one turn exactly.
 *
 * @see https://www.w3.org/TR/css-values-4/#angles
 */
export const halfTurns: { readonly deg: number; readonly grad: number; readonly turn: number } = {
  deg: 180,
  grad: 200,
  turn: 1 / 2,
};

/** The angle in radians of a hue in its unit of angle: reduced to one turn exactly and then turned into radians, or taken as it is when it is already in radians, as the cosine and the sine reduce any argument themselves. */
const angleOf = (hue: number, hueUnit: 'deg' | 'grad' | 'rad' | 'turn'): number =>
  hueUnit === 'rad' ? hue : ((hue % (2 * halfTurns[hueUnit])) * Math.PI) / halfTurns[hueUnit];

/** The product of a matrix and a vector, each row summed from left to right as CSS Color 4 sums it. */
const transform = ([first, second, third]: Matrix, [x, y, z]: Vector): Vector => [
  first[0] * x + first[1] * y + first[2] * z,
  second[0] * x + second[1] * y + second[2] * z,
  third[0] * x + third[1] * y + third[2] * z,
];

/** The linear sRGB channels of a color of the given lightness, chroma and hue in its unit of angle, converted as CSS Color 4 does, the hue first reduced to one turn exactly where its unit allows, so that no large hue loses precision in radians. */
const linearSrgbOf = (
  lightness: number,
  chroma: number,
  hue: number,
  hueUnit: 'deg' | 'grad' | 'rad' | 'turn',
): Vector => {
  const h = angleOf(hue, hueUnit);
  const [long, medium, short] = transform(oklabToLms, [
    lightness,
    chroma * Math.cos(h),
    chroma * Math.sin(h),
  ]);
  return transform(xyzToLinearSrgb, transform(lmsToXyz, [long ** 3, medium ** 3, short ** 3]));
};

/** The relative luminance of linear sRGB channels as WCAG 2.2 defines it, each weighted and held within its range. */
const luminanceOf = ([red, green, blue]: Vector): number =>
  luminanceWeights[0] * Math.min(Math.max(red, 0), 1) +
  luminanceWeights[1] * Math.min(Math.max(green, 0), 1) +
  luminanceWeights[2] * Math.min(Math.max(blue, 0), 1);

/** The relative error left by a number of roundings, as Higham bounds it. */
const gamma = (roundings: number): number =>
  (roundings * unitRoundoff) / (1 - roundings * unitRoundoff);

/** A bound on the absolute rounding error in each linear sRGB channel of a color, carried through every step of its conversion by the rounding error analysis of Higham: each sum of products by the unit roundoff over the absolute values of its terms, each cosine, sine and power by one unit in the last place, and every error already made through the coefficients it meets. */
const channelErrors = ({ lightness, chroma, hue, hueUnit }: Color): Vector => {
  // The error of a row of a matrix product: the error already in the vector through the coefficients it meets, and the rounding of the sum of products.
  const rowError = (row: Vector, [x, y, z]: Vector, [dx, dy, dz]: Vector): number =>
    Math.abs(row[0]) * dx +
    Math.abs(row[1]) * dy +
    Math.abs(row[2]) * dz +
    gamma(4) * (Math.abs(row[0] * x) + Math.abs(row[1] * y) + Math.abs(row[2] * z));
  // The error of a cube of a value that carries an error, and the rounding of the power.
  const cubeError = (value: number, error: number): number =>
    (Math.abs(value) + error) ** 3 - Math.abs(value) ** 3 + 2 * unitRoundoff * Math.abs(value) ** 3;
  const angle = angleOf(hue, hueUnit);
  // A hue in radians is the angle itself, off by the rounding of the number it was read as; a hue in another unit is also off by the rounding of π and of the product and quotient that turn it into radians.
  const angleError =
    hueUnit === 'rad'
      ? unitRoundoff * Math.abs(hue)
      : (unitRoundoff * Math.abs(hue) * Math.PI) / halfTurns[hueUnit] + gamma(3) * Math.abs(angle);
  const lightnessError = gamma(2) * lightness;
  const chromaError = gamma(4) * chroma;
  const [cosine, sine] = [Math.cos(angle), Math.sin(angle)];
  const lab: Vector = [lightness, chroma * cosine, chroma * sine];
  const labError: Vector = [
    lightnessError,
    chroma * (angleError + 2 * unitRoundoff) +
      (Math.abs(cosine) + angleError + 2 * unitRoundoff) * chromaError +
      unitRoundoff * Math.abs(lab[1]),
    chroma * (angleError + 2 * unitRoundoff) +
      (Math.abs(sine) + angleError + 2 * unitRoundoff) * chromaError +
      unitRoundoff * Math.abs(lab[2]),
  ];
  const cubeRoots = transform(oklabToLms, lab);
  const cubeRootErrors: Vector = [
    rowError(oklabToLms[0], lab, labError),
    rowError(oklabToLms[1], lab, labError),
    rowError(oklabToLms[2], lab, labError),
  ];
  const lms: Vector = [cubeRoots[0] ** 3, cubeRoots[1] ** 3, cubeRoots[2] ** 3];
  const lmsError: Vector = [
    cubeError(cubeRoots[0], cubeRootErrors[0]),
    cubeError(cubeRoots[1], cubeRootErrors[1]),
    cubeError(cubeRoots[2], cubeRootErrors[2]),
  ];
  const xyz = transform(lmsToXyz, lms);
  const xyzError: Vector = [
    rowError(lmsToXyz[0], lms, lmsError),
    rowError(lmsToXyz[1], lms, lmsError),
    rowError(lmsToXyz[2], lms, lmsError),
  ];
  return [
    rowError(xyzToLinearSrgb[0], xyz, xyzError),
    rowError(xyzToLinearSrgb[1], xyz, xyzError),
    rowError(xyzToLinearSrgb[2], xyz, xyzError),
  ];
};

/** A bound on the absolute rounding error in the relative luminance of a color: the error of each linear sRGB channel through its weight, and the rounding of the weighted sum, as holding a channel within its range moves it no further than its error. Doubled, so that rounding while computing the bound, a relative error of tens of unit roundoffs, cannot leave it below the error it bounds. */
const luminanceError = (color: Color): number => {
  const channels = linearSrgbOf(color.lightness, color.chroma, color.hue, color.hueUnit);
  const channelError = channelErrors(color);
  return (
    2 *
    (luminanceWeights[0] * channelError[0] +
      gamma(4) * luminanceWeights[0] * Math.min(Math.max(channels[0], 0), 1) +
      luminanceWeights[1] * channelError[1] +
      gamma(4) * luminanceWeights[1] * Math.min(Math.max(channels[1], 0), 1) +
      luminanceWeights[2] * channelError[2] +
      gamma(4) * luminanceWeights[2] * Math.min(Math.max(channels[2], 0), 1))
  );
};

/**
 * The linear sRGB value up to which the sRGB transfer function is linear.
 *
 * @see https://www.w3.org/TR/css-color-4/#predefined-sRGB
 */
export const transferThreshold = 0.0031308;

/**
 * The slope of the linear part of the sRGB transfer function.
 *
 * @see https://www.w3.org/TR/css-color-4/#predefined-sRGB
 */
export const transferSlope = 12.92;

/**
 * The exponent of the curved part of the sRGB transfer function.
 *
 * @see https://www.w3.org/TR/css-color-4/#predefined-sRGB
 */
export const transferGamma = 2.4;

/**
 * The offset of the curved part of the sRGB transfer function.
 *
 * @see https://www.w3.org/TR/css-color-4/#predefined-sRGB
 */
export const transferOffset = 0.055;

/** The gamma-encoded value of a linear sRGB channel, as the sRGB transfer function writes it, keeping its sign. */
const encoded = (channel: number): number =>
  Math.abs(channel) <= transferThreshold
    ? transferSlope * channel
    : Math.sign(channel) *
      ((1 + transferOffset) * Math.abs(channel) ** (1 / transferGamma) - transferOffset);

/** Whether linear sRGB channels lie within sRGB once encoded, up to a tolerance. */
const isInGamut = (channels: ReadonlyArray<number>, tolerance: number): boolean =>
  channels.every((channel) => encoded(channel) >= -tolerance && encoded(channel) <= 1 + tolerance);

/**
 * The gamma-encoded sRGB value up to which the sRGB transfer function reads a channel as linear.
 *
 * @see https://www.w3.org/TR/css-color-4/#color-conversion-code
 */
export const encodedTransferThreshold = 0.04045;

/** The linear sRGB value of a gamma-encoded channel within its range, as the sRGB transfer function reads it. */
const decoded = (channel: number): number =>
  channel <= encodedTransferThreshold
    ? channel / transferSlope
    : ((channel + transferOffset) / (1 + transferOffset)) ** transferGamma;

/** The relative luminance of a color once each of its gamma-encoded sRGB channels is rounded to the nearest of the given number of steps, as a display or a tool that holds channels in whole steps shows and measures it: the least, as rounded, and the largest it may have. A channel whose encoded value lies within its rounding error of the middle between two steps may round to either, so the least and the largest take both: the error of its linear value, doubled as for the luminance, and sixty-four unit roundoffs of a step, more than encoding the value and scaling it to steps can take from it. */
const roundedLuminances = (color: Color, steps: number): Vector => {
  const channels = linearSrgbOf(color.lightness, color.chroma, color.hue, color.hueUnit);
  const errors = channelErrors(color);
  // The step a channel rounds to once its linear value is moved by its error to one side, or not at all.
  const stepAt = (channel: number, error: number, side: number): number =>
    Math.min(
      Math.max(
        Math.round(
          encoded(Math.min(Math.max(channel + side * 2 * error, 0), 1)) * steps +
            side * 64 * unitRoundoff * steps,
        ),
        0,
      ),
      steps,
    );
  // The relative luminance of the channels rounded toward one side.
  const luminanceAt = (side: number): number =>
    luminanceWeights[0] * decoded(stepAt(channels[0], errors[0], side) / steps) +
    luminanceWeights[1] * decoded(stepAt(channels[1], errors[1], side) / steps) +
    luminanceWeights[2] * decoded(stepAt(channels[2], errors[2], side) / steps);
  return [luminanceAt(-1), luminanceAt(0), luminanceAt(1)];
};

/** The relative error of the relative luminance of channels rounded to steps, computed: dividing a step, adding the offset, the offset added to 1 and dividing by it round four times, which the power of 2.4 makes less than ten unit roundoffs and rounds once more by two; weighting and adding the channels round three times more, sixteen in all. */
const roundedLuminanceError = gamma(16);

/** The two luminances, one from each range, closest to each other, at which the contrast of the two ranges is least: the top of the darker range and the bottom of the lighter, or a luminance both ranges hold. */
const leastApart = (text: Vector, background: Vector): readonly [number, number] =>
  text[2] < background[0]
    ? [text[2], background[0]]
    : background[2] < text[0]
      ? [text[0], background[2]]
      : [Math.max(text[0], background[0]), Math.max(text[0], background[0])];

/** A schema of the components of an oklch() color as CSS Color 4 defines them, opaque and within sRGB, where WCAG 2.2 defines contrast. */
const Components = Schema.Struct({
  /** The lightness, from 0 for black to 1 for white. */
  lightness: Schema.Finite,
  /** The chroma, 0 for a gray. */
  chroma: Schema.Finite,
  /** The hue. Measured in its unit of angle. */
  hue: Schema.Finite,
  /** The unit of angle the hue is written in, degrees when it is written as a number. */
  hueUnit: Schema.Literals(['deg', 'grad', 'rad', 'turn']),
  /** The alpha, from 0 for transparent to 1 for opaque. */
  alpha: Schema.Finite,
}).pipe(
  Schema.check(
    Schema.makeFilter(
      (color) =>
        color.alpha >= 1 ||
        'Expected an opaque color, as WCAG 2.2 defines no contrast for a translucent one',
    ),
    Schema.makeFilter(
      (color) =>
        isInGamut(
          linearSrgbOf(color.lightness, color.chroma, color.hue, color.hueUnit),
          gamutTolerance,
        ) || 'Expected a color within sRGB, as WCAG 2.2 defines contrast only there',
    ),
  ),
);

/** A schema of a color written in oklch() as CSS Color 4 writes it, its function named in any case, each component a number, a percentage or none, the hue a number or an angle in any unit, apart from math functions and relative colors, which name no value until a browser computes them. Decoded once into its lightness, chroma, hue and alpha, none read as 0 and each component clamped to its range as CSS Color 4 clamps it, and checked to be opaque and within sRGB, where WCAG 2.2 defines contrast. Encoded as JavaScript writes each number, which it decodes again into the same components. */
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
        const [
          ,
          lightness,
          lightnessPercent,
          chroma,
          chromaPercent,
          hue,
          hueUnit,
          slash,
          alpha,
          alphaPercent,
        ] = match;
        return Effect.succeed({
          lightness:
            lightness === undefined
              ? 0
              : Math.min(Math.max(Number(lightness) / (lightnessPercent === '%' ? 100 : 1), 0), 1),
          chroma:
            chroma === undefined
              ? 0
              : Math.max(
                  (Number(chroma) * (chromaPercent === '%' ? fullChroma : 1)) /
                    (chromaPercent === '%' ? 100 : 1),
                  0,
                ),
          hue: hue === undefined ? 0 : Number(hue),
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
              ? 1
              : alpha === undefined
                ? 0
                : Math.min(Math.max(Number(alpha) / (alphaPercent === '%' ? 100 : 1), 0), 1),
        });
      },
      encode: (color) =>
        Effect.succeed(
          `oklch(${color.lightness} ${color.chroma} ${color.hue}${color.hueUnit === 'deg' ? '' : color.hueUnit} / ${color.alpha})`,
        ),
    }),
  ),
);

/** A color with its lightness, chroma, hue in its unit of angle and alpha, opaque and within sRGB. */
export type Color = typeof Color.Type;

/** The relative luminance of a color as WCAG 2.2 defines it, its linear sRGB channels weighted and held within their range. */
const relativeLuminance = (color: Color): number =>
  luminanceOf(linearSrgbOf(color.lightness, color.chroma, color.hue, color.hueUnit));

/** The contrast ratio of two colors as WCAG 2.2 defines it, the lighter over the darker with the flare added to both. */
const contrastRatio = (text: Color, background: Color): number =>
  (Math.max(relativeLuminance(text), relativeLuminance(background)) + contrastFlare) /
  (Math.min(relativeLuminance(text), relativeLuminance(background)) + contrastFlare);

/**
 * Whether colors of the given relative luminances, each off by at most the given rounding error, may have a contrast ratio of at least the given one, so that a ratio is out of reach only when rounding cannot account for the shortfall. The exact colors are the colors the matrices of CSS Color 4 convert as they are written, computed without rounding: by those matrices white has a relative luminance of 0.99999999999999941 and black against white a contrast ratio of 20.999999999999987, as the matrices hold the conversion of Oklab to sixteen digits.
 *
 * The largest contrast the exact colors may have is the quotient of the largest luminance and the smallest, each moved by its rounding error, with the flare added to both. Computing it rounds five times: the luminance and its error added in the numerator and in the denominator, the flare added to each, and the quotient, so that it lies below the exact quotient by a relative error of at most five unit roundoffs and their products. Raising it by sixteen unit roundoffs, whose product rounds once more, leaves it above the exact quotient with ten unit roundoffs to spare.
 */
const mayReachLuminances = (
  text: number,
  textError: number,
  background: number,
  backgroundError: number,
  ratio: number,
): boolean =>
  ((Math.max(text + textError, background + backgroundError) + contrastFlare) /
    (Math.max(Math.min(text - textError, background - backgroundError), 0) + contrastFlare)) *
    (1 + 16 * unitRoundoff) >=
  ratio;

/** Whether colors of the given relative luminances, each off by at most the given rounding error, certainly have a contrast ratio of at least the given one, so that a ratio is reached only when no rounding can account for reaching it. The smallest contrast the exact colors may have is the quotient of the smallest luminance the lighter may have and the largest the darker may have, with the flare added to both. Computing it rounds five times as the largest does, so that it lies above the exact quotient by a relative error of at most five unit roundoffs and their products; lowering it by sixteen unit roundoffs, whose product rounds once more, leaves it below the exact quotient with ten unit roundoffs to spare. */
const mustReachLuminances = (
  text: number,
  textError: number,
  background: number,
  backgroundError: number,
  ratio: number,
): boolean =>
  ((Math.max(text - textError, background - backgroundError) + contrastFlare) /
    (Math.min(text + textError, background + backgroundError) + contrastFlare)) *
    (1 - 16 * unitRoundoff) >=
  ratio;

/** Whether the exact colors may have a contrast ratio of at least the given one, so that a ratio is out of reach only when rounding cannot account for the shortfall. */
const mayReach = (text: Color, background: Color, ratio: number): boolean =>
  mayReachLuminances(
    relativeLuminance(text),
    luminanceError(text),
    relativeLuminance(background),
    luminanceError(background),
    ratio,
  );

/** Whether colors whose channels are rounded to the given number of steps may reach a ratio at the rounding that gives the least contrast, so that a pair whose channel lies on the edge between two steps passes only when it passes rounded either way, and otherwise is refused only when rounding cannot account for the shortfall. */
const mayReachRounded = (text: Color, background: Color, steps: number, ratio: number): boolean => {
  const [textLuminance, backgroundLuminance] = leastApart(
    roundedLuminances(text, steps),
    roundedLuminances(background, steps),
  );
  return mayReachLuminances(
    textLuminance,
    roundedLuminanceError * textLuminance,
    backgroundLuminance,
    roundedLuminanceError * backgroundLuminance,
    ratio,
  );
};

/** Whether colors whose channels are rounded to the given number of steps certainly reach a ratio, however a channel on the edge between two steps rounds and whatever rounding takes from the computed contrast. */
const mustReachRounded = (
  text: Color,
  background: Color,
  steps: number,
  ratio: number,
): boolean => {
  const [textLuminance, backgroundLuminance] = leastApart(
    roundedLuminances(text, steps),
    roundedLuminances(background, steps),
  );
  return mustReachLuminances(
    textLuminance,
    roundedLuminanceError * textLuminance,
    backgroundLuminance,
    roundedLuminanceError * backgroundLuminance,
    ratio,
  );
};

/** The contrast ratio of two colors as WCAG 2.2 defines it once each of their channels is rounded to the nearest of the given number of steps, as a display or a tool that holds channels in whole steps computes it. */
const roundedContrastRatio = (text: Color, background: Color, steps: number): number =>
  (Math.max(roundedLuminances(text, steps)[1], roundedLuminances(background, steps)[1]) +
    contrastFlare) /
  (Math.min(roundedLuminances(text, steps)[1], roundedLuminances(background, steps)[1]) +
    contrastFlare);

/** A schema of the number of bits each sRGB channel is held in by a display or a tool that colors are judged on, from 1 to 16, the most an image format such as PNG holds, so that its steps are whole numbers a number holds exactly. */
const ChannelBits = Schema.Int.pipe(
  Schema.check(
    Schema.isBetween(
      { minimum: 1, maximum: 16 },
      {
        message: 'Expected from 1 to 16 bits per channel, as displays and image formats hold them',
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

/** The contrast ratio of text over its background as WCAG 2.2 defines it, or a failure naming the color that WCAG 2.2 gives no contrast. The ratio is the one JavaScript computes, which may lie a few units in the last place from the ratio of the exact colors, the colors the matrices of CSS Color 4 convert as they are written, computed without rounding: black against white gives 20.999999999999986, the number nearest to the 20.999999999999987 the exact colors give, as the matrices hold the conversion of Oklab to sixteen digits. Whether it meets a ratio is decided by `reaches` or `verify`, which account for that rounding. */
export const contrast = (text: string, background: string): Exit.Exit<number, Schema.SchemaError> =>
  Exit.map(Schema.decodeExit(Colors)({ text, background }, { errors: 'all' }), (colors) =>
    contrastRatio(colors.text, colors.background),
  );

/** A schema of the colors of a piece of text and its background, the bits per channel they are judged on, and a contrast ratio from 1:1 to the largest WCAG 2.2 defines that they are to reach. */
const Threshold = Schema.Struct({
  ...Colors.fields,
  /** The contrast ratio the colors are to reach. */
  ratio: Schema.Finite.pipe(
    Schema.check(
      Schema.isBetween(
        { minimum: 1, maximum: maximumContrastRatio },
        {
          message: `Expected a contrast ratio from 1:1 to ${maximumContrastRatio}:1, the range of the contrast WCAG 2.2 defines`,
        },
      ),
    ),
  ),
});

/** Whether text over its background reaches a contrast ratio as WCAG 2.2 defines it, decided as `verify` decides it: false only when the rounding of the computed ratio cannot account for its shortfall, so that colors whose exact contrast meets the ratio always reach it, the exact colors being the colors the matrices of CSS Color 4 convert as they are written, computed without rounding; or a failure with the reason when a color or the ratio is not valid. With bits per channel, the colors are judged as a display or a tool holding channels in that many bits shows and measures them, each channel rounded to the nearest step, and a channel on the edge between two steps must reach the ratio rounded either way. */
export const reaches: {
  (ratio: number): (colors: Colors) => Exit.Exit<boolean, Schema.SchemaError>;
  (colors: Colors, ratio: number): Exit.Exit<boolean, Schema.SchemaError>;
} = Function.dual(2, (colors: Colors, ratio: number): Exit.Exit<boolean, Schema.SchemaError> =>
  Exit.map(Schema.decodeExit(Threshold)({ ...colors, ratio }, { errors: 'all' }), (threshold) =>
    threshold.channelBits === undefined
      ? mayReach(threshold.text, threshold.background, threshold.ratio)
      : mayReachRounded(
          threshold.text,
          threshold.background,
          2 ** threshold.channelBits - 1,
          threshold.ratio,
        ),
  ),
);

/** A schema of the step of the type scale a piece of text is set in, without its position, which the contrast never reads. The check of the step is kept, as it reads the sizes alone: the step never shrinks, so that its size at the minimum viewport width is its smallest, the size the contrast it needs rests on. */
const TextStep = Typography.Step.mapFields(Struct.omit(['position']), {
  unsafePreserveChecks: true,
});

/** The contrast ratio a piece of text needs as WCAG 2.2 Contrast (Enhanced) sets it, from its size at the minimum viewport width, its smallest, and its font weight. */
const requiredContrast = (step: typeof TextStep.Type, fontWeight: number): number =>
  Fraction.isGreaterThanOrEqualTo(step.minimumSize, largeTextSize) ||
  (fontWeight >= Typography.boldFontWeight &&
    Fraction.isGreaterThanOrEqualTo(step.minimumSize, largeBoldTextSize))
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
const MinimumContrast = Schema.Finite.pipe(
  Schema.check(
    Schema.isLessThanOrEqualTo(maximumContrastRatio, {
      message: `Expected a minimum contrast of at most ${maximumContrastRatio}:1, the largest contrast WCAG 2.2 defines, of black against white`,
    }),
  ),
);

/** A check that the contrast ratio a project asks for is at least the one WCAG 2.2 Contrast (Enhanced) requires for its text, so that a project can only be stricter than the standards. */
const isAtLeastRequiredContrast = Schema.makeFilter(
  (text: {
    readonly step: typeof TextStep.Type;
    readonly fontWeight: number;
    readonly minimumContrast?: number | undefined;
  }) =>
    text.minimumContrast === undefined ||
    text.minimumContrast >= requiredContrast(text.step, text.fontWeight) || {
      path: ['minimumContrast'],
      issue: `Expected a minimum contrast of at least ${requiredContrast(text.step, text.fontWeight)}:1, the ratio WCAG 2.2 Contrast (Enhanced) requires for text of ${Math.round(Fraction.toNumber(text.step.minimumSize) * 10 ** Fluid.decimalPlaces) / 10 ** Fluid.decimalPlaces} px at weight ${text.fontWeight}`,
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
  /** The font weight of the text. */
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
  /** The contrast ratio of the colors. */
  contrast: Schema.Finite,
  /** The contrast ratio the text needs, which WCAG 2.2 Contrast (Enhanced) requires or the project asks for. */
  requiredContrast: Schema.Finite,
  /** Why the pair falls short. */
  message: Schema.String,
}) {}

/** The contrast ratio of a pair; or a failure with the reason when the input is not valid, or a contrast shortfall when the pair falls short of what WCAG 2.2 Contrast (Enhanced) requires for its text, or of the stricter ratio the project asks for. A pair is refused only when rounding cannot account for its shortfall, so that a pair whose exact colors, the colors the matrices of CSS Color 4 convert as they are written, meet the ratio passes even when the ratio it returns, the one JavaScript computes, lies a few units in the last place below it. With bits per channel, the colors are judged as a display or a tool holding channels in that many bits shows and measures them, each channel rounded to the nearest step, the ratio returned is theirs, and a channel on the edge between two steps must meet the ratio rounded either way. */
export const verify = (pair: Pair): Exit.Exit<number, Schema.SchemaError | ContrastShortfall> =>
  Exit.match(Schema.decodeExit(Pair)(pair, { errors: 'all' }), {
    onFailure: Exit.failCause,
    onSuccess: (colors) => {
      const target = colors.minimumContrast ?? requiredContrast(colors.step, colors.fontWeight);
      const contrast =
        colors.channelBits === undefined
          ? contrastRatio(colors.text, colors.background)
          : roundedContrastRatio(colors.text, colors.background, 2 ** colors.channelBits - 1);
      return (
        colors.channelBits === undefined
          ? mayReach(colors.text, colors.background, target)
          : mayReachRounded(colors.text, colors.background, 2 ** colors.channelBits - 1, target)
      )
        ? Exit.succeed(contrast)
        : Exit.fail(
            new ContrastShortfall({
              contrast,
              requiredContrast: target,
              message:
                colors.minimumContrast === undefined
                  ? `Expected a contrast of at least ${target}:1 for text of ${Math.round(Fraction.toNumber(colors.step.minimumSize) * 10 ** Fluid.decimalPlaces) / 10 ** Fluid.decimalPlaces} px at weight ${colors.fontWeight}, as WCAG 2.2 Contrast (Enhanced) requires`
                  : `Expected a contrast of at least ${target}:1, the ratio the project asks for`,
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
  requiredContrast: Schema.Finite,
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
  /** The font weight of the text. */
  fontWeight: FontWeight,
  /** A contrast ratio stricter than the standards that the project may ask for. */
  minimumContrast: Schema.optional(MinimumContrast),
}).pipe(Schema.check(isAtLeastRequiredContrast));

/** A color of a brand, the background of text set in it, the step of the type scale the text is set in, its font weight, and a contrast ratio stricter than the standards that the project may ask for, as they are written. */
export type Brand = typeof Brand.Encoded;

/** The value next to which a condition stops holding, halving the interval from where it holds to where it does not until no JavaScript number lies between. */
const boundary = (holds: (value: number) => boolean, inside: number, outside: number): number =>
  (inside + outside) / 2 === inside || (inside + outside) / 2 === outside
    ? inside
    : holds((inside + outside) / 2)
      ? boundary(holds, (inside + outside) / 2, outside)
      : boundary(holds, inside, (inside + outside) / 2);

/** The lightness, chroma and hue, in the unit of angle the brand color is written in, of the shade of a brand color closest to it by deltaEOK that reaches the contrast ratio against the background both exactly and certainly once it and the background are rounded to 8-bit channels, as most displays show them and tools measure them, however a channel on the edge between two steps rounds: its hue kept, and its chroma kept or, where sRGB cannot hold it at that lightness, reduced at constant lightness and hue to the edge of sRGB, the reduction every gamut mapping algorithm of CSS Color 4 aims at, reached exactly so that the lightness and hue the contrast rests on stay exact; or none when no shade reaches it. */
const closestShade = (
  color: Color,
  background: Color,
  target: number,
): readonly [number, number, number] | undefined => {
  const { lightness, chroma, hue, hueUnit } = color;
  const chromaAt = (shade: number): number =>
    // Reduced strictly within sRGB, so that the shade stays within it once written and read again.
    isInGamut(linearSrgbOf(shade, chroma, hue, hueUnit), 0)
      ? chroma
      : boundary((reduced) => isInGamut(linearSrgbOf(shade, reduced, hue, hueUnit), 0), 0, chroma);
  const luminanceAt = (shade: number): number =>
    luminanceOf(linearSrgbOf(shade, chromaAt(shade), hue, hueUnit));
  const backgroundLuminance = relativeLuminance(background);
  const reaches = (shade: number): boolean =>
    (Math.max(luminanceAt(shade), backgroundLuminance) + contrastFlare) /
      (Math.min(luminanceAt(shade), backgroundLuminance) + contrastFlare) >=
    target;
  // A shade passes when it reaches the contrast exactly and certainly once rounded to 8-bit channels.
  const passes = (shade: number): boolean =>
    reaches(shade) &&
    mustReachRounded(
      { lightness: shade, chroma: chromaAt(shade), hue, hueUnit, alpha: 1 },
      background,
      channelSteps,
      target,
    );
  // The first shade that passes, from one that reaches the contrast exactly onward to the end of the lightness: rounded contrast rises with lightness in steps, but a channel may round down while another rounds up, so the shades are stepped through by a 4096th of the lightness, finer than a step of an 8-bit channel moves it, and the last step is halved.
  const firstPassing = (failing: number, end: number): number | undefined => {
    const next =
      end < failing ? Math.max(failing - 1 / 4096, end) : Math.min(failing + 1 / 4096, end);
    return passes(next)
      ? boundary(passes, next, failing)
      : next === end
        ? undefined
        : firstPassing(next, end);
  };
  // Luminance rises with lightness, so contrast falls toward the lightness of the background from either side.
  const backgroundLightness = boundary((shade) => luminanceAt(shade) <= backgroundLuminance, 0, 1);
  const darkEnd = Math.min(lightness, backgroundLightness);
  const lightStart = Math.max(lightness, backgroundLightness);
  const exactlyDarker = reaches(darkEnd)
    ? darkEnd
    : reaches(0)
      ? boundary(reaches, 0, darkEnd)
      : undefined;
  const exactlyLighter = reaches(lightStart)
    ? lightStart
    : reaches(1)
      ? boundary(reaches, 1, lightStart)
      : undefined;
  const darker =
    exactlyDarker === undefined || passes(exactlyDarker)
      ? exactlyDarker
      : firstPassing(exactlyDarker, 0);
  const lighter =
    exactlyLighter === undefined || passes(exactlyLighter)
      ? exactlyLighter
      : firstPassing(exactlyLighter, 1);
  // The largest chroma sRGB holds at a hue rises with lightness to one peak and falls after it, so on each side the shade nearest in lightness also loses the least chroma and is the closest by deltaEOK, which at a shared hue is the hypotenuse of the lightness and chroma differences.
  const closest =
    darker === undefined
      ? lighter
      : lighter === undefined ||
          Math.hypot(lightness - darker, chroma - chromaAt(darker)) <=
            Math.hypot(lighter - lightness, chroma - chromaAt(lighter))
        ? darker
        : lighter;
  return closest === undefined ? undefined : [closest, chromaAt(closest), hue];
};

/**
 * The shade of a brand color, written in oklch(), that is closest to it by deltaEOK, the color difference CSS Color 4 defines, and reaches the contrast WCAG 2.2 Contrast (Enhanced) requires for its text against the background, or the stricter ratio the project asks for, both exactly and once it and the background are written in hex, rounded to the 8-bit channels most displays show and tools measure; or a failure with the reason when the input is not valid, or no legible shade when no shade within sRGB reaches it. Its hue is kept and its chroma is reduced only where sRGB cannot hold it, at constant lightness and hue as CSS Color 4 gamut mapping aims to reduce it.
 *
 * @see https://www.w3.org/TR/css-color-4/#color-difference-OK
 * @see https://www.w3.org/TR/css-color-4/#css-gamut-mapping-algorithms
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
              message: `Expected a background against which a shade of the color within sRGB reaches ${target}:1, the contrast ${colors.minimumContrast === undefined ? `WCAG 2.2 Contrast (Enhanced) requires for text of ${Math.round(Fraction.toNumber(colors.step.minimumSize) * 10 ** Fluid.decimalPlaces) / 10 ** Fluid.decimalPlaces} px at weight ${colors.fontWeight}` : 'the project asks for'}`,
            }),
          )
        : // Written in fixed notation, which CSS reads, rather than the exponent JavaScript uses for small numbers, without trailing zeros.
          Exit.succeed(
            `oklch(${closest[0].toFixed(16).replace(/\.?0+$/, '')} ${closest[1].toFixed(16).replace(/\.?0+$/, '')} ${closest[2]}${colors.color.hueUnit === 'deg' ? '' : colors.color.hueUnit})`,
          );
    },
  });
