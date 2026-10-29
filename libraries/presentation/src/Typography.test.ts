import { describe, expect, it } from '@effect/vitest';
import { Exit, Option, Schema, SchemaIssue } from 'effect';

import * as Fraction from '#src/Fraction';
import * as Length from '#src/Length';
import * as Typography from '#src/Typography';
import * as Viewport from '#src/Viewport';

describe('defaultFontSize', () => {
  it('is the font size the Baseline core browsers give the root element', () => {
    expect(Typography.defaultFontSize).toBe(16);
  });
});

describe('minimumFontSize', () => {
  it('is the smallest size of the USWDS theme type scale in its default settings', () => {
    expect(Typography.minimumFontSize).toBe(13);
  });
});

describe('ideographAdvanceFactor', () => {
  it('is the advance CSS Values 4 assumes for an ideograph it cannot measure', () => {
    expect(Typography.ideographAdvanceFactor).toBe(1);
  });
});

describe('maximumFontSize', () => {
  it('fits a full-width character into the minimum viewport width when a reader sets the font size up to the maximum page zoom factor', () => {
    const characterWidth = Fraction.multiply(
      Typography.maximumFontSize,
      Fraction.make(BigInt(Viewport.maximumPageZoomFactor * Typography.ideographAdvanceFactor), 1n),
    );

    expect(characterWidth).toEqual(Fraction.make(BigInt(Viewport.minimumViewportWidth), 1n));
  });
});

describe('minimumStepFactor', () => {
  it('keeps steps at the minimum font size apart by the layout unit', () => {
    const nextSize = Fraction.multiply(
      Fraction.make(BigInt(Typography.minimumFontSize), 1n),
      Typography.minimumStepFactor,
    );

    expect(nextSize).toEqual(
      Fraction.sum(
        Fraction.make(BigInt(Typography.minimumFontSize), 1n),
        Fraction.make(1n, BigInt(1 / Length.layoutUnit)),
      ),
    );
  });
});

describe('textScaleFactor', () => {
  it('is the text resize WCAG 2.2 Resize Text requires content to support', () => {
    expect(Typography.textScaleFactor).toBe(2);
  });
});

describe('minimumFontWeight', () => {
  it('is the lightest font weight CSS Fonts allows', () => {
    expect(Typography.minimumFontWeight).toBe(1);
  });
});

describe('maximumFontWeight', () => {
  it('is the heaviest font weight CSS Fonts allows', () => {
    expect(Typography.maximumFontWeight).toBe(1000);
  });
});

describe('boldFontWeight', () => {
  it('is the font weight CSS Fonts gives the bold keyword', () => {
    expect(Typography.boldFontWeight).toBe(700);
  });
});

describe('lineHeightFactor', () => {
  it('is the space-and-a-half WCAG 2.2 Visual Presentation requires within paragraphs', () => {
    expect(Typography.lineHeightFactor).toBe(3 / 2);
  });
});

describe('paragraphSpacingLineFactor', () => {
  it('is how much larger than the line spacing WCAG 2.2 Visual Presentation requires paragraph spacing to be', () => {
    expect(Typography.paragraphSpacingLineFactor).toBe(3 / 2);
  });
});

describe('paragraphSpacingFactor', () => {
  it('is 9/4', () => {
    expect(Typography.paragraphSpacingFactor).toBe(9 / 4);
  });

  it('is at least the paragraph spacing a reader may set under WCAG 2.2 Text Spacing', () => {
    expect(Typography.paragraphSpacingFactor).toBeGreaterThanOrEqual(2);
  });
});

describe('textAlignment', () => {
  it('is start, which keeps text unjustified as WCAG 2.2 Visual Presentation requires', () => {
    expect(Typography.textAlignment).toBe('start');
  });
});

describe('textSpacingLineHeightFactor', () => {
  it('is the line height WCAG 2.2 Text Spacing lets a reader set', () => {
    expect(Typography.textSpacingLineHeightFactor).toBe(3 / 2);
  });
});

describe('textSpacingParagraphSpacingFactor', () => {
  it('is the spacing following paragraphs WCAG 2.2 Text Spacing lets a reader set', () => {
    expect(Typography.textSpacingParagraphSpacingFactor).toBe(2);
  });
});

describe('textSpacingLetterSpacingFactor', () => {
  it('is the letter spacing WCAG 2.2 Text Spacing lets a reader set', () => {
    expect(Typography.textSpacingLetterSpacingFactor).toBe(3 / 25);
  });
});

describe('textSpacingWordSpacingFactor', () => {
  it('is the word spacing WCAG 2.2 Text Spacing lets a reader set', () => {
    expect(Typography.textSpacingWordSpacingFactor).toBe(4 / 25);
  });
});

