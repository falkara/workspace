import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Effect, Exit, Option, pipe, Rational, Schema, SchemaIssue } from 'effect';

import * as Color from '#src/Color';
import * as Colorimetry from '#src/Colorimetry';
import * as Typography from '#src/Typography';

/** The relative luminance of a color of the given lightness and chroma at a hue of 0, whose cosine and sine are 1 and 0 exactly, converted by the matrices of CSS Color 4 exactly, apart from the code of Color. */
const exactLuminance = (
  lightness: Rational.Rational,
  chroma: Rational.Rational,
): Rational.Rational => {
  const roots = Colorimetry.transform(Color.oklabToLms, [
    lightness,
    chroma,
    Rational.fromBigInt(0n),
  ]);
  const channels = Colorimetry.transform(
    Colorimetry.srgb.xyzToLinear,
    Colorimetry.transform(Color.lmsToXyz, [
      Rational.multiply(roots[0], Rational.multiply(roots[0], roots[0])),
      Rational.multiply(roots[1], Rational.multiply(roots[1], roots[1])),
      Rational.multiply(roots[2], Rational.multiply(roots[2], roots[2])),
    ]),
  );
  return Rational.sumAll(
    channels.map((channel, index) =>
      Rational.multiply(
        Color.luminanceWeights[index] ?? channel,
        Rational.min(Rational.max(channel, Rational.fromBigInt(0n)), Rational.fromBigInt(1n)),
      ),
    ),
  );
};

/** The contrast ratio of two relative luminances as WCAG 2.2 defines it, exactly. */
const exactContrast = (first: Rational.Rational, second: Rational.Rational): Rational.Rational =>
  Rational.divideUnsafe(
    Rational.sum(Rational.max(first, second), Color.contrastFlare),
    Rational.sum(Rational.min(first, second), Color.contrastFlare),
  );

/** A number of hundred-thousandths written with five decimal places, as a test writes it in oklch(). */
const fifths = (hundredThousandths: number): string => (hundredThousandths / 100000).toFixed(5);

/** A matrix of Color in the numbers JavaScript holds, for the checks that follow a tool computing in them. */
const numbers = <From extends string, To extends string>(
  exact: Colorimetry.Matrix<From, To>,
): ReadonlyArray<ReadonlyArray<number>> =>
  exact.map((row) => row.map((entry) => Rational.toNumberUnsafe(entry)));

/** The matrices of Color in the numbers JavaScript holds. */
const [oklabToLms, lmsToXyz, xyzToLinearSrgb] = [
  numbers(Color.oklabToLms),
  numbers(Color.lmsToXyz),
  numbers(Colorimetry.srgb.xyzToLinear),
];

/** The product of a matrix and a vector in the numbers JavaScript holds. */
const transform = (
  rows: ReadonlyArray<ReadonlyArray<number>>,
  vector: ReadonlyArray<number>,
): ReadonlyArray<number> =>
  rows.map((row) => row.reduce((sum, entry, index) => sum + entry * (vector[index] ?? 0), 0));

/** The contrast ratio of two colors written in oklch() with a hue in degrees as a tool measures it from hex, in the numbers JavaScript holds: each linear sRGB channel encoded, rounded to 8 bits, and read back as WCAG 2.2 reads it, apart from the code of Color. */
const hexContrast = (text: string, background: string): number => {
  const luminance = (written: string): number => {
    const [, lightness, chroma, hue] = /^oklch\((\S+) (\S+) (\S+)\)$/.exec(written) ?? [];
    // A lightness written as a percentage, a share of 1.
    const lightnessNumber = lightness?.endsWith('%')
      ? Number(lightness.slice(0, -1)) / 100
      : Number(lightness);
    const angle = (Number(hue) * Math.PI) / 180;
    const roots = transform(oklabToLms, [
      lightnessNumber,
      Number(chroma) * Math.cos(angle),
      Number(chroma) * Math.sin(angle),
    ]);
    const channels = transform(
      xyzToLinearSrgb,
      transform(
        lmsToXyz,
        roots.map((root) => root ** 3),
      ),
    );
    // Encoded, rounded to 8 bits and read back, each channel held within its range first.
    const read = (channel: number): number => {
      const held = Math.min(Math.max(channel, 0), 1);
      const hex =
        Math.round((held <= 0.0031308 ? 12.92 * held : 1.055 * held ** (1 / 2.4) - 0.055) * 255) /
        255;
      return hex <= 0.04045 ? hex / 12.92 : ((hex + 0.055) / 1.055) ** 2.4;
    };
    return (
      0.2126 * read(channels[0] ?? 0) +
      0.7152 * read(channels[1] ?? 0) +
      0.0722 * read(channels[2] ?? 0)
    );
  };
  return (
    (Math.max(luminance(text), luminance(background)) + 0.05) /
    (Math.min(luminance(text), luminance(background)) + 0.05)
  );
};

/** A step of the type scale for body text, smaller than large-scale text. */
const bodyStep = { minimumSize: Rational.fromBigInt(16n), maximumSize: Rational.fromBigInt(20n) };

describe('enhancedContrastRatio', () => {
  it('is 7, the contrast WCAG 2.2 Contrast (Enhanced) requires for text', () => {
    expect(Color.enhancedContrastRatio).toEqual(Rational.fromBigInt(7n));
  });
});

describe('largeTextEnhancedContrastRatio', () => {
  it('is 9/2, the contrast WCAG 2.2 Contrast (Enhanced) requires for large-scale text', () => {
    expect(Color.largeTextEnhancedContrastRatio).toEqual(Rational.makeUnsafe(9n, 2n));
  });
});

describe('largeTextPointSize', () => {
  it('is 18 CSS points, the size from which WCAG 2.2 counts text as large-scale', () => {
    expect(Color.largeTextPointSize).toEqual(Rational.fromBigInt(18n));
  });
});

