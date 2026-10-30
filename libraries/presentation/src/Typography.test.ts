import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Exit, Option, Schema, SchemaIssue } from 'effect';

import * as Fraction from '#src/Fraction';
import * as Length from '#src/Length';
import * as Typography from '#src/Typography';
import * as Viewport from '#src/Viewport';

describe('defaultFontSize', () => {
  it('is the font size the Baseline core browsers give the root element', () => {
    expect(Typography.defaultFontSize).toEqual({ numerator: 16n, denominator: 1n });
  });
});

describe('highestMaximumDefaultFontSize', () => {
  it('is the largest default font size Chromium and Firefox let a reader set', () => {
    expect(Typography.highestMaximumDefaultFontSize).toEqual({ numerator: 72n, denominator: 1n });
  });
});

describe('highestMaximumFontSizeFactor', () => {
  it('is a valid fraction', () => {
    expect(Schema.is(Fraction.Fraction)(Typography.highestMaximumFontSizeFactor)).toBe(true);
  });

  it('is 9/2, the largest default font size over the default font size', () => {
    expect(Typography.highestMaximumFontSizeFactor).toEqual({ numerator: 9n, denominator: 2n });
  });
});

describe('lowestMaximumFontSizeFactor', () => {
  it('is 1, as Safari lets a reader set no default font size', () => {
    expect(Typography.lowestMaximumFontSizeFactor).toEqual(Fraction.one);
  });
});

describe('minimumFontSize', () => {
  it('is the smallest size of the USWDS theme type scale in its default settings', () => {
    expect(Typography.minimumFontSize).toEqual({ numerator: 13n, denominator: 1n });
  });
});

describe('ideographAdvanceFactor', () => {
  it('is the advance CSS Values 4 assumes for an ideograph it cannot measure', () => {
    expect(Typography.ideographAdvanceFactor).toEqual({ numerator: 1n, denominator: 1n });
  });
});

describe('maximumFontSize', () => {
  it('is a valid fraction', () => {
    expect(Schema.is(Fraction.Fraction)(Typography.maximumFontSize)).toBe(true);
  });

  it('is 640/9 CSS pixels', () => {
    expect(Typography.maximumFontSize).toEqual({ numerator: 640n, denominator: 9n });
  });

  it('fits a full-width character into the minimum viewport width when a reader sets the largest default font size a browser allows', () => {
    const characterWidth = Fraction.multiply(
      Typography.maximumFontSize,
      Fraction.multiply(Typography.highestMaximumFontSizeFactor, Typography.ideographAdvanceFactor),
    );

    expect(characterWidth).toEqual(Viewport.minimumViewportWidth);
  });
});

describe('minimumStepFactor', () => {
  it('is a valid fraction', () => {
    expect(Schema.is(Fraction.Fraction)(Typography.minimumStepFactor)).toBe(true);
  });

  it('keeps steps at the minimum font size apart by the coarsest layout unit', () => {
    const nextSize = Fraction.multiply(Typography.minimumFontSize, Typography.minimumStepFactor);

    expect(nextSize).toEqual(Fraction.sum(Typography.minimumFontSize, Length.coarsestLayoutUnit));
  });
});

describe('textScaleFactor', () => {
  it('is the text resize WCAG 2.2 Resize Text requires content to support', () => {
    expect(Typography.textScaleFactor).toEqual({ numerator: 2n, denominator: 1n });
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
    expect(Typography.lineHeightFactor).toEqual({ numerator: 3n, denominator: 2n });
  });
});

describe('paragraphSpacingLineFactor', () => {
  it('is how much larger than the line spacing WCAG 2.2 Visual Presentation requires paragraph spacing to be', () => {
    expect(Typography.paragraphSpacingLineFactor).toEqual({ numerator: 3n, denominator: 2n });
  });
});

describe('paragraphSpacingFactor', () => {
  it('is a valid fraction', () => {
    expect(Schema.is(Fraction.Fraction)(Typography.paragraphSpacingFactor)).toBe(true);
  });

  it('is 9/4', () => {
    expect(Typography.paragraphSpacingFactor).toEqual({ numerator: 9n, denominator: 4n });
  });

  it('is at least the paragraph spacing a reader may set under WCAG 2.2 Text Spacing', () => {
    expect(
      Fraction.isGreaterThanOrEqualTo(
        Typography.paragraphSpacingFactor,
        Typography.textSpacingParagraphSpacingFactor,
      ),
    ).toBe(true);
  });
});

