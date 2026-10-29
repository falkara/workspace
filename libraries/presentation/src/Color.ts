import { Exit, Schema } from 'effect';

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
export const largeTextPointSize = 18;

/**
 * The font size from which WCAG 2.2 counts bold text as large-scale. Measured in CSS points.
 *
 * @see https://www.w3.org/TR/WCAG22/#dfn-large-scale
 */
export const largeBoldTextPointSize = 14;

/** The font size from which text is large-scale, the large text point size in CSS points. Measured in CSS pixels. */
export const largeTextSize = Fraction.multiply(
  Fraction.make(BigInt(largeTextPointSize), 1n),
  Length.point,
);

/** The font size from which bold text is large-scale, the large bold text point size in CSS points. Measured in CSS pixels. */
export const largeBoldTextSize = Fraction.multiply(
  Fraction.make(BigInt(largeBoldTextPointSize), 1n),
  Length.point,
);

/**
 * The number of steps between the darkest and the lightest level of an 8-bit sRGB channel.
 *
 * @see https://www.w3.org/TR/css-color-4/#hex-notation
 */
export const channelSteps = 255;

/** The distance a gamma-encoded sRGB channel may lie outside its range and still count as inside, half a step of an 8-bit channel, which no display can show. */
export const gamutTolerance = 1 / (2 * channelSteps);

/**
 * The matrix from Oklab to the LMS cone responses that CSS Color 4 converts through.
 *
 * @see https://www.w3.org/TR/css-color-4/#color-conversion-code
 */
export const oklabToLms: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0.3963377773761749, 0.2158037573099136],
  [1, -0.1055613458156586, -0.0638541728258133],
  [1, -0.0894841775298119, -1.2914855480194092],
];

/**
 * The matrix from LMS cone responses to CIE XYZ with the D65 white point that CSS Color 4 converts through.
 *
 * @see https://www.w3.org/TR/css-color-4/#color-conversion-code
 */
