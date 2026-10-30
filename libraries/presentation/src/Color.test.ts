import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Effect, Exit, Option, pipe, Schema, SchemaIssue } from 'effect';

import * as Color from '#src/Color';
import * as Fraction from '#src/Fraction';
import * as Typography from '#src/Typography';

/** The product of one of the matrices of Color and a vector, each row summed from left to right as CSS Color 4 sums it. */
const transform = (
  [first, second, third]: typeof Color.oklabToLms,
  [x, y, z]: readonly [number, number, number],
): readonly [number, number, number] => [
  first[0] * x + first[1] * y + first[2] * z,
  second[0] * x + second[1] * y + second[2] * z,
  third[0] * x + third[1] * y + third[2] * z,
];

/** A rational number, a numerator over a positive denominator, both big integers, so that the conversion of CSS Color 4 is followed without rounding. */
type Rational = readonly [bigint, bigint];

/** The number JavaScript holds, exactly as the rational its bits encode. */
const rational = (value: number): Rational => {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value);
  const bits = view.getBigUint64(0);
  const sign = bits >> 63n === 0n ? 1n : -1n;
  const exponent = Number((bits >> 52n) & 0x7ffn);
  const fraction = bits & ((1n << 52n) - 1n);
  // A subnormal number has no hidden bit and the exponent of the smallest normal one.
  const significand = exponent === 0 ? fraction : fraction | (1n << 52n);
  const power = (exponent === 0 ? 1 : exponent) - 1075;
  return power >= 0
    ? [sign * (significand << BigInt(power)), 1n]
    : [sign * significand, 1n << BigInt(-power)];
};

/** The sum of two rationals. */
const plus = ([a, b]: Rational, [c, d]: Rational): Rational => [a * d + c * b, b * d];

/** The product of two rationals. */
const times = ([a, b]: Rational, [c, d]: Rational): Rational => [a * c, b * d];

/** Whether the first rational is smaller than the second. */
const isBelow = ([a, b]: Rational, [c, d]: Rational): boolean => a * d < c * b;

/** The product of one of the matrices of Color and a vector of rationals, without rounding. */
const exactTransform = (
  [first, second, third]: typeof Color.oklabToLms,
  [x, y, z]: readonly [Rational, Rational, Rational],
): readonly [Rational, Rational, Rational] => [
  plus(
    plus(times(rational(first[0]), x), times(rational(first[1]), y)),
    times(rational(first[2]), z),
  ),
  plus(
    plus(times(rational(second[0]), x), times(rational(second[1]), y)),
    times(rational(second[2]), z),
  ),
  plus(
    plus(times(rational(third[0]), x), times(rational(third[1]), y)),
    times(rational(third[2]), z),
  ),
];

/** A rational held within the range of a channel, from 0 to 1. */
const held = (value: Rational): Rational =>
  isBelow(value, [0n, 1n]) ? [0n, 1n] : isBelow([1n, 1n], value) ? [1n, 1n] : value;

/** The relative luminance of a color of the given lightness and chroma at a hue of 0, whose cosine and sine are 1 and 0 exactly, converted by the matrices of CSS Color 4 as they are written, without rounding. */
const exactLuminance = (lightness: number, chroma: number): Rational => {
  const [long, medium, short] = exactTransform(Color.oklabToLms, [
    rational(lightness),
    rational(chroma),
    [0n, 1n],
  ]);
  const [red, green, blue] = exactTransform(
    Color.xyzToLinearSrgb,
    exactTransform(Color.lmsToXyz, [
      times(times(long, long), long),
      times(times(medium, medium), medium),
      times(times(short, short), short),
    ]),
  );
  return plus(
    plus(
      times(rational(Color.luminanceWeights[0]), held(red)),
      times(rational(Color.luminanceWeights[1]), held(green)),
    ),
    times(rational(Color.luminanceWeights[2]), held(blue)),
  );
};

/** The contrast ratio of two relative luminances as WCAG 2.2 defines it, without rounding. */
const exactContrast = (first: Rational, second: Rational): Rational => {
  const [lighter, darker] = isBelow(first, second) ? [second, first] : [first, second];
  const [numerator, denominator] = plus(lighter, rational(Color.contrastFlare));
  const [darkNumerator, darkDenominator] = plus(darker, rational(Color.contrastFlare));
  return [numerator * darkDenominator, denominator * darkNumerator];
};

/** The largest number JavaScript holds that is at most the given positive rational, so that a ratio taken from it is one the exact colors meet. */
const numberBelow = (value: Rational): number => {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, Number((value[0] * 10n ** 30n) / value[1]) / 1e30);
  // Stepping down by one unit in the last place until the number no longer lies above the rational.
  while (isBelow(value, rational(view.getFloat64(0)))) {
    view.setBigUint64(0, view.getBigUint64(0) - 1n);
  }
  return view.getFloat64(0);
};

