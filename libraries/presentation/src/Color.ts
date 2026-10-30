import { Effect, Exit, Schema, SchemaIssue, SchemaTransformation } from 'effect';

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

/** The product of a matrix and a vector, each row summed from left to right as CSS Color 4 sums it. */
const transform = ([first, second, third]: Matrix, [x, y, z]: Vector): Vector => [
  first[0] * x + first[1] * y + first[2] * z,
  second[0] * x + second[1] * y + second[2] * z,
  third[0] * x + third[1] * y + third[2] * z,
];

/** The linear sRGB channels of a color of the given lightness, chroma and hue in degrees, converted as CSS Color 4 does, the hue first reduced to one turn exactly so that no large hue loses precision in radians. */
const linearSrgbOf = (lightness: number, chroma: number, hue: number): Vector => {
  const h = ((hue % 360) * Math.PI) / 180;
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

/** A bound on the absolute rounding error in the relative luminance of a color, carried through every step of its conversion by the rounding error analysis of Higham: each sum of products by the unit roundoff over the absolute values of its terms, each cosine, sine and power by one unit in the last place, and every error already made through the coefficients it meets. Doubled, so that rounding while computing the bound, a relative error of tens of unit roundoffs, cannot leave it below the error it bounds. */
const luminanceError = ({ lightness, chroma, hue }: Color): number => {
  // The relative error left by n roundings, as Higham bounds it.
  const gamma = (n: number): number => (n * unitRoundoff) / (1 - n * unitRoundoff);
  // The error of a row of a matrix product: the error already in the vector through the coefficients it meets, and the rounding of the sum of products.
  const rowError = (row: Vector, [x, y, z]: Vector, [dx, dy, dz]: Vector): number =>
    Math.abs(row[0]) * dx +
    Math.abs(row[1]) * dy +
    Math.abs(row[2]) * dz +
    gamma(4) * (Math.abs(row[0] * x) + Math.abs(row[1] * y) + Math.abs(row[2] * z));
  // The error of a cube of a value that carries an error, and the rounding of the power.
  const cubeError = (value: number, error: number): number =>
    (Math.abs(value) + error) ** 3 - Math.abs(value) ** 3 + 2 * unitRoundoff * Math.abs(value) ** 3;
  const angle = ((hue % 360) * Math.PI) / 180;
  const angleError = (unitRoundoff * Math.abs(hue) * Math.PI) / 180 + gamma(3) * Math.abs(angle);
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
  const channels = transform(xyzToLinearSrgb, xyz);
  const channelError: Vector = [
    rowError(xyzToLinearSrgb[0], xyz, xyzError),
    rowError(xyzToLinearSrgb[1], xyz, xyzError),
    rowError(xyzToLinearSrgb[2], xyz, xyzError),
  ];
  // Holding a channel within its range moves it no further than its error.
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

/** A schema of the components of an oklch() color as CSS Color 4 defines them, opaque and within sRGB, where WCAG 2.2 defines contrast. */
const Components = Schema.Struct({
  /** The lightness, from 0 for black to 1 for white. */
  lightness: Schema.Finite,
  /** The chroma, 0 for a gray. */
  chroma: Schema.Finite,
  /** The hue. Measured in degrees. */
  hue: Schema.Finite,
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
        isInGamut(linearSrgbOf(color.lightness, color.chroma, color.hue), gamutTolerance) ||
        'Expected a color within sRGB, as WCAG 2.2 defines contrast only there',
    ),
  ),
);

/** A schema of a color written in oklch() as CSS Color 4 writes it, decoded once into its lightness, chroma, hue in degrees and alpha, the lightness and the alpha clamped to their range as CSS Color 4 clamps them, and checked to be opaque and within sRGB, where WCAG 2.2 defines contrast. Encoded in fixed notation, which it decodes again. */
export const Color = Schema.String.pipe(
  Schema.decodeTo(
    Components,
    SchemaTransformation.transformEffect({
      decode: (color, options) => {
        const match =
          /^oklch\(\s*(\d*\.?\d+)(%?)\s+(\d*\.?\d+)(%?)\s+(-?\d*\.?\d+)(?:deg)?\s*(?:\/\s*(\d*\.?\d+)(%?)\s*)?\)$/.exec(
            color,
          );
        if (match === null) {
          return Effect.fail(
            new SchemaIssue.InvalidValue(
              {
                message:
                  'Expected a color written in oklch() as CSS Color 4 writes it, such as oklch(64% 0.17 147)',
              },
              color,
              options,
            ),
          );
        }
        const [, lightness, lightnessPercent, chroma, chromaPercent, hue, alpha, alphaPercent] =
          match;
        return Effect.succeed({
          lightness: Math.min(Number(lightness) / (lightnessPercent === '%' ? 100 : 1), 1),
          chroma:
            (Number(chroma) * (chromaPercent === '%' ? fullChroma : 1)) /
            (chromaPercent === '%' ? 100 : 1),
          hue: Number(hue),
          alpha:
            alpha === undefined ? 1 : Math.min(Number(alpha) / (alphaPercent === '%' ? 100 : 1), 1),
        });
      },
      encode: (color) =>
        Effect.succeed(
          `oklch(${color.lightness.toFixed(16).replace(/\.?0+$/, '')} ${color.chroma.toFixed(16).replace(/\.?0+$/, '')} ${color.hue.toFixed(16).replace(/\.?0+$/, '')} / ${color.alpha.toFixed(16).replace(/\.?0+$/, '')})`,
        ),
    }),
  ),
);

/** A color with its lightness, chroma, hue in degrees and alpha, opaque and within sRGB. */
export type Color = typeof Color.Type;

/** The relative luminance of a color as WCAG 2.2 defines it, its linear sRGB channels weighted and held within their range. */
const relativeLuminance = (color: Color): number =>
  luminanceOf(linearSrgbOf(color.lightness, color.chroma, color.hue));

/** The contrast ratio of two colors as WCAG 2.2 defines it, the lighter over the darker with the flare added to both. */
const contrastRatio = (text: Color, background: Color): number =>
  (Math.max(relativeLuminance(text), relativeLuminance(background)) + contrastFlare) /
  (Math.min(relativeLuminance(text), relativeLuminance(background)) + contrastFlare);

/** A schema of the colors of a piece of text and its background. */
const Colors = Schema.Struct({
  /** The color of the text. */
  text: Color,
  /** The color of the background. */
  background: Color,
});

/** The contrast ratio of text over its background as WCAG 2.2 defines it, or a failure naming the color that WCAG 2.2 gives no contrast. */
export const contrast = (text: string, background: string): Exit.Exit<number, Schema.SchemaError> =>
  Exit.map(Schema.decodeExit(Colors)({ text, background }, { errors: 'all' }), (colors) =>
    contrastRatio(colors.text, colors.background),
  );

/** The contrast ratio a piece of text needs as WCAG 2.2 Contrast (Enhanced) sets it, from its size at the minimum viewport width, its smallest, and its font weight. */
const requiredContrast = (step: Typography.Step, fontWeight: number): number =>
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
    readonly step: Typography.Step;
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
  /** The step of the type scale the text is set in. */
  step: Typography.Step,
  /** The font weight of the text. */
  fontWeight: FontWeight,
  /** A contrast ratio stricter than the standards that the project may ask for. */
  minimumContrast: Schema.optional(MinimumContrast),
}).pipe(Schema.check(isAtLeastRequiredContrast));