describe('textAlignment', () => {
  it('is start, which keeps text unjustified as WCAG 2.2 Visual Presentation requires', () => {
    expect(Typography.textAlignment).toBe('start');
  });
});

describe('textSpacingLineHeightFactor', () => {
  it('is the line height WCAG 2.2 Text Spacing lets a reader set', () => {
    expect(Typography.textSpacingLineHeightFactor).toEqual({ numerator: 3n, denominator: 2n });
  });
});

describe('textSpacingParagraphSpacingFactor', () => {
  it('is the spacing following paragraphs WCAG 2.2 Text Spacing lets a reader set', () => {
    expect(Typography.textSpacingParagraphSpacingFactor).toEqual({
      numerator: 2n,
      denominator: 1n,
    });
  });
});

describe('textSpacingLetterSpacingFactor', () => {
  it('is the letter spacing WCAG 2.2 Text Spacing lets a reader set', () => {
    expect(Typography.textSpacingLetterSpacingFactor).toEqual({ numerator: 3n, denominator: 25n });
  });
});

describe('textSpacingWordSpacingFactor', () => {
  it('is the word spacing WCAG 2.2 Text Spacing lets a reader set', () => {
    expect(Typography.textSpacingWordSpacingFactor).toEqual({ numerator: 4n, denominator: 25n });
  });
});