describe('largeBoldTextPointSize', () => {
  it('is 14 CSS points, the size from which WCAG 2.2 counts bold text as large-scale', () => {
    expect(Color.largeBoldTextPointSize).toEqual(Rational.fromBigInt(14n));
  });
});

describe('largeTextSize', () => {
  it('is 24 CSS pixels', () => {
    expect(Color.largeTextSize).toEqual(Rational.fromBigInt(24n));
  });
});

describe('largeBoldTextSize', () => {
  it('is 56/3 CSS pixels', () => {
    expect(Color.largeBoldTextSize).toEqual(Rational.makeUnsafe(56n, 3n));
  });
});

describe('channelSteps', () => {
  it('is 255, the number of steps of an 8-bit sRGB channel', () => {
    expect(Color.channelSteps).toBe(255);
  });
});

describe('gamutTolerance', () => {
  it('is half a step of an 8-bit sRGB channel', () => {
    expect(
      Rational.multiply(Color.gamutTolerance, Rational.fromBigInt(BigInt(2 * Color.channelSteps))),
    ).toEqual(Rational.fromBigInt(1n));
  });
});

describe('fullChroma', () => {
  it('is 2/5, the chroma CSS Color 4 sets as 100 % in oklch()', () => {
    expect(Color.fullChroma).toEqual(Rational.makeUnsafe(2n, 5n));
  });
});

describe('halfTurns', () => {
  it('are the half turns of the units of angle CSS Values 4 defines but the radian', () => {
    expect(Color.halfTurns).toEqual({
      deg: Rational.fromBigInt(180n),
      grad: Rational.fromBigInt(200n),
      turn: Rational.makeUnsafe(1n, 2n),
    });
  });
});

describe('luminanceWeights', () => {
  it('are the weights of the linear sRGB channels in WCAG 2.2 relative luminance', () => {
    expect(Color.luminanceWeights).toEqual([
      Rational.makeUnsafe(2126n, 10000n),
      Rational.makeUnsafe(7152n, 10000n),
      Rational.makeUnsafe(722n, 10000n),
    ]);
  });

  it('add up to 1, so that a white with every channel at 1 has a relative luminance of 1', () => {
    expect(Rational.sumAll(Color.luminanceWeights)).toEqual(Rational.fromBigInt(1n));
  });
});

describe('contrastFlare', () => {
  it('is 1/20, the flare WCAG 2.2 adds to both relative luminances of a contrast ratio', () => {
    expect(Color.contrastFlare).toEqual(Rational.makeUnsafe(1n, 20n));
  });
});

describe('maximumContrastRatio', () => {
  it('is 21, the contrast of black against white', () => {
    expect(Color.maximumContrastRatio).toEqual(Rational.fromBigInt(21n));
  });
});

describe('encodedTransferThreshold', () => {
  it('is 0.04045, the encoded value up to which CSS Color 4 reads an sRGB channel as linear', () => {
    expect(Color.encodedTransferThreshold).toEqual(Rational.makeUnsafe(4045n, 100000n));
  });
});

describe('oklabToLms and lmsToXyz', () => {
  it('turn the white of Oklab into the white of sRGB, within the sixteen digits CSS Color 4 writes them to', () => {
    const roots = Colorimetry.transform(Color.oklabToLms, [
      Rational.fromBigInt(1n),
      Rational.fromBigInt(0n),
      Rational.fromBigInt(0n),
    ]);
    const channels = Colorimetry.transform(
      Colorimetry.srgb.xyzToLinear,
      Colorimetry.transform(Color.lmsToXyz, [
        Rational.multiply(roots[0], Rational.multiply(roots[0], roots[0])),
        Rational.multiply(roots[1], Rational.multiply(roots[1], roots[1])),
        Rational.multiply(roots[2], Rational.multiply(roots[2], roots[2])),
      ]),
    );

    for (const channel of channels) {
      expect(
        Rational.isLessThan(
          Rational.abs(Rational.subtract(channel, Rational.fromBigInt(1n))),
          Rational.makeUnsafe(1n, 10n ** 15n),
        ),
      ).toBe(true);
    }
  });
});