describe('enhancedContrastRatio', () => {
  it('is the contrast WCAG 2.2 Contrast (Enhanced) requires for text', () => {
    expect(Color.enhancedContrastRatio).toBe(7);
  });
});

describe('largeTextEnhancedContrastRatio', () => {
  it('is the contrast WCAG 2.2 Contrast (Enhanced) requires for large-scale text', () => {
    expect(Color.largeTextEnhancedContrastRatio).toBe(9 / 2);
  });
});

describe('largeTextPointSize', () => {
  it('is the size from which WCAG 2.2 counts text as large-scale', () => {
    expect(Color.largeTextPointSize).toEqual({ numerator: 18n, denominator: 1n });
  });
});

describe('largeBoldTextPointSize', () => {
  it('is the size from which WCAG 2.2 counts bold text as large-scale', () => {
    expect(Color.largeBoldTextPointSize).toEqual({ numerator: 14n, denominator: 1n });
  });
});

describe('largeTextSize', () => {
  it('is a valid fraction', () => {
    expect(Schema.is(Fraction.Fraction)(Color.largeTextSize)).toBe(true);
  });

  it('is 24 CSS pixels', () => {
    expect(Color.largeTextSize).toEqual({ numerator: 24n, denominator: 1n });
  });
});

describe('largeBoldTextSize', () => {
  it('is a valid fraction', () => {
    expect(Schema.is(Fraction.Fraction)(Color.largeBoldTextSize)).toBe(true);
  });

  it('is 56/3 CSS pixels', () => {
    expect(Color.largeBoldTextSize).toEqual({ numerator: 56n, denominator: 3n });
  });
});

describe('channelSteps', () => {
  it('is the number of steps of an 8-bit sRGB channel', () => {
    expect(Color.channelSteps).toBe(255);
  });
});

describe('gamutTolerance', () => {
  it('is half a step of an 8-bit sRGB channel', () => {
    expect(Color.gamutTolerance * 2 * Color.channelSteps).toBe(1);
  });
});

describe('fullChroma', () => {
  it('is the chroma CSS Color 4 sets as 100 % in oklch()', () => {
    expect(Color.fullChroma).toBe(2 / 5);
  });
});

describe('halfTurns', () => {
  it('are the half turns of the units of angle CSS Values 4 defines but the radian', () => {
    expect(Color.halfTurns).toEqual({ deg: 180, grad: 200, turn: 1 / 2 });
  });
});