describe('maximumTextGrowthFactor', () => {
  it('is a valid fraction', () => {
    expect(Schema.is(Fraction.Fraction)(Typography.maximumTextGrowthFactor)).toBe(true);
  });

  it('is 8/5 for the viewport range, the page zoom and the text scale it follows from', () => {
    expect(Typography.maximumTextGrowthFactor).toEqual({ numerator: 8n, denominator: 5n });
  });

  it('lets text that grows by it reach the text scale factor at the maximum page zoom', () => {
    const growth = Typography.maximumTextGrowthFactor;
    const zoomedWidthAboveMinimum = Fraction.divide(
      Fraction.subtractUnsafe(
        Viewport.maximumViewportWidth,
        Fraction.multiply(Viewport.lowestMaximumPageZoomFactor, Viewport.minimumViewportWidth),
      ),
      Viewport.lowestMaximumPageZoomFactor,
    );
    const viewportRange = Fraction.subtractUnsafe(
      Viewport.maximumViewportWidth,
      Viewport.minimumViewportWidth,
    );
    const zoomedSize = Fraction.sum(
      Fraction.one,
      Fraction.divide(
        Fraction.multiply(Fraction.subtractUnsafe(growth, Fraction.one), zoomedWidthAboveMinimum),
        viewportRange,
      ),
    );

    expect(Fraction.multiply(Viewport.lowestMaximumPageZoomFactor, zoomedSize)).toEqual(
      Fraction.multiply(Typography.textScaleFactor, growth),
    );
  });

  it('lets text that grows by it reach the text scale factor at a font size of the maximum page zoom', () => {
    const growth = Typography.maximumTextGrowthFactor;
    const viewportRange = Fraction.subtractUnsafe(
      Viewport.maximumViewportWidth,
      Viewport.minimumViewportWidth,
    );
    const slope = Fraction.divide(Fraction.subtractUnsafe(growth, Fraction.one), viewportRange);
    const intercept = Fraction.divide(
      Fraction.subtractUnsafe(
        Viewport.maximumViewportWidth,
        Fraction.multiply(growth, Viewport.minimumViewportWidth),
      ),
      viewportRange,
    );
    const resizedSize = Fraction.sum(
      Fraction.multiply(Viewport.lowestMaximumPageZoomFactor, intercept),
      Fraction.multiply(slope, Viewport.maximumViewportWidth),
    );

    expect(resizedSize).toEqual(Fraction.multiply(Typography.textScaleFactor, growth));
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
          'Expected a minimum factor of at least 781/780, so that every step is larger than the one below and lengths of at least 1 em in consecutive steps never fall on the same point of the layout grid of a browser',
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
          'Expected a minimum factor of at least 781/780, so that every step is larger than the one below and lengths of at least 1 em in consecutive steps never fall on the same point of the layout grid of a browser',
      },
      {
        path: ['maximumFactor'],
        message:
          'Expected a maximum factor of at least 781/780, so that every step is larger than the one below and lengths of at least 1 em in consecutive steps never fall on the same point of the layout grid of a browser',
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

describe('Step', () => {
  it('needs its position, written or decoded', () => {
    expectTypeOf<Omit<typeof Typography.Step.Encoded, 'position'>>().not.toExtend<
      typeof Typography.Step.Encoded
    >();
    expectTypeOf<Omit<Typography.Step, 'position'>>().not.toExtend<Typography.Step>();
  });

  it('accepts every step of a scale', () => {
    const exit = Typography.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps).not.toHaveLength(0);
    for (const step of steps) {
      expect(Exit.isSuccess(Schema.decodeExit(Typography.Step)(step))).toBe(true);
    }
  });

  it('rejects a minimum size below the minimum font size', () => {
    const exit = Schema.decodeExit(Typography.Step)({
      position: 0,
      minimumSize: Fraction.makeUnsafe(12n, 1n),
      maximumSize: Fraction.makeUnsafe(15n, 1n),
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['minimumSize'],
        message:
          'Expected a minimum size of at least 13 px, the smallest size of the USWDS theme type scale',
      },
    ]);
  });

  it('rejects a minimum size above the maximum font size', () => {
    const exit = Schema.decodeExit(Typography.Step)({
      position: 0,
      minimumSize: Fraction.makeUnsafe(120n, 1n),
      maximumSize: Fraction.makeUnsafe(150n, 1n),
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['minimumSize'],
        message:
          'Expected a minimum size of at most 640/9 px, so that a full-width character fits the minimum viewport width of 320 px at a font size of 450 %, as WCAG 2.2 Reflow requires',
      },
    ]);
  });

  it('rejects a step that shrinks', () => {
    const exit = Schema.decodeExit(Typography.Step)({
      position: 0,
      minimumSize: Fraction.makeUnsafe(24n, 1n),
      maximumSize: Fraction.makeUnsafe(12n, 1n),
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['maximumSize'],
        message:
          'Expected a maximum size of 24 px to 38.4 px, so that the step never shrinks below its size at the minimum viewport width and grows no faster than text that can be enlarged to 200 % within the 300 % page zoom of Safari, as WCAG 2.2 Resize Text requires',
      },
    ]);
  });

  it('rejects a step that grows by more than 8/5', () => {
    const exit = Schema.decodeExit(Typography.Step)({
      position: 0,
      minimumSize: Fraction.makeUnsafe(24n, 1n),
      maximumSize: Fraction.makeUnsafe(40n, 1n),
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['maximumSize'],
        message:
          'Expected a maximum size of 24 px to 38.4 px, so that the step never shrinks below its size at the minimum viewport width and grows no faster than text that can be enlarged to 200 % within the 300 % page zoom of Safari, as WCAG 2.2 Resize Text requires',
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

    expect(steps.map((step) => step.position)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
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
      expect(Fraction.isGreaterThanOrEqualTo(step.minimumSize, Typography.minimumFontSize)).toBe(
        true,
      );
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
    expect(nextMinimumSize).toBeLessThan(Fraction.toNumber(Typography.minimumFontSize));
  });

  it('ends where the next step would be larger than the maximum font size when the factors are equal', () => {
    const exit = Typography.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 6n, denominator: 5n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });
    const highest = Exit.isSuccess(exit) ? exit.value.at(-1) : undefined;
    const nextMinimumSize = 16 * (6 / 5) ** 9;

    expect(highest?.position).toBe(8);
    expect(nextMinimumSize).toBeGreaterThan(Fraction.toNumber(Typography.maximumFontSize));
  });

  it('ends on both sides at the minimum step factor', () => {
    const exit = Typography.scale({
      minimumFactor: Typography.minimumStepFactor,
      maximumFactor: Typography.minimumStepFactor,
      maximumBodyFontSize: { numerator: 16n, denominator: 1n },
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];
    const previousMinimumSize = 16 * (780 / 781) ** 163;
    const nextMinimumSize = 16 * (781 / 780) ** 1165;

    expect(steps.at(0)?.position).toBe(-162);
    expect(steps.at(-1)?.position).toBe(1164);
    expect(previousMinimumSize).toBeLessThan(Fraction.toNumber(Typography.minimumFontSize));
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
          'Expected a minimum factor of at least 781/780, so that every step is larger than the one below and lengths of at least 1 em in consecutive steps never fall on the same point of the layout grid of a browser',
      },
      {
        path: ['maximumFactor'],
        message:
          'Expected a maximum factor of at least 781/780, so that every step is larger than the one below and lengths of at least 1 em in consecutive steps never fall on the same point of the layout grid of a browser',
      },
      {
        path: ['maximumBodyFontSize'],
        message:
          'Expected a body font size of at most 25.6 px, so that text can be enlarged to 200 % within the 300 % page zoom of Safari, as WCAG 2.2 Resize Text requires',
      },
    ]);
  });
});