describe('Color', () => {
  it('accepts an oklch() color within sRGB', () => {
    expect(Exit.isSuccess(Schema.decodeExit(Color.Color)('oklch(64% 0.17 147)'))).toBe(true);
  });

  it('accepts lightness and chroma written as numbers and a hue written in degrees', () => {
    expect(Exit.isSuccess(Schema.decodeExit(Color.Color)('oklch(0.64 0.17 147deg)'))).toBe(true);
  });

  it('decodes a color into its components, its percentages read as CSS Color 4 reads them', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(64% 25% 147)');

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual({
      lightness: Rational.makeUnsafe(16n, 25n),
      chroma: Rational.makeUnsafe(1n, 10n),
      hue: Rational.fromBigInt(147n),
      hueUnit: 'deg',
      alpha: Rational.fromBigInt(1n),
    });
  });

  it('reads every number exactly as the decimal it is written as', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(0.1 0.01 0.1)');

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toMatchObject({
      lightness: Rational.makeUnsafe(1n, 10n),
      chroma: Rational.makeUnsafe(1n, 100n),
      hue: Rational.makeUnsafe(1n, 10n),
    });
  });

  it('clamps the lightness and the alpha to their range as CSS Color 4 clamps them', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(150% 0 0 / 1.5)');

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual({
      lightness: Rational.fromBigInt(1n),
      chroma: Rational.fromBigInt(0n),
      hue: Rational.fromBigInt(0n),
      hueUnit: 'deg',
      alpha: Rational.fromBigInt(1n),
    });
  });

  it('encodes a color with each number written exactly in decimal, which it decodes again into the same components', () => {
    const decoded = Schema.decodeExit(Color.Color)('oklch(50% 0.0000001 1.5rad)');
    const encoded = Exit.isSuccess(decoded)
      ? Schema.encodeExit(Color.Color)(decoded.value)
      : undefined;
    const redecoded =
      encoded !== undefined && Exit.isSuccess(encoded)
        ? Schema.decodeExit(Color.Color)(encoded.value)
        : undefined;

    expect(encoded !== undefined && Exit.isSuccess(encoded) ? encoded.value : undefined).toBe(
      'oklch(0.5 0.0000001 1.5rad / 1)',
    );
    expect(
      redecoded !== undefined && Exit.isSuccess(redecoded) ? redecoded.value : undefined,
    ).toEqual(Exit.isSuccess(decoded) ? decoded.value : undefined);
  });

  it('refuses to encode a component whose decimal expansion never ends, which CSS cannot write', () => {
    const exit = Schema.encodeExit(Color.Color)({
      lightness: Rational.makeUnsafe(1n, 3n),
      chroma: Rational.fromBigInt(0n),
      hue: Rational.fromBigInt(0n),
      hueUnit: 'deg',
      alpha: Rational.fromBigInt(1n),
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['lightness'],
        message: 'Expected a number whose decimal expansion ends, as CSS writes numbers in decimal',
      },
    ]);
  });

  it('reads the name of the function in any case, as CSS reads it', () => {
    const exit = Schema.decodeExit(Color.Color)('OKLCH(64% 0.17 147DEG)');

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual({
      lightness: Rational.makeUnsafe(16n, 25n),
      chroma: Rational.makeUnsafe(17n, 100n),
      hue: Rational.fromBigInt(147n),
      hueUnit: 'deg',
      alpha: Rational.fromBigInt(1n),
    });
  });

  it('reads a sign and an exponent as CSS Syntax reads a number', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(+6.4e1% 1.7E-1 +147 / 1e0)');

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual({
      lightness: Rational.makeUnsafe(16n, 25n),
      chroma: Rational.makeUnsafe(17n, 100n),
      hue: Rational.fromBigInt(147n),
      hueUnit: 'deg',
      alpha: Rational.fromBigInt(1n),
    });
  });

  it('rejects an exponent beyond the range BigDecimal reads exactly, with the reason', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(50% 0 1e99999)');

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: [],
        message:
          'Expected each number within the range BigDecimal reads exactly, an exponent of at most 10000 either way',
      },
    ]);
  });

  it('reads none as 0, as CSS Color 4 reads a missing component', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(none none none)');

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual({
      lightness: Rational.fromBigInt(0n),
      chroma: Rational.fromBigInt(0n),
      hue: Rational.fromBigInt(0n),
      hueUnit: 'deg',
      alpha: Rational.fromBigInt(1n),
    });
  });

  it('clamps a negative lightness and chroma to 0, as CSS Color 4 does', () => {
    const exit = Schema.decodeExit(Color.Color)('oklch(-10% -0.1 20)');

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual({
      lightness: Rational.fromBigInt(0n),
      chroma: Rational.fromBigInt(0n),
      hue: Rational.fromBigInt(20n),
      hueUnit: 'deg',
      alpha: Rational.fromBigInt(1n),
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

    for (const hue of ['180deg', '200grad', '0.5turn']) {
      expect(Color.contrast(`oklch(70% 0.1 ${hue})`, 'oklch(100% 0 0)')).toEqual(reference);
    }
    // π written to the digits JavaScript prints it with lies a little off a half turn.
    const radians = Color.contrast(`oklch(70% 0.1 ${Math.PI}rad)`, 'oklch(100% 0 0)');

    expect(Exit.isSuccess(radians) ? radians.value : undefined).toBeCloseTo(
      Exit.isSuccess(reference) ? reference.value : 0,
      12,
    );
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

  it('accepts a color whose channels lie outside sRGB by less than half a step of an 8-bit channel, as hex writes them within it', () => {
    // Its channels lie at 255.06, -0.39 and -0.14 steps, which hex writes as 255, 0 and 0.
    expect(Exit.isSuccess(Schema.decodeExit(Color.Color)('oklch(62.8% 0.2578 29.23)'))).toBe(true);
  });

  it('rejects a color whose channel lies outside sRGB by more than half a step of an 8-bit channel', () => {
    // Its green channel lies at -1.14 steps, which hex cannot write.
    expect(Exit.isFailure(Schema.decodeExit(Color.Color)('oklch(62.8% 0.258 29.23)'))).toBe(true);
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
        message:
          'Expected a color within sRGB, the color space whose relative luminance WCAG 2.2 gives and in which it asks authors to evaluate contrast unless another is known to be used',
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

  it('reduces the hue to one turn exactly, so that a large hue is the same angle', () => {
    expect(Color.contrast('oklch(50% 0.1 360000000000030)', 'oklch(100% 0 0)')).toEqual(
      Color.contrast('oklch(50% 0.1 30)', 'oklch(100% 0 0)'),
    );
  });

  it('gives black on white the number nearest to its exact contrast, 20.999999999999993, as white falls a little short of a relative luminance of 1 by the matrices of CSS Color 4', () => {
    const white = exactLuminance(Rational.fromBigInt(1n), Rational.fromBigInt(0n));

    expect(Rational.isLessThan(white, Rational.fromBigInt(1n))).toBe(true);
    expect(Color.contrast('oklch(0% 0 0)', 'oklch(100% 0 0)')).toEqual(
      Exit.succeed(
        Rational.toNumberUnsafe(
          exactContrast(exactLuminance(Rational.fromBigInt(0n), Rational.fromBigInt(0n)), white),
        ),
      ),
    );
    expect(Color.contrast('oklch(0% 0 0)', 'oklch(100% 0 0)')).toEqual(
      Exit.succeed(20.999999999999993),
    );
  });

  it('is 1 for a color on itself', () => {
    expect(Color.contrast('oklch(64% 0.17 147)', 'oklch(64% 0.17 147)')).toEqual(Exit.succeed(1));
  });

  it('is the same whichever color is the text', () => {
    expect(Color.contrast('oklch(64% 0.17 147)', 'oklch(100% 0 0)')).toEqual(
      Color.contrast('oklch(100% 0 0)', 'oklch(64% 0.17 147)'),
    );
  });

  it.prop(
    'is the number nearest to the exact contrast of a color at a hue of 0 against white',
    [
      Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 100000 })),
      Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 10000 })),
    ],
    ([lightness, chroma]) => {
      const exit = Color.contrast(
        `oklch(${fifths(lightness)} ${fifths(chroma)} 0)`,
        'oklch(1 0 0)',
      );

      // A color outside sRGB is refused before any contrast.
      expect(
        Exit.isFailure(exit) ||
          exit.value ===
            Rational.toNumberUnsafe(
              exactContrast(
                exactLuminance(
                  Rational.makeUnsafe(BigInt(lightness), 100000n),
                  Rational.makeUnsafe(BigInt(chroma), 100000n),
                ),
                exactLuminance(Rational.fromBigInt(1n), Rational.fromBigInt(0n)),
              ),
            ),
      ).toBe(true);
    },
  );

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
        message:
          'Expected a color within sRGB, the color space whose relative luminance WCAG 2.2 gives and in which it asks authors to evaluate contrast unless another is known to be used',
      },
    ]);
  });
});