describe('luminanceWeights', () => {
  it('are the weights of the linear sRGB channels in WCAG 2.2 relative luminance', () => {
    expect(Color.luminanceWeights).toEqual([0.2126, 0.7152, 0.0722]);
  });

  it('add up to 1, so that white has a relative luminance of 1', () => {
    expect(Color.luminanceWeights.reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(1, 12);
  });
});

describe('contrastFlare', () => {
  it('is the flare WCAG 2.2 adds to both relative luminances of a contrast ratio', () => {
    expect(Color.contrastFlare).toBe(1 / 20);
  });
});

describe('maximumContrastRatio', () => {
  it('is 21, the contrast of black against white', () => {
    expect(Color.maximumContrastRatio).toBe(21);
  });
});

describe('transferThreshold', () => {
  it('is where the sRGB transfer function stops being linear', () => {
    expect(Color.transferThreshold).toBe(0.0031308);
  });
});

describe('transferSlope', () => {
  it('is the slope of the linear part of the sRGB transfer function', () => {
    expect(Color.transferSlope).toBe(12.92);
  });
});

describe('transferGamma', () => {
  it('is the exponent of the curved part of the sRGB transfer function', () => {
    expect(Color.transferGamma).toBe(2.4);
  });
});

describe('transferOffset', () => {
  it('is the offset of the curved part of the sRGB transfer function', () => {
    expect(Color.transferOffset).toBe(0.055);
  });
});

describe('oklabToLms, lmsToXyz and xyzToLinearSrgb', () => {
  it('turn the white of Oklab into the white of sRGB', () => {
    const [long, medium, short] = transform(Color.oklabToLms, [1, 0, 0]);
    const srgb = transform(
      Color.xyzToLinearSrgb,
      transform(Color.lmsToXyz, [long ** 3, medium ** 3, short ** 3]),
    );

    for (const channel of srgb) {
      expect(channel).toBeCloseTo(1, 6);
    }
  });
});

describe('unitRoundoff', () => {
  it('is half the machine epsilon', () => {
    expect(Color.unitRoundoff).toBe(2 ** -53);
  });

  it('is the largest relative error of rounding to the nearest number', () => {
    expect(1 + Color.unitRoundoff).toBe(1);
    expect(1 + Color.unitRoundoff * (1 + Number.EPSILON)).toBeGreaterThan(1);
  });
});

describe('Color', () => {
  it('accepts an oklch() color within sRGB', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(64% 0.17 147)');

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('accepts lightness and chroma written as numbers and a hue written in degrees', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(0.64 0.17 147deg)');

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('decodes a color into its components, its percentages read as CSS Color 4 reads them', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(64% 25% 147)');

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual({
      lightness: 0.64,
      chroma: 0.1,
      hue: 147,
      hueUnit: 'deg',
      alpha: 1,
    });
  });

  it('clamps the lightness and the alpha to their range as CSS Color 4 clamps them', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(150% 0 0 / 1.5)');

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual({
      lightness: 1,
      chroma: 0,
      hue: 0,
      hueUnit: 'deg',
      alpha: 1,
    });
  });

  it('encodes a color as JavaScript writes each number, which it decodes again into the same components', () => {
    const decoded = Schema.decodeExit(Color.Color)('oklch(50% 0.0000001 1.5rad)');
    const encoded = Exit.isSuccess(decoded)
      ? Schema.encodeExit(Color.Color)(decoded.value)
      : undefined;
    const redecoded =
      encoded !== undefined && Exit.isSuccess(encoded)
        ? Schema.decodeExit(Color.Color)(encoded.value)
        : undefined;

    expect(encoded !== undefined && Exit.isSuccess(encoded) ? encoded.value : undefined).toBe(
      'oklch(0.5 1e-7 1.5rad / 1)',
    );
    expect(
      redecoded !== undefined && Exit.isSuccess(redecoded) ? redecoded.value : undefined,
    ).toEqual(Exit.isSuccess(decoded) ? decoded.value : undefined);
  });

  it('reads the name of the function in any case, as CSS reads it', () => {
    const exit = Schema.decodeExit(Color.Color)('OKLCH(64% 0.17 147DEG)');

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual({
      lightness: 0.64,
      chroma: 0.17,
      hue: 147,
      hueUnit: 'deg',
      alpha: 1,
    });
  });

  it('reads a sign and an exponent as CSS Syntax reads a number', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(+6.4e1% 1.7E-1 +147 / 1e0)');

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual({
      lightness: 0.64,
      chroma: 0.17,
      hue: 147,
      hueUnit: 'deg',
      alpha: 1,
    });
  });

  it('reads none as 0, as CSS Color 4 reads a missing component', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(none none none)');

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual({
      lightness: 0,
      chroma: 0,
      hue: 0,
      hueUnit: 'deg',
      alpha: 1,
    });
  });

  it('clamps a negative lightness and chroma to 0, as CSS Color 4 does', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(-10% -0.1 20)');

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual({
      lightness: 0,
      chroma: 0,
      hue: 20,
      hueUnit: 'deg',
      alpha: 1,
    });
  });

  it('clamps a negative alpha and an alpha of none to 0, which leaves the color translucent', () => {
    for (const color of ['oklch(50% 0 0 / -1)', 'oklch(50% 0 0 / none)']) {
      const exit = Schema.decodeExit(Color.Color)(color);

      expect(
        SchemaIssue.makeFormatterStandardSchemaV1()(
          Option.getOrThrow(Exit.findErrorOption(exit)).issue,
        ).issues,
      ).toEqual([
        {
          path: [],
          message:
            'Expected an opaque color, as WCAG 2.2 defines no contrast for a translucent one',
        },
      ]);
    }
  });

  it('reads a hue in every unit of angle CSS Values 4 defines, each the same angle', () => {
    const reference = Color.contrast('oklch(70% 0.1 180)', 'oklch(100% 0 0)');

    expect(Exit.isSuccess(reference)).toBe(true);
    for (const hue of ['180deg', '200grad', '0.5turn', `${Math.PI}rad`]) {
      const exit = Color.contrast(`oklch(70% 0.1 ${hue})`, 'oklch(100% 0 0)');

      expect(Exit.isSuccess(exit) ? exit.value : undefined).toBeCloseTo(
        Exit.isSuccess(reference) ? reference.value : 0,
        12,
      );
    }
  });

  it('rejects a color written otherwise', () => {
    const exit = Schema.decodeExit(Color.Color)('#ffffff');

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: [],
        message:
          'Expected a color written in oklch() as CSS Color 4 writes it, such as oklch(64% 0.17 147), with no math function or relative color',
      },
    ]);
  });

  it('accepts an opaque alpha', () => {
    for (const color of ['oklch(50% 0 0 / 1)', 'oklch(50% 0 0 / 100%)', 'oklch(50% 0 0 / 1.5)']) {
      expect(Exit.isSuccess(Schema.decodeExit(Color.Color)(color))).toBe(true);
    }
  });

  it('rejects a translucent color', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(50% 0 0 / 50%)');

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: [],
        message: 'Expected an opaque color, as WCAG 2.2 defines no contrast for a translucent one',
      },
    ]);
  });

  it('rejects a color outside sRGB', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(70% 0.35 147)');

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: [],
        message: 'Expected a color within sRGB, as WCAG 2.2 defines contrast only there',
      },
    ]);
  });
});