describe('maximumTextGrowthFactor', () => {
  it('is 8/5 for the viewport range, the page zoom and the text scale it follows from', () => {
    expect(Typography.maximumTextGrowthFactor).toEqual({ numerator: 8n, denominator: 5n });
  });

  it('lets text that grows by it reach the text scale factor at the maximum page zoom', () => {
    const growth = Typography.maximumTextGrowthFactor;
    const growthAboveOne = Fraction.make(growth.numerator - growth.denominator, growth.denominator);
    const zoomedWidthAboveMinimum = Fraction.make(
      BigInt(
        Viewport.maximumViewportWidth -
          Viewport.maximumPageZoomFactor * Viewport.minimumViewportWidth,
      ),
      BigInt(Viewport.maximumPageZoomFactor),
    );
    const viewportRange = Fraction.make(
      BigInt(Viewport.maximumViewportWidth - Viewport.minimumViewportWidth),
      1n,
    );
    const zoomedSize = Fraction.sum(
      Fraction.one,
      Fraction.divide(Fraction.multiply(growthAboveOne, zoomedWidthAboveMinimum), viewportRange),
    );

    expect(
      Fraction.multiply(Fraction.make(BigInt(Viewport.maximumPageZoomFactor), 1n), zoomedSize),
    ).toEqual(Fraction.multiply(Fraction.make(BigInt(Typography.textScaleFactor), 1n), growth));
  });

  it('lets text that grows by it reach the text scale factor at a font size of the maximum page zoom', () => {
    const growth = Typography.maximumTextGrowthFactor;
    const viewportRange = BigInt(Viewport.maximumViewportWidth - Viewport.minimumViewportWidth);
    const slope = Fraction.make(
      growth.numerator - growth.denominator,
      growth.denominator * viewportRange,
    );
    const intercept = Fraction.make(
      BigInt(Viewport.maximumViewportWidth) * growth.denominator -
        growth.numerator * BigInt(Viewport.minimumViewportWidth),
      viewportRange * growth.denominator,
    );
    const resizedSize = Fraction.sum(
      Fraction.multiply(Fraction.make(BigInt(Viewport.maximumPageZoomFactor), 1n), intercept),
      Fraction.multiply(slope, Fraction.make(BigInt(Viewport.maximumViewportWidth), 1n)),
    );

    expect(resizedSize).toEqual(
      Fraction.multiply(Fraction.make(BigInt(Typography.textScaleFactor), 1n), growth),
    );
  });
});

describe('ScaleOptions', () => {
  it('accepts ratios above 1 that rise from the minimum to the maximum and a body size in range', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('accepts a maximum factor below the minimum factor', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: { numerator: 5n, denominator: 4n },
      maximumFactor: { numerator: 6n, denominator: 5n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a minimum factor of 1', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: { numerator: 1n, denominator: 1n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['minimumFactor'],
        message:
          'Expected a minimum factor of at least 833/832, so that every step is larger than the one below by at least the layout unit of browsers and no two steps render alike',
      },
    ]);
  });

  it('accepts a maximum factor equal to the minimum factor', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 6n, denominator: 5n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('reports an invalid minimum factor and an invalid maximum factor at once', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)(
      {
        minimumFactor: { numerator: 1n, denominator: 1n },
        maximumFactor: { numerator: 1n, denominator: 2n },
        maximumBodyFontSize: { numerator: 20n, denominator: 1n },
      },
      { errors: 'all' },
    );

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['minimumFactor'],
        message:
          'Expected a minimum factor of at least 833/832, so that every step is larger than the one below by at least the layout unit of browsers and no two steps render alike',
      },
      {
        path: ['maximumFactor'],
        message:
          'Expected a maximum factor of at least 833/832, so that every step is larger than the one below by at least the layout unit of browsers and no two steps render alike',
      },
    ]);
  });

  it('accepts a body size of the default font size', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 16n, denominator: 1n },
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('accepts a body size of the default font size grown by the maximum text growth factor', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 128n, denominator: 5n },
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a body size below the default font size', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 159n, denominator: 10n },
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['maximumBodyFontSize'],
        message:
          'Expected a body font size of at least 16 px, so that body text never shrinks below the default font size of browsers',
      },
    ]);
  });

  it('rejects a body size above the default font size grown by the maximum text growth factor', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 257n, denominator: 10n },
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['maximumBodyFontSize'],
        message:
          'Expected a body font size of at most 25.6 px, so that text can be enlarged to 200 % within the 300 % page zoom of Safari, as WCAG 2.2 Resize Text requires',
      },
    ]);
  });
});

