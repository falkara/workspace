import { describe, expect, it } from '@effect/vitest';
import { Exit, Option, Schema, SchemaIssue } from 'effect';

import * as Color from '#src/Color';
import * as Fraction from '#src/Fraction';

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
    expect(Color.largeTextPointSize).toBe(18);
  });
});

describe('largeBoldTextPointSize', () => {
  it('is the size from which WCAG 2.2 counts bold text as large-scale', () => {
    expect(Color.largeBoldTextPointSize).toBe(14);
  });
});

describe('largeTextSize', () => {
  it('is 24 CSS pixels', () => {
    expect(Color.largeTextSize).toEqual({ numerator: 24n, denominator: 1n });
  });
});

describe('largeBoldTextSize', () => {
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
    const lms = Color.oklabToLms.map((row) => row[0] ** 3);
    const xyz = Color.lmsToXyz.map((row) => row[0] * lms[0]! + row[1] * lms[1]! + row[2] * lms[2]!);
    const srgb = Color.xyzToLinearSrgb.map(
      (row) => row[0] * xyz[0]! + row[1] * xyz[1]! + row[2] * xyz[2]!,
    );

    for (const channel of srgb) {
      expect(channel).toBeCloseTo(1, 6);
    }
  });
});

describe('contrastTolerance', () => {
  it('is the machine epsilon over every operation of the conversion', () => {
    expect(Color.contrastTolerance).toBe(Color.conversionOperations * Number.EPSILON);
  });

  it('covers the rounding left in a contrast of exactly 7:1', () => {
    const exit = Color.contrast(`oklch(${Math.cbrt(1 / 10)} 0 0)`, 'oklch(100% 0 0)');
    const contrast = Exit.isSuccess(exit) ? exit.value : 0;

    expect(contrast).toBeLessThanOrEqual(7);
    expect(contrast).toBeGreaterThanOrEqual(7 * (1 - Color.contrastTolerance));
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
          'Expected a color written in oklch() as CSS Color 4 writes it, such as oklch(64% 0.17 147)',
      },
    ]);
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
          'Expected a color written in oklch() as CSS Color 4 writes it, such as oklch(64% 0.17 147)',
      },
      {
        path: ['background'],
        message: 'Expected a color within sRGB, as WCAG 2.2 defines contrast only there',
      },
    ]);
  });
});

describe('verify', () => {
  it('accepts a pair whose contrast meets what text of its size and weight needs', () => {
    const exit = Color.verify({
      text: 'oklch(0% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        position: 0,
        minimumSize: Fraction.make(16n, 1n),
        maximumSize: Fraction.make(20n, 1n),
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
        position: 0,
        minimumSize: Fraction.make(16n, 1n),
        maximumSize: Fraction.make(20n, 1n),
      },
      fontWeight: 400,
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['text'],
        message:
          'Expected a contrast of at least 7:1 for text of 16 px at weight 400, as WCAG 2.2 Contrast (Enhanced) requires',
      },
    ]);
  });

  it('accepts 9/2 for text that is large-scale at its smallest', () => {
    const exit = Color.verify({
      text: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        position: 3,
        minimumSize: Fraction.make(24n, 1n),
        maximumSize: Fraction.make(30n, 1n),
      },
      fontWeight: 400,
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('asks for 7:1 when text is large-scale only on wider screens', () => {
    const exit = Color.verify({
      text: 'oklch(50% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        position: 2,
        minimumSize: Fraction.make(22n, 1n),
        maximumSize: Fraction.make(28n, 1n),
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
        position: 1,
        minimumSize: Fraction.make(56n, 3n),
        maximumSize: Fraction.make(24n, 1n),
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
        position: 1,
        minimumSize: Fraction.make(56n, 3n),
        maximumSize: Fraction.make(24n, 1n),
      },
      fontWeight: 600,
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['text'],
        message:
          'Expected a contrast of at least 7:1 for text of 18.6667 px at weight 600, as WCAG 2.2 Contrast (Enhanced) requires',
      },
    ]);
  });

  it('accepts a pair whose contrast is exactly 7:1', () => {
    const exit = Color.verify({
      text: `oklch(${Math.cbrt(1 / 10)} 0 0)`,
      background: 'oklch(100% 0 0)',
      step: {
        position: 0,
        minimumSize: Fraction.make(16n, 1n),
        maximumSize: Fraction.make(20n, 1n),
      },
      fontWeight: 400,
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a pair just below 7:1', () => {
    const exit = Color.verify({
      text: 'oklch(0.4642 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        position: 0,
        minimumSize: Fraction.make(16n, 1n),
        maximumSize: Fraction.make(20n, 1n),
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
        position: 3,
        minimumSize: Fraction.make(24n, 1n),
        maximumSize: Fraction.make(30n, 1n),
      },
      fontWeight: 400,
      minimumContrast: 13 / 2,
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['text'],
        message: 'Expected a contrast of at least 6.5:1, the ratio the project asks for',
      },
    ]);
  });

  it('rejects a contrast the project asks for that is looser than the standards', () => {
    const exit = Color.verify({
      text: 'oklch(0% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        position: 0,
        minimumSize: Fraction.make(16n, 1n),
        maximumSize: Fraction.make(20n, 1n),
      },
      fontWeight: 400,
      minimumContrast: 5,
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['minimumContrast'],
        message:
          'Expected a minimum contrast of at least 7:1, the ratio WCAG 2.2 Contrast (Enhanced) requires for text of 16 px at weight 400',
      },
    ]);
  });

  it('rejects a font weight CSS Fonts does not allow', () => {
    const exit = Color.verify({
      text: 'oklch(0% 0 0)',
      background: 'oklch(100% 0 0)',
      step: {
        position: 0,
        minimumSize: Fraction.make(16n, 1n),
        maximumSize: Fraction.make(20n, 1n),
      },
      fontWeight: 0,
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['fontWeight'],
        message: 'Expected a font weight from 1 to 1000, as CSS Fonts allows',
      },
    ]);
  });
});