describe('contrast', () => {
  it('clamps a lightness above 100 % to white, as CSS Color 4 does', () => {
    expect(Color.contrast('oklch(120% 0 0)', 'oklch(0% 0 0)')).toEqual(
      Color.contrast('oklch(100% 0 0)', 'oklch(0% 0 0)'),
    );
  });

  it('reduces the hue to one turn, so that a large hue keeps its precision', () => {
    expect(Color.contrast('oklch(50% 0.1 360000000000030)', 'oklch(100% 0 0)')).toEqual(
      Color.contrast('oklch(50% 0.1 30)', 'oklch(100% 0 0)'),
    );
  });

  it('is 21 for black on white', () => {
    const exit = Color.contrast('oklch(0% 0 0)', 'oklch(100% 0 0)');

    expect(Exit.isSuccess(exit) ? exit.value : 0).toBeCloseTo(21, 12);
  });

  it('is 1 for a color on itself', () => {
    const exit = Color.contrast('oklch(64% 0.17 147)', 'oklch(64% 0.17 147)');

    expect(Exit.isSuccess(exit) ? exit.value : 0).toBe(1);
  });

  it('is 6 for the gray of half lightness on white, whose relative luminance is 1/8', () => {
    const exit = Color.contrast('oklch(50% 0 0)', 'oklch(100% 0 0)');

    expect(Exit.isSuccess(exit) ? exit.value : 0).toBeCloseTo(6, 12);
  });

  it('is the same whichever color is the text', () => {
    const forward = Color.contrast('oklch(64% 0.17 147)', 'oklch(100% 0 0)');
    const backward = Color.contrast('oklch(100% 0 0)', 'oklch(64% 0.17 147)');

    expect(Exit.isSuccess(forward) ? forward.value : 0).toBe(
      Exit.isSuccess(backward) ? backward.value : 1,
    );
  });

  it('reports every invalid color at once', () => {
    const exit = Color.contrast('#000000', 'oklch(70% 0.35 147)');

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['text'],
        message:
          'Expected a color written in oklch() as CSS Color 4 writes it, such as oklch(64% 0.17 147), with no math function or relative color',
      },
      {
        path: ['background'],
        message: 'Expected a color within sRGB, as WCAG 2.2 defines contrast only there',
      },
    ]);
  });
});