export const lmsToXyz: ReadonlyArray<readonly [number, number, number]> = [
  [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
  [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
  [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816],
];

/**
 * The matrix from CIE XYZ with the D65 white point to linear sRGB that CSS Color 4 converts through.
 *
 * @see https://www.w3.org/TR/css-color-4/#color-conversion-code
 */
export const xyzToLinearSrgb: ReadonlyArray<readonly [number, number, number]> = [
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
export const luminanceWeights: readonly [number, number, number] = [0.2126, 0.7152, 0.0722];

/**
 * The flare WCAG 2.2 adds to both relative luminances of a contrast ratio.
 *
 * @see https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
 */
export const contrastFlare = 1 / 20;

/** The floating-point operations on the longest path from an oklch() color to a contrast ratio, rounded up to a power of two: reading the color, three matrices, the cube, the weighting and the ratio, each of which rounds its result by at most the machine epsilon of JavaScript numbers. */
export const conversionOperations = 32;

/** The relative error that rounding may leave in a computed contrast ratio, so that a pair exactly at a threshold is not refused for an error of the computation. */
export const contrastTolerance = conversionOperations * Number.EPSILON;

/** The lightness, chroma and hue in degrees of an oklch() color as CSS Color 4 writes it, or none when it is written otherwise. */
const components = (color: string): readonly [number, number, number] | undefined => {
  const match = /^oklch\(\s*(\d*\.?\d+)(%?)\s+(\d*\.?\d+)(%?)\s+(-?\d*\.?\d+)(?:deg)?\s*\)$/.exec(
    color,
  );
  if (match === null) {
    return undefined;
  }
  const [, lightness, lightnessPercent, chroma, chromaPercent, hue] = match;
  return [
    Number(lightness) / (lightnessPercent === '%' ? 100 : 1),
    (Number(chroma) * (chromaPercent === '%' ? fullChroma : 1)) / (chromaPercent === '%' ? 100 : 1),
    Number(hue),
  ];
};

/** The linear sRGB channels of a color of the given lightness, chroma and hue in degrees, converted as CSS Color 4 does. */
const linearSrgbOf = (lightness: number, chroma: number, hue: number): ReadonlyArray<number> => {
  const h = (hue * Math.PI) / 180;
  const lab = [lightness, chroma * Math.cos(h), chroma * Math.sin(h)];
  const lms = oklabToLms.map(
    (row) => (row[0] * lab[0]! + row[1] * lab[1]! + row[2] * lab[2]!) ** 3,
  );
  const xyz = lmsToXyz.map((row) => row[0] * lms[0]! + row[1] * lms[1]! + row[2] * lms[2]!);
  return xyzToLinearSrgb.map((row) => row[0] * xyz[0]! + row[1] * xyz[1]! + row[2] * xyz[2]!);
};

/** The linear sRGB channels of an oklch() color as CSS Color 4 writes it, or none when it is written otherwise. */
const linearSrgb = (color: string): ReadonlyArray<number> | undefined => {
  const parts = components(color);
  return parts === undefined ? undefined : linearSrgbOf(...parts);
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

/** A schema of a color written in oklch() as CSS Color 4 writes it, opaque and within sRGB, where WCAG 2.2 defines contrast. */
export const Color = Schema.String.pipe(
  Schema.check(
    Schema.makeFilter((color) => {
      if (color.includes('/')) {
        return 'Expected an opaque color, as WCAG 2.2 defines no contrast for a translucent one';
      }
      const channels = linearSrgb(color);
      if (channels === undefined) {
        return 'Expected a color written in oklch() as CSS Color 4 writes it, such as oklch(64% 0.17 147)';
      }
      return (
        isInGamut(channels, gamutTolerance) ||
        'Expected a color within sRGB, as WCAG 2.2 defines contrast only there'
      );
    }),
  ),
);

/** The relative luminance of a valid color as WCAG 2.2 defines it, its linear sRGB channels weighted and held within their range. */
const relativeLuminance = (color: string): number =>
  (linearSrgb(color) ?? [0, 0, 0]).reduce(
    (luminance, channel, index) =>
      luminance + (luminanceWeights[index] ?? 0) * Math.min(Math.max(channel, 0), 1),
    0,
  );

/** The contrast ratio of two valid colors as WCAG 2.2 defines it, the lighter over the darker with the flare added to both. */
const contrastRatio = (text: string, background: string): number =>
  (Math.max(relativeLuminance(text), relativeLuminance(background)) + contrastFlare) /
  (Math.min(relativeLuminance(text), relativeLuminance(background)) + contrastFlare);

/** The contrast ratio of text over its background as WCAG 2.2 defines it, or a failure naming the color that WCAG 2.2 gives no contrast. */
export const contrast = (text: string, background: string): Exit.Exit<number, Schema.SchemaError> =>
  Exit.map(
    Schema.decodeExit(Schema.Struct({ text: Color, background: Color }))(
      { text, background },
      { errors: 'all' },
    ),
    (colors) => contrastRatio(colors.text, colors.background),
  );

/** The colors of a piece of text and its background, the step of the type scale it is set in, its font weight, and a contrast ratio stricter than the standards that the project may ask for. */
export interface Pair {
  readonly text: string;
  readonly background: string;
  readonly step: Typography.Step;
  readonly fontWeight: number;
  readonly minimumContrast?: number | undefined;
}

/** The contrast ratio a piece of text needs as WCAG 2.2 Contrast (Enhanced) sets it, from its size at the minimum viewport width, its smallest, and its font weight. */
const requiredContrast = (step: Typography.Step, fontWeight: number): number =>
  Fraction.isGreaterThanOrEqualTo(step.minimumSize, largeTextSize) ||
  (fontWeight >= Typography.boldFontWeight &&
    Fraction.isGreaterThanOrEqualTo(step.minimumSize, largeBoldTextSize))
    ? largeTextEnhancedContrastRatio
    : enhancedContrastRatio;

/** The contrast ratio of a pair, or a failure with the reason when it falls short of what WCAG 2.2 Contrast (Enhanced) requires for its text, or of the stricter ratio the project asks for. */
export const verify = (pair: Pair): Exit.Exit<number, Schema.SchemaError> =>
  Exit.map(
    Schema.decodeExit(
      Schema.Struct({
        text: Color,
        background: Color,
        fontWeight: Schema.Finite.pipe(
          Schema.check(
            Schema.isBetween(
              { minimum: Typography.minimumFontWeight, maximum: Typography.maximumFontWeight },
              {
                message: `Expected a font weight from ${Typography.minimumFontWeight} to ${Typography.maximumFontWeight}, as CSS Fonts allows`,
              },
            ),
          ),
        ),
        minimumContrast: Schema.optional(Schema.Finite),
      }).pipe(
        Schema.check(
          Schema.makeFilter((colors) => {
            const required = requiredContrast(pair.step, colors.fontWeight);
            const size =
              Math.round(Fraction.toNumber(pair.step.minimumSize) * 10 ** Fluid.decimalPlaces) /
              10 ** Fluid.decimalPlaces;
            if (colors.minimumContrast !== undefined && colors.minimumContrast < required) {
              return {
                path: ['minimumContrast'],
                issue: `Expected a minimum contrast of at least ${required}:1, the ratio WCAG 2.2 Contrast (Enhanced) requires for text of ${size} px at weight ${colors.fontWeight}`,
              };
            }
            const target = colors.minimumContrast ?? required;
            return (
              contrastRatio(colors.text, colors.background) >= target * (1 - contrastTolerance) || {
                path: ['text'],
                issue:
                  colors.minimumContrast === undefined
                    ? `Expected a contrast of at least ${target}:1 for text of ${size} px at weight ${colors.fontWeight}, as WCAG 2.2 Contrast (Enhanced) requires`
                    : `Expected a contrast of at least ${target}:1, the ratio the project asks for`,
              }
            );
          }),
        ),
      ),
    )(
      {
        text: pair.text,
        background: pair.background,
        fontWeight: pair.fontWeight,
        minimumContrast: pair.minimumContrast,
      },
      { errors: 'all' },
    ),
    (colors) => contrastRatio(colors.text, colors.background),
  );

/** A color of a brand, the background of text set in it, the step of the type scale the text is set in, its font weight, and a contrast ratio stricter than the standards that the project may ask for. */
export interface Brand {
  readonly color: string;
  readonly background: string;
  readonly step: Typography.Step;
  readonly fontWeight: number;
  readonly minimumContrast?: number | undefined;
}

/** The value next to which a condition stops holding, halving the interval from where it holds to where it does not until no JavaScript number lies between. */
const boundary = (holds: (value: number) => boolean, inside: number, outside: number): number =>
  (inside + outside) / 2 === inside || (inside + outside) / 2 === outside
    ? inside
    : holds((inside + outside) / 2)
      ? boundary(holds, (inside + outside) / 2, outside)
      : boundary(holds, inside, (inside + outside) / 2);

/** The lightness, chroma and hue in degrees of the shade of a brand color closest to it in lightness that reaches the contrast ratio against the background: its hue kept, and its chroma kept or, where sRGB cannot hold it at that lightness, reduced as CSS Color 4 gamut mapping reduces it; or none when no shade reaches it. */
const closestShade = (
  color: string,
  background: string,
  target: number,
): readonly [number, number, number] | undefined => {
  const [lightness, chroma, hue] = components(color) ?? [0, 0, 0];
  const chromaAt = (shade: number): number =>
    // Reduced strictly within sRGB, so that the shade stays within it once written and read again.
    isInGamut(linearSrgbOf(shade, chroma, hue), 0)
      ? chroma
      : boundary((reduced) => isInGamut(linearSrgbOf(shade, reduced, hue), 0), 0, chroma);
  const luminanceAt = (shade: number): number =>
    linearSrgbOf(shade, chromaAt(shade), hue).reduce(
      (luminance, channel, index) =>
        luminance + (luminanceWeights[index] ?? 0) * Math.min(Math.max(channel, 0), 1),
      0,
    );
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
  const closest =
    darker === undefined
      ? lighter
      : lighter === undefined || lightness - darker <= lighter - lightness
        ? darker
        : lighter;
  return closest === undefined ? undefined : [closest, chromaAt(closest), hue];
};

/** The shade of a brand color, written in oklch(), that is closest to it in lightness and reaches the contrast WCAG 2.2 Contrast (Enhanced) requires for its text against the background, or the stricter ratio the project asks for; or a failure with the reason when no shade within sRGB reaches it. */
export const shade = (brand: Brand): Exit.Exit<string, Schema.SchemaError> =>
  Exit.map(
    Schema.decodeExit(
      Schema.Struct({
        color: Color,
        background: Color,
        fontWeight: Schema.Finite.pipe(
          Schema.check(
            Schema.isBetween(
              { minimum: Typography.minimumFontWeight, maximum: Typography.maximumFontWeight },
              {
                message: `Expected a font weight from ${Typography.minimumFontWeight} to ${Typography.maximumFontWeight}, as CSS Fonts allows`,
              },
            ),
          ),
        ),
        minimumContrast: Schema.optional(Schema.Finite),
      }).pipe(
        Schema.check(
          Schema.makeFilter((colors) => {
            const required = requiredContrast(brand.step, colors.fontWeight);
            const size =
              Math.round(Fraction.toNumber(brand.step.minimumSize) * 10 ** Fluid.decimalPlaces) /
              10 ** Fluid.decimalPlaces;
            if (colors.minimumContrast !== undefined && colors.minimumContrast < required) {
              return {
                path: ['minimumContrast'],
                issue: `Expected a minimum contrast of at least ${required}:1, the ratio WCAG 2.2 Contrast (Enhanced) requires for text of ${size} px at weight ${colors.fontWeight}`,
              };
            }
            const target = colors.minimumContrast ?? required;
            return (
              closestShade(colors.color, colors.background, target) !== undefined || {
                path: ['background'],
                issue: `Expected a background against which a shade of the color within sRGB reaches ${target}:1, the contrast ${colors.minimumContrast === undefined ? `WCAG 2.2 Contrast (Enhanced) requires for text of ${size} px at weight ${colors.fontWeight}` : 'the project asks for'}`,
              }
            );
          }),
        ),
      ),
    )(
      {
        color: brand.color,
        background: brand.background,
        fontWeight: brand.fontWeight,
        minimumContrast: brand.minimumContrast,
      },
      { errors: 'all' },
    ),
    (colors) => {
      const [lightness, chroma, hue] = closestShade(
        colors.color,
        colors.background,
        colors.minimumContrast ?? requiredContrast(brand.step, colors.fontWeight),
      ) ?? [0, 0, 0];
      // Written in fixed notation, which CSS reads, rather than the exponent JavaScript uses for small numbers, without trailing zeros.
      return `oklch(${lightness.toFixed(16).replace(/\.?0+$/, '')} ${chroma.toFixed(16).replace(/\.?0+$/, '')} ${hue})`;
    },
  );