/** The colors of a piece of text and its background, the step of the type scale it is set in, its font weight, and a contrast ratio stricter than the standards that the project may ask for, as they are written. */
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

/** The contrast ratio of a pair; or a failure with the reason when the input is not valid, or a contrast shortfall when the pair falls short of what WCAG 2.2 Contrast (Enhanced) requires for its text, or of the stricter ratio the project asks for. */
export const verify = (pair: Pair): Exit.Exit<number, Schema.SchemaError | ContrastShortfall> =>
  Exit.match(Schema.decodeExit(Pair)(pair, { errors: 'all' }), {
    onFailure: Exit.failCause,
    onSuccess: (colors) => {
      const target = colors.minimumContrast ?? requiredContrast(colors.step, colors.fontWeight);
      // The largest contrast the exact colors may have, so that a pair is refused only when rounding cannot account for its shortfall. Raised by sixteen unit roundoffs, more than the flare and the six roundings of this quotient can take from it.
      return ((Math.max(
        relativeLuminance(colors.text) + luminanceError(colors.text),
        relativeLuminance(colors.background) + luminanceError(colors.background),
      ) +
        contrastFlare) /
        (Math.max(
          Math.min(
            relativeLuminance(colors.text) - luminanceError(colors.text),
            relativeLuminance(colors.background) - luminanceError(colors.background),
          ),
          0,
        ) +
          contrastFlare)) *
        (1 + 16 * unitRoundoff) >=
        target
        ? Exit.succeed(contrastRatio(colors.text, colors.background))
        : Exit.fail(
            new ContrastShortfall({
              contrast: contrastRatio(colors.text, colors.background),
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
  /** The step of the type scale the text is set in. */
  step: Typography.Step,
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

/** The lightness, chroma and hue in degrees of the shade of a brand color closest to it by deltaEOK that reaches the contrast ratio against the background: its hue kept, and its chroma kept or, where sRGB cannot hold it at that lightness, reduced at constant lightness and hue to the edge of sRGB, the reduction every gamut mapping algorithm of CSS Color 4 aims at, reached exactly so that the lightness and hue the contrast rests on stay exact; or none when no shade reaches it. */
const closestShade = (
  color: Color,
  background: Color,
  target: number,
): readonly [number, number, number] | undefined => {
  const { lightness, chroma, hue } = color;
  const chromaAt = (shade: number): number =>
    // Reduced strictly within sRGB, so that the shade stays within it once written and read again.
    isInGamut(linearSrgbOf(shade, chroma, hue), 0)
      ? chroma
      : boundary((reduced) => isInGamut(linearSrgbOf(shade, reduced, hue), 0), 0, chroma);
  const luminanceAt = (shade: number): number =>
    luminanceOf(linearSrgbOf(shade, chromaAt(shade), hue));
  const backgroundLuminance = relativeLuminance(background);
  const reaches = (shade: number): boolean =>
    (Math.max(luminanceAt(shade), backgroundLuminance) + contrastFlare) /
      (Math.min(luminanceAt(shade), backgroundLuminance) + contrastFlare) >=
    target;
  // Luminance rises with lightness, so contrast falls toward the lightness of the background from either side.
  const backgroundLightness = boundary((shade) => luminanceAt(shade) <= backgroundLuminance, 0, 1);
  const darkEnd = Math.min(lightness, backgroundLightness);
  const lightStart = Math.max(lightness, backgroundLightness);
  const darker = reaches(darkEnd)
    ? darkEnd
    : reaches(0)
      ? boundary(reaches, 0, darkEnd)
      : undefined;
  const lighter = reaches(lightStart)
    ? lightStart
    : reaches(1)
      ? boundary(reaches, 1, lightStart)
      : undefined;
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
 * The shade of a brand color, written in oklch(), that is closest to it by deltaEOK, the color difference CSS Color 4 defines, and reaches the contrast WCAG 2.2 Contrast (Enhanced) requires for its text against the background, or the stricter ratio the project asks for; or a failure with the reason when the input is not valid, or no legible shade when no shade within sRGB reaches it. Its hue is kept and its chroma is reduced only where sRGB cannot hold it, at constant lightness and hue as CSS Color 4 gamut mapping aims to reduce it.
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
            `oklch(${closest[0].toFixed(16).replace(/\.?0+$/, '')} ${closest[1].toFixed(16).replace(/\.?0+$/, '')} ${closest[2]})`,
          );
    },
  });