describe('scale', () => {
  it('runs from small print to the largest heading that keeps text resizable', () => {
    const exit = Typography.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps.map((step) => step.position)).toEqual([-1, 0, 1, 2, 3, 4, 5, 6]);
    expect(steps.at(0)).toEqual({
      position: -1,
      minimumSize: { numerator: 40n, denominator: 3n },
      maximumSize: { numerator: 16n, denominator: 1n },
    });
    expect(steps.at(-1)).toEqual({
      position: 6,
      minimumSize: { numerator: 746_496n, denominator: 15_625n },
      maximumSize: { numerator: 78_125n, denominator: 1024n },
    });
  });

  it('starts at body text when body text keeps the default font size on every screen', () => {
    const exit = Typography.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 16n, denominator: 1n },
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps.map((step) => step.position)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('keeps every step growing by 1 to 8/5 and between the minimum and the maximum font size', () => {
    const exit = Typography.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps).not.toHaveLength(0);
    for (const step of steps) {
      const growth = Fraction.divide(step.maximumSize, step.minimumSize);

      expect(Fraction.isGreaterThanOrEqualTo(growth, Fraction.one)).toBe(true);
      expect(Fraction.isLessThanOrEqualTo(growth, Typography.maximumTextGrowthFactor)).toBe(true);
      expect(
        Fraction.isGreaterThanOrEqualTo(
          step.minimumSize,
          Fraction.make(BigInt(Typography.minimumFontSize), 1n),
        ),
      ).toBe(true);
      expect(Fraction.isLessThanOrEqualTo(step.minimumSize, Typography.maximumFontSize)).toBe(true);
    }
  });

  it('ends where the next step would grow by more than 8/5', () => {
    const exit = Typography.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });
    const highest = Exit.isSuccess(exit) ? exit.value.at(-1) : undefined;
    const nextGrowth = (20 * (5 / 4) ** 7) / (16 * (6 / 5) ** 7);

    expect(highest?.position).toBe(6);
    expect(nextGrowth).toBeGreaterThan(8 / 5);
  });

  it('ends where the next step would shrink when the maximum factor is below the minimum factor', () => {
    const exit = Typography.scale({
      minimumFactor: { numerator: 5n, denominator: 4n },
      maximumFactor: { numerator: 6n, denominator: 5n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });
    const highest = Exit.isSuccess(exit) ? exit.value.at(-1) : undefined;
    const nextGrowth = (20 * (6 / 5) ** 6) / (16 * (5 / 4) ** 6);

    expect(highest?.position).toBe(5);
    expect(nextGrowth).toBeLessThan(1);
  });

  it('starts where the next step down would be smaller than the minimum font size', () => {
    const exit = Typography.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });
    const lowest = Exit.isSuccess(exit) ? exit.value.at(0) : undefined;
    const nextMinimumSize = 16 * (5 / 6) ** 2;

    expect(lowest?.position).toBe(-1);
    expect(nextMinimumSize).toBeLessThan(Typography.minimumFontSize);
  });

  it('ends where the next step would be larger than the maximum font size when the factors are equal', () => {
    const exit = Typography.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 6n, denominator: 5n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });
    const highest = Exit.isSuccess(exit) ? exit.value.at(-1) : undefined;
    const nextMinimumSize = 16 * (6 / 5) ** 11;

    expect(highest?.position).toBe(10);
    expect(nextMinimumSize).toBeGreaterThan(Fraction.toNumber(Typography.maximumFontSize));
  });

  it('ends on both sides at the minimum step factor', () => {
    const exit = Typography.scale({
      minimumFactor: Typography.minimumStepFactor,
      maximumFactor: Typography.minimumStepFactor,
      maximumBodyFontSize: { numerator: 16n, denominator: 1n },
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];
    const previousMinimumSize = 16 * (832 / 833) ** 173;
    const nextMinimumSize = 16 * (833 / 832) ** 1580;

    expect(steps.at(0)?.position).toBe(-172);
    expect(steps.at(-1)?.position).toBe(1579);
    expect(previousMinimumSize).toBeLessThan(Typography.minimumFontSize);
    expect(nextMinimumSize).toBeGreaterThan(Fraction.toNumber(Typography.maximumFontSize));
  });

  it('reports every invalid option at once', () => {
    const exit = Typography.scale({
      minimumFactor: { numerator: 1n, denominator: 1n },
      maximumFactor: { numerator: 1n, denominator: 2n },
      maximumBodyFontSize: { numerator: 40n, denominator: 1n },
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['minimumFactor'],
        message:
          'Expected a minimum factor of at least 833/832, so that every step is larger than the one below by at least the layout unit of browsers and no two steps render alike',
      },
      {
        path: ['maximumFactor'],
        message:
          'Expected a maximum factor of at least 833/832, so that every step is larger than the one below by at least the layout unit of browsers and no two steps render alike',
      },
      {
        path: ['maximumBodyFontSize'],
        message:
          'Expected a body font size of at most 25.6 px, so that text can be enlarged to 200 % within the 300 % page zoom of Safari, as WCAG 2.2 Resize Text requires',
      },
    ]);
  });
});