describe('reaches', () => {
  it('judges colors rounded to the bits per channel of a display or a tool apart from the exact colors', () => {
    const colors = { text: 'oklch(0.47317 0.07 0)', background: 'oklch(100% 0 0)' };

    expect(
      Rational.isGreaterThanOrEqualTo(
        exactContrast(
          exactLuminance(Rational.makeUnsafe(47317n, 100000n), Rational.makeUnsafe(7n, 100n)),
          exactLuminance(Rational.fromBigInt(1n), Rational.fromBigInt(0n)),
        ),
        Rational.fromBigInt(7n),
      ),
    ).toBe(true);
    expect(hexContrast(colors.text, colors.background)).toBeLessThan(7);
    expect(Color.reaches(colors, Rational.fromBigInt(7n))).toEqual(Exit.succeed(true));
    expect(Color.reaches({ ...colors, channelBits: 8 }, Rational.fromBigInt(7n))).toEqual(
      Exit.succeed(false),
    );
  });

  it('rejects bits per channel no display or image format holds, with the reason', () => {
    for (const channelBits of [0, 17, 7.5]) {
      expect(
        Exit.isFailure(
          Color.reaches(
            { text: 'oklch(0% 0 0)', background: 'oklch(100% 0 0)', channelBits },
            Rational.fromBigInt(7n),
          ),
        ),
      ).toBe(true);
    }
    const exit = Color.reaches(
      { text: 'oklch(0% 0 0)', background: 'oklch(100% 0 0)', channelBits: 17 },
      Rational.fromBigInt(7n),
    );

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['channelBits'],
        message: 'Expected from 1 to 16 bits per channel, as displays and image formats hold them',
      },
    ]);
  });

  it.prop(
    'reaches the exact contrast of every two grays and falls short of a ratio a millionth above it',
    [
      Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 100000 })),
      Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 100000 })),
    ],
    ([textLightness, backgroundLightness]) => {
      const colors = {
        text: `oklch(${fifths(textLightness)} 0 0)`,
        background: `oklch(${fifths(backgroundLightness)} 0 0)`,
      };
      const exact = exactContrast(
        exactLuminance(
          Rational.makeUnsafe(BigInt(textLightness), 100000n),
          Rational.fromBigInt(0n),
        ),
        exactLuminance(
          Rational.makeUnsafe(BigInt(backgroundLightness), 100000n),
          Rational.fromBigInt(0n),
        ),
      );
      const above = Rational.sum(exact, Rational.makeUnsafe(1n, 1000000n));
      const aboveReached = Color.reaches(colors, above);

      expect(Color.reaches(colors, exact)).toEqual(Exit.succeed(true));
      // A ratio above the largest contrast is refused before any contrast.
      expect(
        Rational.isGreaterThan(above, Color.maximumContrastRatio) ||
          (Exit.isSuccess(aboveReached) && !aboveReached.value),
      ).toBe(true);
    },
  );

  it.prop(
    'reaches the exact contrast of every two colors within sRGB at a hue of 0 and falls short of a ratio a millionth above it',
    [
      Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 100000 })),
      Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 10000 })),
      Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 100000 })),
      Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 10000 })),
    ],
    ([textLightness, textChroma, backgroundLightness, backgroundChroma]) => {
      const colors = {
        text: `oklch(${fifths(textLightness)} ${fifths(textChroma)} 0)`,
        background: `oklch(${fifths(backgroundLightness)} ${fifths(backgroundChroma)} 0)`,
      };
      const exact = exactContrast(
        exactLuminance(
          Rational.makeUnsafe(BigInt(textLightness), 100000n),
          Rational.makeUnsafe(BigInt(textChroma), 100000n),
        ),
        exactLuminance(
          Rational.makeUnsafe(BigInt(backgroundLightness), 100000n),
          Rational.makeUnsafe(BigInt(backgroundChroma), 100000n),
        ),
      );
      const reached = Color.reaches(colors, exact);
      const above = Rational.sum(exact, Rational.makeUnsafe(1n, 1000000n));
      const aboveReached = Color.reaches(colors, above);

      // A color outside sRGB is refused before any contrast, so that only colors within it are held to it.
      expect(Exit.isFailure(reached) || reached.value).toBe(true);
      expect(
        Exit.isFailure(reached) ||
          Rational.isGreaterThan(above, Color.maximumContrastRatio) ||
          (Exit.isSuccess(aboveReached) && !aboveReached.value),
      ).toBe(true);
    },
  );

  it('counts a contrast within the smallest change a 16-bit channel shows of a ratio as meeting it, as no display can tell them apart', () => {
    const colors = { text: 'oklch(0.4 0 0)', background: 'oklch(100% 0 0)' };
    const exact = exactContrast(
      exactLuminance(Rational.makeUnsafe(2n, 5n), Rational.fromBigInt(0n)),
      exactLuminance(Rational.fromBigInt(1n), Rational.fromBigInt(0n)),
    );

    expect(Color.reaches(colors, Rational.sum(exact, Rational.makeUnsafe(1n, 10n ** 9n)))).toEqual(
      Exit.succeed(true),
    );
    expect(Color.reaches(colors, Rational.sum(exact, Rational.makeUnsafe(1n, 10n ** 6n)))).toEqual(
      Exit.succeed(false),
    );
  });

  it('reaches the largest contrast with black against white, which their exact contrast falls short of by less than any display shows', () => {
    expect(
      Color.reaches(
        { text: 'oklch(0% 0 0)', background: 'oklch(100% 0 0)' },
        Color.maximumContrastRatio,
      ),
    ).toEqual(Exit.succeed(true));
    expect(
      Color.reaches(
        { text: 'oklch(0% 0 0)', background: 'oklch(100% 0 0)', channelBits: 8 },
        Color.maximumContrastRatio,
      ),
    ).toEqual(Exit.succeed(true));
  });

  it('decides the contrast of rounded colors exactly, however close the ratio', () => {
    const colors = {
      text: 'oklch(0.47317 0.07 0)',
      background: 'oklch(98% 0.01 250)',
      channelBits: 8,
    };
    const verified = Color.verify({
      ...colors,
      step: bodyStep,
      fontWeight: 400,
      minimumContrast: Rational.fromBigInt(7n),
    });
    const contrast = Exit.isSuccess(verified)
      ? verified.value
      : Option.getOrThrow(Exit.findErrorOption(verified)).pipe((error) =>
          error._tag === 'ContrastShortfall' ? error.contrast : 0,
        );

    expect(
      Color.reaches(
        colors,
        Rational.subtract(Rational.fromNumberUnsafe(contrast), Rational.makeUnsafe(1n, 10n ** 12n)),
      ),
    ).toEqual(Exit.succeed(true));
    expect(
      Color.reaches(
        colors,
        Rational.sum(Rational.fromNumberUnsafe(contrast), Rational.makeUnsafe(1n, 10n ** 12n)),
      ),
    ).toEqual(Exit.succeed(false));
  });

  it('falls short of a ratio the colors do not meet', () => {
    expect(
      Color.reaches(
        { text: 'oklch(50% 0 0)', background: 'oklch(100% 0 0)' },
        Rational.fromBigInt(7n),
      ),
    ).toEqual(Exit.succeed(false));
  });

  it('decides as verify decides', () => {
    for (const text of [
      'oklch(0% 0 0)',
      'oklch(40% 0 0)',
      'oklch(50% 0 0)',
      'oklch(45% 0.1 250)',
      'oklch(0.47317 0.07 0)',
    ]) {
      for (const channelBits of [undefined, 8]) {
        const bits = channelBits === undefined ? {} : { channelBits };
        const reached = Color.reaches(
          { text, background: 'oklch(100% 0 0)', ...bits },
          Rational.fromBigInt(7n),
        );
        const verified = Color.verify({
          text,
          background: 'oklch(100% 0 0)',
          step: bodyStep,
          fontWeight: 400,
          ...bits,
        });

        expect(Exit.isSuccess(reached) ? reached.value : undefined).toBe(Exit.isSuccess(verified));
      }
    }
  });

  it('takes the ratio alone too, as pipe calls it', () => {
    expect(
      pipe(
        { text: 'oklch(0% 0 0)', background: 'oklch(100% 0 0)' },
        Color.reaches(Rational.fromBigInt(7n)),
      ),
    ).toEqual(Exit.succeed(true));
  });

  it('rejects a ratio outside the range of the contrast WCAG 2.2 defines, with the reason', () => {
    const exit = Color.reaches(
      { text: 'oklch(0% 0 0)', background: 'oklch(100% 0 0)' },
      Rational.fromBigInt(25n),
    );

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
      step: bodyStep,
      fontWeight: 400,
      minimumContrast: Rational.fromBigInt(10n),
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a pair whose contrast a project asks for is looser than the standards', () => {
    const exit = Schema.decodeExit(Color.Pair)({
      text: 'oklch(0% 0 0)',
      background: 'oklch(100% 0 0)',
      step: bodyStep,
      fontWeight: 400,
      minimumContrast: Rational.fromBigInt(5n),
    });

    expect(Exit.isFailure(exit)).toBe(true);
  });
});