describe('reaches', () => {
  it('rests on the exact colors, by which white falls short of a relative luminance of 1', () => {
    const white = exactLuminance(1, 0);

    expect(isBelow(white, [1n, 1n])).toBe(true);
    expect(numberBelow(exactContrast(white, exactLuminance(0, 0)))).toBe(20.999999999999986);
  });

  it.prop(
    'reaches the exact contrast of every two grays',
    [
      Schema.Finite.check(Schema.isBetween({ minimum: 0, maximum: 1 })),
      Schema.Finite.check(Schema.isBetween({ minimum: 0, maximum: 1 })),
    ],
    ([textLightness, backgroundLightness]) => {
      const exit = Color.reaches(
        { text: `oklch(${textLightness} 0 0)`, background: `oklch(${backgroundLightness} 0 0)` },
        numberBelow(
          exactContrast(exactLuminance(textLightness, 0), exactLuminance(backgroundLightness, 0)),
        ),
      );

      expect(Exit.isSuccess(exit) ? exit.value : undefined).toBe(true);
    },
  );

  it.prop(
    'reaches the exact contrast of every two colors within sRGB at a hue of 0',
    [
      Schema.Finite.check(Schema.isBetween({ minimum: 0, maximum: 1 })),
      Schema.Finite.check(Schema.isBetween({ minimum: 0, maximum: 1 / 10 })),
      Schema.Finite.check(Schema.isBetween({ minimum: 0, maximum: 1 })),
      Schema.Finite.check(Schema.isBetween({ minimum: 0, maximum: 1 / 10 })),
    ],
    ([textLightness, textChroma, backgroundLightness, backgroundChroma]) => {
      const exit = Color.reaches(
        {
          text: `oklch(${textLightness} ${textChroma} 0)`,
          background: `oklch(${backgroundLightness} ${backgroundChroma} 0)`,
        },
        numberBelow(
          exactContrast(
            exactLuminance(textLightness, textChroma),
            exactLuminance(backgroundLightness, backgroundChroma),
          ),
        ),
      );

      // A color outside sRGB is refused before any contrast, so that only colors within it are held to it.
      expect(Exit.isFailure(exit) || exit.value).toBe(true);
    },
  );

  it('reaches a ratio the exact colors meet, though the ratio JavaScript computes lies below it', () => {
    const colors = { text: `oklch(${Math.cbrt(1 / 10)} 0 0)`, background: 'oklch(100% 0 0)' };
    const contrast = Color.contrast(colors.text, colors.background);
    const exit = Color.reaches(colors, 7);

    expect(Exit.isSuccess(contrast) ? contrast.value : undefined).toBeLessThan(7);
    expect(Exit.isSuccess(exit) ? exit.value : undefined).toBe(true);
  });

  it('reaches the largest contrast with black against white', () => {
    const exit = Color.reaches(
      { text: 'oklch(0% 0 0)', background: 'oklch(100% 0 0)' },
      Color.maximumContrastRatio,
    );

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toBe(true);
  });

  it('falls short of a ratio by more than rounding can account for', () => {
    const exit = Color.reaches({ text: 'oklch(50% 0 0)', background: 'oklch(100% 0 0)' }, 7);

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toBe(false);
  });

  it('decides as verify decides', () => {
    const step = {
      minimumSize: Fraction.makeUnsafe(16n, 1n),
      maximumSize: Fraction.makeUnsafe(20n, 1n),
    };

    for (const text of [
      'oklch(0% 0 0)',
      'oklch(40% 0 0)',
      'oklch(50% 0 0)',
      'oklch(45% 0.1 250)',
    ]) {
      const reached = Color.reaches({ text, background: 'oklch(100% 0 0)' }, 7);
      const verified = Color.verify({ text, background: 'oklch(100% 0 0)', step, fontWeight: 400 });

      expect(Exit.isSuccess(reached) ? reached.value : undefined).toBe(Exit.isSuccess(verified));
    }
  });

  it('takes the ratio alone too, as pipe calls it', () => {
    const exit = pipe({ text: 'oklch(0% 0 0)', background: 'oklch(100% 0 0)' }, Color.reaches(7));

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toBe(true);
  });

  it('rejects a ratio outside the range of the contrast WCAG 2.2 defines, with the reason', () => {
    const exit = Color.reaches({ text: 'oklch(0% 0 0)', background: 'oklch(100% 0 0)' }, 25);

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['ratio'],
        message:
          'Expected a contrast ratio from 1:1 to 21:1, the range of the contrast WCAG 2.2 defines',
      },
    ]);
  });
});

describe('Pair', () => {
  it('is written as the schema encodes it', () => {
    expectTypeOf<Color.Pair>().toEqualTypeOf<typeof Color.Pair.Encoded>();
  });

  it('decodes a pair whose contrast a project asks for is at least the one the standards require', () => {
    const exit = Schema.decodeExit(Color.Pair)({
      text: 'oklch(0% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
      minimumContrast: 10,
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a pair whose contrast a project asks for is looser than the standards', () => {
    const exit = Schema.decodeExit(Color.Pair)({
      text: 'oklch(0% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
      minimumContrast: 5,
    });

    expect(Exit.isFailure(exit)).toBe(true);
  });
});

describe('verify', () => {
  it('takes a step of a type scale as it is, its position aside', () => {
    const scale = Typography.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });
    const step = Exit.isSuccess(scale)
      ? scale.value.find((step) => step.position === 0)
      : undefined;

    expect(step).toBeDefined();
    expect(
      step !== undefined &&
        Exit.isSuccess(
          Color.verify({
            text: 'oklch(0% 0 0)',
            background: 'oklch(100% 0 0)',
            step,
            fontWeight: 400,
          }),
        ),
    ).toBe(true);
  });

  it('accepts a pair whose contrast meets what text of its size and weight needs', () => {
    const exit = Color.verify({
      text: 'oklch(0% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a pair below 7:1 for text smaller than large-scale text', () => {
    const exit = Color.verify({
      text: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
    });

    expect(Option.getOrThrow(Exit.findErrorOption(exit))).toMatchObject({
      _tag: 'ContrastShortfall',
      requiredContrast: 7,
      message:
        'Expected a contrast of at least 7:1 for text of 16 px at weight 400, as WCAG 2.2 Contrast (Enhanced) requires',
    });
  });

  it('reports the contrast of the colors with the shortfall', () => {
    const exit = Color.verify({
      text: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
    });
    const contrast = Color.contrast('oklch(50% 0 0)', 'oklch(100% 0 0)');

    expect(Option.getOrThrow(Exit.findErrorOption(exit))).toMatchObject({
      contrast: Exit.isSuccess(contrast) ? contrast.value : undefined,
    });
  });

  it.effect('lets a shortfall be caught by its tag, apart from a fault of the input', () =>
    Effect.gen(function* () {
      const requiredContrast = yield* Color.verify({
        text: 'oklch(50% 0 0)',
        background: 'oklch(100% 0 0)',
        step: {
          minimumSize: Fraction.makeUnsafe(16n, 1n),
          maximumSize: Fraction.makeUnsafe(20n, 1n),
        },
        fontWeight: 400,
      }).pipe(
        Effect.catchTag('ContrastShortfall', (error) => Effect.succeed(error.requiredContrast)),
      );

      expect(requiredContrast).toBe(7);
    }),
  );

  it('accepts 9/2 for text that is large-scale at its smallest', () => {
    const exit = Color.verify({
      text: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(24n, 1n),
        maximumSize: Fraction.makeUnsafe(30n, 1n),
      },
      fontWeight: 400,
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a step that shrinks, which would earn its text the ratio of large text', () => {
    const exit = Color.verify({
      text: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(24n, 1n),
        maximumSize: Fraction.makeUnsafe(12n, 1n),
      },
      fontWeight: 400,
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Option.filter(Exit.findErrorOption(exit), Schema.isSchemaError)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['step', 'maximumSize'],
        message:
          'Expected a maximum size of 24 px to 38.4 px, so that the step never shrinks below its size at the minimum viewport width and grows no faster than text that can be enlarged to 200 % within the 300 % page zoom of Safari, as WCAG 2.2 Resize Text requires',
      },
    ]);
  });

  it('asks for 7:1 when text is large-scale only on wider screens', () => {
    const exit = Color.verify({
      text: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(22n, 1n),
        maximumSize: Fraction.makeUnsafe(28n, 1n),
      },
      fontWeight: 400,
    });

    expect(Exit.isFailure(exit)).toBe(true);
  });

  it('accepts 9/2 for bold text of the large bold text size', () => {
    const exit = Color.verify({
      text: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(56n, 3n),
        maximumSize: Fraction.makeUnsafe(24n, 1n),
      },
      fontWeight: 700,
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('asks for 7:1 for text of the large bold text size below the bold font weight', () => {
    const exit = Color.verify({
      text: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(56n, 3n),
        maximumSize: Fraction.makeUnsafe(24n, 1n),
      },
      fontWeight: 600,
    });

    expect(Option.getOrThrow(Exit.findErrorOption(exit))).toMatchObject({
      _tag: 'ContrastShortfall',
      requiredContrast: 7,
      message:
        'Expected a contrast of at least 7:1 for text of 18.66667 px at weight 600, as WCAG 2.2 Contrast (Enhanced) requires',
    });
  });

  it('accepts a pair whose contrast is exactly 7:1', () => {
    const exit = Color.verify({
      text: `oklch(${Math.cbrt(1 / 10)} 0 0)`,
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('accepts a pair at the contrast its exact colors have, whatever rounding takes from it', () => {
    // 20.22204598486041814… at 60 significant digits from the matrices of CSS Color 4, where JavaScript computes 20.222045984860415.
    const exit = Color.verify({
      text: 'oklch(0.132707 0.067688 288.9246)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
      minimumContrast: 20.22204598486042,
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a pair that falls short by more than rounding can account for', () => {
    const exit = Color.verify({
      text: 'oklch(0.132707 0.067688 288.9246)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
      minimumContrast: 20.2220459849,
    });

    expect(Exit.isFailure(exit)).toBe(true);
  });

  it('rejects a pair just below 7:1', () => {
    const exit = Color.verify({
      text: 'oklch(0.4642 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
    });

    expect(Exit.isFailure(exit)).toBe(true);
  });

  it('holds a pair to a stricter contrast the project asks for', () => {
    const exit = Color.verify({
      text: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(24n, 1n),
        maximumSize: Fraction.makeUnsafe(30n, 1n),
      },
      fontWeight: 400,
      minimumContrast: 13 / 2,
    });

    expect(Option.getOrThrow(Exit.findErrorOption(exit))).toMatchObject({
      _tag: 'ContrastShortfall',
      requiredContrast: 6.5,
      message: 'Expected a contrast of at least 6.5:1, the ratio the project asks for',
    });
  });

  it('rejects a contrast the project asks for that is looser than the standards', () => {
    const exit = Color.verify({
      text: 'oklch(0% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
      minimumContrast: 5,
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Option.filter(Exit.findErrorOption(exit), Schema.isSchemaError)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['minimumContrast'],
        message:
          'Expected a minimum contrast of at least 7:1, the ratio WCAG 2.2 Contrast (Enhanced) requires for text of 16 px at weight 400',
      },
    ]);
  });

  it('rejects a contrast the project asks for that no colors can reach', () => {
    const exit = Color.verify({
      text: 'oklch(0% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
      minimumContrast: 25,
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Option.filter(Exit.findErrorOption(exit), Schema.isSchemaError)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['minimumContrast'],
        message:
          'Expected a minimum contrast of at most 21:1, the largest contrast WCAG 2.2 defines, of black against white',
      },
    ]);
  });

  it('accepts the largest contrast for black against white', () => {
    const exit = Color.verify({
      text: 'oklch(0% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
      minimumContrast: Color.maximumContrastRatio,
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a font weight CSS Fonts does not allow', () => {
    const exit = Color.verify({
      text: 'oklch(0% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 0,
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Option.filter(Exit.findErrorOption(exit), Schema.isSchemaError)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['fontWeight'],
        message: 'Expected a font weight from 1 to 1000, as CSS Fonts allows',
      },
    ]);
  });
});

describe('Brand', () => {
  it('is written as the schema encodes it', () => {
    expectTypeOf<Color.Brand>().toEqualTypeOf<typeof Color.Brand.Encoded>();
  });

  it('rejects a font weight CSS Fonts does not allow', () => {
    const exit = Schema.decodeExit(Color.Brand)({
      color: 'oklch(64% 0.17 147)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 1200,
    });

    expect(Exit.isFailure(exit)).toBe(true);
  });
});

describe('shade', () => {
  it('writes the shade with the hue in the unit of angle of the brand color', () => {
    const inDegrees = Color.shade({
      color: 'oklch(64% 0.17 147)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
    });
    const inTurns = Color.shade({
      color: 'oklch(64% 0.17 0.4turn)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
    });

    expect(Exit.isSuccess(inDegrees) ? inDegrees.value : undefined).toMatch(/ 147\)$/);
    expect(Exit.isSuccess(inTurns) ? inTurns.value : undefined).toMatch(/ 0\.4turn\)$/);
  });

  it('rejects a step smaller than the minimum font size', () => {
    const exit = Color.shade({
      color: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(12n, 1n),
        maximumSize: Fraction.makeUnsafe(15n, 1n),
      },
      fontWeight: 400,
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Option.filter(Exit.findErrorOption(exit), Schema.isSchemaError)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['step', 'minimumSize'],
        message:
          'Expected a minimum size of at least 13 px, the smallest size of the USWDS theme type scale',
      },
    ]);
  });

  it('keeps a brand color that already reaches the contrast', () => {
    const exit = Color.shade({
      color: 'oklch(0% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
    });

    expect(Exit.isSuccess(exit) ? exit.value : '').toBe('oklch(0 0 0)');
  });

  it('darkens a brand color against a light background to the contrast its text needs', () => {
    const step = {
      minimumSize: Fraction.makeUnsafe(16n, 1n),
      maximumSize: Fraction.makeUnsafe(20n, 1n),
    };
    const exit = Color.shade({
      color: 'oklch(64% 0.17 147)',
      background: 'oklch(100% 0 0)',
      step,
      fontWeight: 400,
    });
    const shade = Exit.isSuccess(exit) ? exit.value : '';
    const verified = Color.verify({
      text: shade,
      background: 'oklch(100% 0 0)',
      step,
      fontWeight: 400,
    });

    expect(shade).toMatch(/^oklch\(0\.4\d* 0\.1\d* 147\)$/);
    expect(Exit.isSuccess(verified) ? verified.value : 0).toBeCloseTo(7, 9);
  });

  it('reduces the chroma where sRGB cannot hold it at the lightness the contrast needs', () => {
    const exit = Color.shade({
      color: 'oklch(64% 0.17 147)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
    });
    const chroma = Number(
      /^oklch\(\S+ (\S+) \S+\)$/.exec(Exit.isSuccess(exit) ? exit.value : '')?.[1],
    );

    expect(chroma).toBeLessThan(0.17);
  });

  it('picks the shade closest by deltaEOK over one nearer in lightness that loses more chroma', () => {
    const exit = Color.shade({
      color: 'oklch(54% 0.16 0)',
      background: 'oklch(56.2% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(24n, 1n),
        maximumSize: Fraction.makeUnsafe(30n, 1n),
      },
      fontWeight: 400,
    });

    expect(Exit.isSuccess(exit) ? exit.value : '').toBe(
      'oklch(0.0869102395243317 0.035232653611955 0)',
    );
  });

  it('rests on a largest chroma within sRGB that rises with lightness to one peak and falls after it', () => {
    const isInSrgb = (lightness: number, chroma: number, hue: number): boolean => {
      const [long, medium, short] = transform(Color.oklabToLms, [
        lightness,
        chroma * Math.cos((hue * Math.PI) / 180),
        chroma * Math.sin((hue * Math.PI) / 180),
      ]);
      return transform(
        Color.xyzToLinearSrgb,
        transform(Color.lmsToXyz, [long ** 3, medium ** 3, short ** 3]),
      ).every((channel) => channel >= 0 && channel <= 1);
    };
    const largestChromas = Array.from({ length: 360 }, (_, hue) =>
      Array.from(
        { length: 199 },
        (_, lightnessIndex) =>
          Array.from({ length: 40 }).reduce<readonly [number, number]>(
            ([inside, outside]) =>
              isInSrgb((lightnessIndex + 1) / 200, (inside + outside) / 2, hue)
                ? [(inside + outside) / 2, outside]
                : [inside, (inside + outside) / 2],
            [0, Color.fullChroma],
          )[0],
      ),
    );

    for (const chromas of largestChromas) {
      const peak = chromas.indexOf(Math.max(...chromas));

      expect(chromas.slice(0, peak + 1)).toEqual(chromas.slice(0, peak + 1).sort((a, b) => a - b));
      expect(chromas.slice(peak)).toEqual(chromas.slice(peak).sort((a, b) => b - a));
    }
  });

  it('lightens a brand color against a dark background and keeps its chroma where sRGB holds it', () => {
    const step = {
      minimumSize: Fraction.makeUnsafe(16n, 1n),
      maximumSize: Fraction.makeUnsafe(20n, 1n),
    };
    const exit = Color.shade({
      color: 'oklch(64% 0.17 147)',
      background: 'oklch(0% 0 0)',
      step,
      fontWeight: 400,
    });
    const shade = Exit.isSuccess(exit) ? exit.value : '';
    const verified = Color.verify({
      text: shade,
      background: 'oklch(0% 0 0)',
      step,
      fontWeight: 400,
    });

    expect(shade).toMatch(/^oklch\(0\.6\d* 0\.17 147\)$/);
    expect(Exit.isSuccess(verified) ? verified.value : 0).toBeCloseTo(7, 9);
  });

  it('reaches a stricter contrast the project asks for', () => {
    const step = {
      minimumSize: Fraction.makeUnsafe(16n, 1n),
      maximumSize: Fraction.makeUnsafe(20n, 1n),
    };
    const exit = Color.shade({
      color: 'oklch(64% 0.17 147)',
      background: 'oklch(100% 0 0)',
      step,
      fontWeight: 400,
      minimumContrast: 10,
    });
    const contrast = Color.contrast(Exit.isSuccess(exit) ? exit.value : '', 'oklch(100% 0 0)');

    expect(Exit.isSuccess(contrast) ? contrast.value : 0).toBeCloseTo(10, 9);
  });

  it('rejects a background against which no shade within sRGB reaches the contrast', () => {
    const exit = Color.shade({
      color: 'oklch(64% 0.17 147)',
      background: 'oklch(60% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
    });

    expect(Option.getOrThrow(Exit.findErrorOption(exit))).toMatchObject({
      _tag: 'NoLegibleShade',
      requiredContrast: 7,
      message:
        'Expected a background against which a shade of the color within sRGB reaches 7:1, the contrast WCAG 2.2 Contrast (Enhanced) requires for text of 16 px at weight 400',
    });
  });

  it.effect('lets a missing shade be caught by its tag, apart from a fault of the input', () =>
    Effect.gen(function* () {
      const requiredContrast = yield* Color.shade({
        color: 'oklch(64% 0.17 147)',
        background: 'oklch(60% 0 0)',
        step: {
          minimumSize: Fraction.makeUnsafe(16n, 1n),
          maximumSize: Fraction.makeUnsafe(20n, 1n),
        },
        fontWeight: 400,
      }).pipe(Effect.catchTag('NoLegibleShade', (error) => Effect.succeed(error.requiredContrast)));

      expect(requiredContrast).toBe(7);
    }),
  );

  it('rejects a contrast the project asks for that is looser than the standards', () => {
    const exit = Color.shade({
      color: 'oklch(64% 0.17 147)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
      minimumContrast: 5,
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Option.filter(Exit.findErrorOption(exit), Schema.isSchemaError)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['minimumContrast'],
        message:
          'Expected a minimum contrast of at least 7:1, the ratio WCAG 2.2 Contrast (Enhanced) requires for text of 16 px at weight 400',
      },
    ]);
  });

  it('rejects a contrast the project asks for that no shade can reach, instead of blaming the background', () => {
    const exit = Color.shade({
      color: 'oklch(64% 0.17 147)',
      background: 'oklch(100% 0 0)',
      step: {
        minimumSize: Fraction.makeUnsafe(16n, 1n),
        maximumSize: Fraction.makeUnsafe(20n, 1n),
      },
      fontWeight: 400,
      minimumContrast: 25,
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Option.filter(Exit.findErrorOption(exit), Schema.isSchemaError)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['minimumContrast'],
        message:
          'Expected a minimum contrast of at most 21:1, the largest contrast WCAG 2.2 defines, of black against white',
      },
    ]);
  });
});