describe('verify', () => {
  it('reports the contrast of the rounded colors and refuses a pair that falls short of it in hex', () => {
    const pair = {
      text: 'oklch(0.47317 0.07 0)',
      background: 'oklch(100% 0 0)',
      step: bodyStep,
      fontWeight: 400,
    };
    const rounded = Color.verify({ ...pair, channelBits: 8 });

    expect(Exit.isSuccess(Color.verify(pair))).toBe(true);
    expect(Option.getOrThrow(Exit.findErrorOption(rounded))).toMatchObject({
      _tag: 'ContrastShortfall',
      requiredContrast: Rational.fromBigInt(7n),
    });
    expect(
      Option.getOrThrow(Exit.findErrorOption(rounded)).pipe((error) =>
        error._tag === 'ContrastShortfall' ? error.contrast : 0,
      ),
    ).toBeCloseTo(hexContrast(pair.text, pair.background), 12);
  });

  it('takes a step of a type scale as it is, its position aside', () => {
    const scale = Typography.scale({
      minimumFactor: Rational.makeUnsafe(6n, 5n),
      maximumFactor: Rational.makeUnsafe(5n, 4n),
      maximumBodyFontSize: Rational.fromBigInt(20n),
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
    expect(
      Exit.isSuccess(
        Color.verify({
          text: 'oklch(0% 0 0)',
          background: 'oklch(100% 0 0)',
          step: bodyStep,
          fontWeight: 400,
        }),
      ),
    ).toBe(true);
  });

  it('rejects a pair below 7:1 for text smaller than large-scale text', () => {
    const exit = Color.verify({
      text: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: bodyStep,
      fontWeight: 400,
    });

    expect(Option.getOrThrow(Exit.findErrorOption(exit))).toMatchObject({
      _tag: 'ContrastShortfall',
      requiredContrast: Rational.fromBigInt(7n),
      message:
        'Expected a contrast of at least 7:1 for text of 16 px at weight 400, as WCAG 2.2 Contrast (Enhanced) requires',
    });
  });

  it('reports the contrast of the colors with the shortfall', () => {
    const exit = Color.verify({
      text: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: bodyStep,
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
        step: bodyStep,
        fontWeight: 400,
      }).pipe(
        Effect.catchTag('ContrastShortfall', (error) => Effect.succeed(error.requiredContrast)),
      );

      expect(requiredContrast).toEqual(Rational.fromBigInt(7n));
    }),
  );

  it('accepts 9/2 for text that is large-scale at its smallest', () => {
    expect(
      Exit.isSuccess(
        Color.verify({
          text: 'oklch(50% 0 0)',
          background: 'oklch(100% 0 0)',
          step: { minimumSize: Rational.fromBigInt(24n), maximumSize: Rational.fromBigInt(30n) },
          fontWeight: 400,
        }),
      ),
    ).toBe(true);
  });

  it('rejects a step that shrinks, which would earn its text the ratio of large text', () => {
    const exit = Color.verify({
      text: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: { minimumSize: Rational.fromBigInt(24n), maximumSize: Rational.fromBigInt(12n) },
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
          'Expected a maximum size of 24 px to 38.4 px, so that the step never shrinks below its size at the minimum viewport width and grows no faster than text that can be enlarged to 200 %, as WCAG 2.2 Resize Text requires, within the 300 % page zoom of Safari, the lowest maximum among the Baseline core browsers',
      },
    ]);
  });

  it('asks for 7:1 when text is large-scale only on wider screens', () => {
    expect(
      Exit.isFailure(
        Color.verify({
          text: 'oklch(50% 0 0)',
          background: 'oklch(100% 0 0)',
          step: { minimumSize: Rational.fromBigInt(22n), maximumSize: Rational.fromBigInt(28n) },
          fontWeight: 400,
        }),
      ),
    ).toBe(true);
  });

  it('accepts 9/2 for bold text of the large bold text size', () => {
    expect(
      Exit.isSuccess(
        Color.verify({
          text: 'oklch(50% 0 0)',
          background: 'oklch(100% 0 0)',
          step: {
            minimumSize: Rational.makeUnsafe(56n, 3n),
            maximumSize: Rational.fromBigInt(24n),
          },
          fontWeight: 700,
        }),
      ),
    ).toBe(true);
  });

  it('asks for 7:1 for text of the large bold text size below the bold font weight', () => {
    const exit = Color.verify({
      text: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: { minimumSize: Rational.makeUnsafe(56n, 3n), maximumSize: Rational.fromBigInt(24n) },
      fontWeight: 600,
    });

    expect(Option.getOrThrow(Exit.findErrorOption(exit))).toMatchObject({
      _tag: 'ContrastShortfall',
      requiredContrast: Rational.fromBigInt(7n),
      message:
        'Expected a contrast of at least 7:1 for text of 18.66667 px at weight 600, as WCAG 2.2 Contrast (Enhanced) requires',
    });
  });

  it('accepts a pair at the exact contrast of its colors', () => {
    const exact = exactContrast(
      exactLuminance(Rational.makeUnsafe(262902n, 1000000n), Rational.makeUnsafe(14207n, 1000000n)),
      exactLuminance(Rational.fromBigInt(1n), Rational.fromBigInt(0n)),
    );

    expect(
      Exit.isSuccess(
        Color.verify({
          text: 'oklch(0.262902 0.014207 0)',
          background: 'oklch(100% 0 0)',
          step: bodyStep,
          fontWeight: 400,
          minimumContrast: exact,
        }),
      ),
    ).toBe(true);
  });

  it('rejects a pair that falls short of a ratio by more than any display shows', () => {
    const exact = exactContrast(
      exactLuminance(Rational.makeUnsafe(262902n, 1000000n), Rational.makeUnsafe(14207n, 1000000n)),
      exactLuminance(Rational.fromBigInt(1n), Rational.fromBigInt(0n)),
    );

    expect(
      Exit.isFailure(
        Color.verify({
          text: 'oklch(0.262902 0.014207 0)',
          background: 'oklch(100% 0 0)',
          step: bodyStep,
          fontWeight: 400,
          minimumContrast: Rational.sum(exact, Rational.makeUnsafe(1n, 1000000n)),
        }),
      ),
    ).toBe(true);
  });

  it('rejects a pair just below 7:1', () => {
    expect(
      Exit.isFailure(
        Color.verify({
          text: 'oklch(0.4642 0 0)',
          background: 'oklch(100% 0 0)',
          step: bodyStep,
          fontWeight: 400,
        }),
      ),
    ).toBe(true);
  });

  it('holds a pair to a stricter contrast the project asks for', () => {
    const exit = Color.verify({
      text: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: { minimumSize: Rational.fromBigInt(24n), maximumSize: Rational.fromBigInt(30n) },
      fontWeight: 400,
      minimumContrast: Rational.makeUnsafe(13n, 2n),
    });

    expect(Option.getOrThrow(Exit.findErrorOption(exit))).toMatchObject({
      _tag: 'ContrastShortfall',
      requiredContrast: Rational.makeUnsafe(13n, 2n),
      message: 'Expected a contrast of at least 6.5:1, the ratio the project asks for',
    });
  });

  it('rejects a contrast the project asks for that is looser than the standards', () => {
    const exit = Color.verify({
      text: 'oklch(0% 0 0)',
      background: 'oklch(100% 0 0)',
      step: bodyStep,
      fontWeight: 400,
      minimumContrast: Rational.fromBigInt(5n),
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
      step: bodyStep,
      fontWeight: 400,
      minimumContrast: Rational.fromBigInt(25n),
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
    expect(
      Exit.isSuccess(
        Color.verify({
          text: 'oklch(0% 0 0)',
          background: 'oklch(100% 0 0)',
          step: bodyStep,
          fontWeight: 400,
          minimumContrast: Color.maximumContrastRatio,
        }),
      ),
    ).toBe(true);
  });

  it('rejects a font weight CSS Fonts does not allow', () => {
    const exit = Color.verify({
      text: 'oklch(0% 0 0)',
      background: 'oklch(100% 0 0)',
      step: bodyStep,
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
    expect(
      Exit.isFailure(
        Schema.decodeExit(Color.Brand)({
          color: 'oklch(64% 0.17 147)',
          background: 'oklch(100% 0 0)',
          step: bodyStep,
          fontWeight: 1200,
        }),
      ),
    ).toBe(true);
  });
});

describe('shade', () => {
  it('writes a shade that reaches the contrast exactly and in hex, as tools measure it', () => {
    for (const [color, background] of [
      ['oklch(64% 0.17 147)', 'oklch(100% 0 0)'],
      ['oklch(55% 0.18 300)', 'oklch(98% 0.01 90)'],
      ['oklch(60% 0.2 30)', 'oklch(100% 0 0)'],
      ['oklch(40% 0.1 250)', 'oklch(15% 0.02 250)'],
      ['oklch(70% 0.12 90)', 'oklch(100% 0 0)'],
      ['oklch(50% 0.08 200)', 'oklch(20% 0 0)'],
    ] as const) {
      const exit = Color.shade({ color, background, step: bodyStep, fontWeight: 400 });
      const shade = Exit.isSuccess(exit) ? exit.value : '';

      expect(hexContrast(shade, background)).toBeGreaterThanOrEqual(7);
      expect(
        Exit.isSuccess(Color.verify({ text: shade, background, step: bodyStep, fontWeight: 400 })),
      ).toBe(true);
      expect(
        Exit.isSuccess(
          Color.verify({
            text: shade,
            background,
            step: bodyStep,
            fontWeight: 400,
            channelBits: 8,
          }),
        ),
      ).toBe(true);
    }
  });

  it('writes the shade with the hue of the brand color exactly, in its unit of angle', () => {
    const inDegrees = Color.shade({
      color: 'oklch(64% 0.17 147.123456)',
      background: 'oklch(100% 0 0)',
      step: bodyStep,
      fontWeight: 400,
    });
    const inTurns = Color.shade({
      color: 'oklch(64% 0.17 0.4turn)',
      background: 'oklch(100% 0 0)',
      step: bodyStep,
      fontWeight: 400,
    });

    expect(Exit.isSuccess(inDegrees) ? inDegrees.value : undefined).toMatch(/ 147\.123456\)$/);
    expect(Exit.isSuccess(inTurns) ? inTurns.value : undefined).toMatch(/ 0\.4turn\)$/);
  });

  it('rejects a step smaller than the minimum font size', () => {
    const exit = Color.shade({
      color: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: { minimumSize: Rational.fromBigInt(12n), maximumSize: Rational.fromBigInt(15n) },
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
          'Expected a minimum size of at least 13 px, the smallest size of the USWDS 3 theme type scale',
      },
    ]);
  });

  it('keeps a brand color that already reaches the contrast, written exactly', () => {
    expect(
      Color.shade({
        color: 'oklch(0.1234567 0.01 30)',
        background: 'oklch(100% 0 0)',
        step: bodyStep,
        fontWeight: 400,
      }),
    ).toEqual(Exit.succeed('oklch(0.1234567 0.01 30)'));
  });

  it('darkens a brand color against a light background to the contrast its text needs, its chroma reduced where sRGB cannot hold it', () => {
    expect(
      Color.shade({
        color: 'oklch(64% 0.17 147)',
        background: 'oklch(100% 0 0)',
        step: bodyStep,
        fontWeight: 400,
      }),
    ).toEqual(Exit.succeed('oklch(0.4491 0.13347 147)'));
  });

  it('lightens a brand color against a dark background and keeps its chroma where sRGB holds it', () => {
    expect(
      Color.shade({
        color: 'oklch(64% 0.17 147)',
        background: 'oklch(0% 0 0)',
        step: bodyStep,
        fontWeight: 400,
      }),
    ).toEqual(Exit.succeed('oklch(0.65288 0.17 147)'));
  });

  it('passes over a lightness with a channel on the edge between two 8-bit steps, which a tool computing in rounded numbers may round either way', () => {
    const brand = {
      color: 'oklch(40% 0.1 250)',
      background: 'oklch(15% 0.02 250)',
      step: bodyStep,
      fontWeight: 400,
    };
    const exit = Color.shade(brand);

    // Its green channel lies a few ten-thousandths of a step below the edge, and reaches the contrast in hex only rounded up.
    expect(
      Exit.isSuccess(
        Color.verify({
          text: 'oklch(0.6856 0.1 250)',
          background: brand.background,
          step: bodyStep,
          fontWeight: 400,
          channelBits: 8,
        }),
      ),
    ).toBe(true);
    expect(hexContrast('oklch(0.6856 0.1 250)', brand.background)).toBeLessThan(7);
    expect(Exit.isSuccess(exit) ? exit.value : undefined).not.toBe('oklch(0.6856 0.1 250)');
    expect(
      hexContrast(Exit.isSuccess(exit) ? exit.value : '', brand.background),
    ).toBeGreaterThanOrEqual(7);
  });

  it('picks the shade closest by deltaEOK over one nearer in lightness that loses more chroma', () => {
    expect(
      Color.shade({
        color: 'oklch(54% 0.16 0)',
        background: 'oklch(56.2% 0 0)',
        step: { minimumSize: Rational.fromBigInt(24n), maximumSize: Rational.fromBigInt(30n) },
        fontWeight: 400,
      }),
    ).toEqual(Exit.succeed('oklch(0.0869 0.03524 0)'));
  });

  it('rests on a largest chroma within sRGB that rises with lightness to one peak and falls after it', () => {
    const isInSrgb = (lightness: number, chroma: number, hue: number): boolean =>
      transform(
        xyzToLinearSrgb,
        transform(
          lmsToXyz,
          transform(oklabToLms, [
            lightness,
            chroma * Math.cos((hue * Math.PI) / 180),
            chroma * Math.sin((hue * Math.PI) / 180),
          ]).map((root) => root ** 3),
        ),
      ).every((channel) => channel >= 0 && channel <= 1);
    const largestChromas = Array.from({ length: 360 }, (_, hue) =>
      Array.from(
        { length: 199 },
        (_, lightnessIndex) =>
          Array.from({ length: 40 }).reduce<readonly [number, number]>(
            ([inside, outside]) =>
              isInSrgb((lightnessIndex + 1) / 200, (inside + outside) / 2, hue)
                ? [(inside + outside) / 2, outside]
                : [inside, (inside + outside) / 2],
            [0, Rational.toNumberUnsafe(Color.fullChroma)],
          )[0],
      ),
    );

    for (const chromas of largestChromas) {
      const peak = chromas.indexOf(Math.max(...chromas));

      expect(chromas.slice(0, peak + 1)).toEqual(chromas.slice(0, peak + 1).sort((a, b) => a - b));
      expect(chromas.slice(peak)).toEqual(chromas.slice(peak).sort((a, b) => b - a));
    }
  });

  it('reaches a stricter contrast the project asks for', () => {
    const exit = Color.shade({
      color: 'oklch(64% 0.17 147)',
      background: 'oklch(100% 0 0)',
      step: bodyStep,
      fontWeight: 400,
      minimumContrast: Rational.fromBigInt(10n),
    });
    const colors = { text: Exit.isSuccess(exit) ? exit.value : '', background: 'oklch(100% 0 0)' };

    expect(Color.reaches(colors, Rational.fromBigInt(10n))).toEqual(Exit.succeed(true));
    expect(Color.reaches({ ...colors, channelBits: 8 }, Rational.fromBigInt(10n))).toEqual(
      Exit.succeed(true),
    );
  });

  it('rejects a background against which no shade within sRGB reaches the contrast', () => {
    const exit = Color.shade({
      color: 'oklch(64% 0.17 147)',
      background: 'oklch(60% 0 0)',
      step: bodyStep,
      fontWeight: 400,
    });

    expect(Option.getOrThrow(Exit.findErrorOption(exit))).toMatchObject({
      _tag: 'NoLegibleShade',
      requiredContrast: Rational.fromBigInt(7n),
      message:
        'Expected a background against which a shade of the color within sRGB reaches 7:1, the contrast WCAG 2.2 Contrast (Enhanced) requires for text of 16 px at weight 400',
    });
  });

  it.effect('lets a missing shade be caught by its tag, apart from a fault of the input', () =>
    Effect.gen(function* () {
      const requiredContrast = yield* Color.shade({
        color: 'oklch(64% 0.17 147)',
        background: 'oklch(60% 0 0)',
        step: bodyStep,
        fontWeight: 400,
      }).pipe(Effect.catchTag('NoLegibleShade', (error) => Effect.succeed(error.requiredContrast)));

      expect(requiredContrast).toEqual(Rational.fromBigInt(7n));
    }),
  );

  it('rejects a contrast the project asks for that is looser than the standards', () => {
    const exit = Color.shade({
      color: 'oklch(64% 0.17 147)',
      background: 'oklch(100% 0 0)',
      step: bodyStep,
      fontWeight: 400,
      minimumContrast: Rational.fromBigInt(5n),
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
      step: bodyStep,
      fontWeight: 400,
      minimumContrast: Rational.fromBigInt(25n),
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

describe('build time', () => {
  it('verifies a pair and finds a shade within a second each, the budget of a build that works every value out once', () => {
    for (const [color, background] of [
      ['oklch(64% 0.17 147)', 'oklch(100% 0 0)'],
      ['oklch(64% 0.17 147)', 'oklch(0% 0 0)'],
      ['oklch(55% 0.18 300)', 'oklch(98% 0.01 90)'],
      ['oklch(54% 0.16 0)', 'oklch(56.2% 0 0)'],
    ] as const) {
      const start = performance.now();
      Color.verify({
        text: color,
        background,
        step: bodyStep,
        fontWeight: 400,
        channelBits: 8,
      });
      const verifying = performance.now() - start;
      Color.shade({ color, background, step: bodyStep, fontWeight: 400 });

      expect(verifying, color).toBeLessThan(1000);
      expect(performance.now() - start - verifying, color).toBeLessThan(1000);
    }
  });
});

describe('types', () => {
  it('give the matrices of Oklab their spaces, so that the cube roots of the cone responses are cubed before they reach XYZ', () => {
    const roots = Colorimetry.transform(Color.oklabToLms, [
      Rational.fromBigInt(1n),
      Rational.fromBigInt(0n),
      Rational.fromBigInt(0n),
    ]);

    expectTypeOf(roots).toEqualTypeOf<Colorimetry.Vector<'cube roots of LMS'>>();
    // @ts-expect-error The cube roots of the cone responses are not the responses, which they must first be cubed into.
    Colorimetry.transform(Color.lmsToXyz, roots);
    // @ts-expect-error The matrix of the cone responses converts to XYZ, not from it.
    Colorimetry.transform(Color.lmsToXyz, Colorimetry.xyzOf(Colorimetry.whiteTristimulus));
    // @ts-expect-error The matrix of Oklab is not one of a medium.
    Colorimetry.transform(Colorimetry.srgb.xyzToLinear, roots);
  });
});
