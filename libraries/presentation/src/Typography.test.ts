import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Exit, Option, Rational, Schema, SchemaIssue } from 'effect';

import * as Length from '#src/Length';
import * as Typography from '#src/Typography';
import * as Viewport from '#src/Viewport';

describe('defaultFontSize', () => {
  it('is the font size the Baseline core browsers give the root element', () => {
    expect(Typography.defaultFontSize).toEqual(Rational.fromBigInt(16n));
  });
});

describe('highestMaximumDefaultFontSize', () => {
  it('is the largest default font size Chromium and Firefox let a reader set', () => {
    expect(Typography.highestMaximumDefaultFontSize).toEqual(Rational.fromBigInt(72n));
  });
});

describe('highestMaximumFontSizeFactor', () => {
  it('is positive', () => {
    expect(Rational.isPositive(Typography.highestMaximumFontSizeFactor)).toBe(true);
  });

  it('is 9/2, the largest default font size over the default font size', () => {
    expect(Typography.highestMaximumFontSizeFactor).toEqual(Rational.makeUnsafe(9n, 2n));
  });
});

describe('lowestMaximumFontSizeFactor', () => {
  it('is 1, as Safari lets a reader set no default font size', () => {
    expect(Typography.lowestMaximumFontSizeFactor).toEqual(Rational.fromBigInt(1n));
  });
});

describe('decimalPlaces', () => {
  it('keeps the rendered rounding below the finest layout unit for a reader at the highest maximum page zoom and font size', () => {
    const sizes = Array.from({ length: 100_000 }, (_, index) => index / 1000);
    const shares = Array.from({ length: 100_000 }, (_, index) => index / 10_000_000);
    const remError = Math.max(
      ...sizes.map((size) =>
        Math.abs(
          Math.round(
            (size / Rational.toNumberUnsafe(Typography.defaultFontSize)) *
              10 ** Typography.decimalPlaces,
          ) /
            10 ** Typography.decimalPlaces -
            size / Rational.toNumberUnsafe(Typography.defaultFontSize),
        ),
      ),
    );
    const vwError = Math.max(
      ...shares.map((share) =>
        Math.abs(
          Math.round(
            share *
              Rational.toNumberUnsafe(Length.viewportWidthUnits) *
              10 ** Typography.decimalPlaces,
          ) /
            10 ** Typography.decimalPlaces -
            share * Rational.toNumberUnsafe(Length.viewportWidthUnits),
        ),
      ),
    );
    const renderedError =
      Rational.toNumberUnsafe(Viewport.highestMaximumPageZoomFactor) *
      (remError *
        Rational.toNumberUnsafe(Typography.defaultFontSize) *
        Rational.toNumberUnsafe(Typography.highestMaximumFontSizeFactor) +
        (vwError * Rational.toNumberUnsafe(Viewport.maximumViewportWidth)) /
          Rational.toNumberUnsafe(Length.viewportWidthUnits));

    expect(renderedError).toBeLessThan(Rational.toNumberUnsafe(Length.finestLayoutUnit));
  });

  it('is the fewest decimal places that do', () => {
    const fewer = 10 ** (Typography.decimalPlaces - 1);
    const sizes = Array.from({ length: 100_000 }, (_, index) => index / 1000);
    const shares = Array.from({ length: 100_000 }, (_, index) => index / 10_000_000);
    const remError = Math.max(
      ...sizes.map((size) =>
        Math.abs(
          Math.round((size / Rational.toNumberUnsafe(Typography.defaultFontSize)) * fewer) / fewer -
            size / Rational.toNumberUnsafe(Typography.defaultFontSize),
        ),
      ),
    );
    const vwError = Math.max(
      ...shares.map((share) =>
        Math.abs(
          Math.round(share * Rational.toNumberUnsafe(Length.viewportWidthUnits) * fewer) / fewer -
            share * Rational.toNumberUnsafe(Length.viewportWidthUnits),
        ),
      ),
    );
    const renderedError =
      Rational.toNumberUnsafe(Viewport.highestMaximumPageZoomFactor) *
      (remError *
        Rational.toNumberUnsafe(Typography.defaultFontSize) *
        Rational.toNumberUnsafe(Typography.highestMaximumFontSizeFactor) +
        (vwError * Rational.toNumberUnsafe(Viewport.maximumViewportWidth)) /
          Rational.toNumberUnsafe(Length.viewportWidthUnits));

    expect(renderedError).toBeGreaterThanOrEqual(Rational.toNumberUnsafe(Length.finestLayoutUnit));
  });

  it('is 5', () => {
    expect(Typography.decimalPlaces).toBe(5);
  });
});

describe('minimumFontSize', () => {
  it('is the smallest size of the USWDS theme type scale in its default settings', () => {
    expect(Typography.minimumFontSize).toEqual(Rational.fromBigInt(13n));
  });
});

describe('ideographAdvanceFactor', () => {
  it('is the advance CSS Values 4 assumes for an ideograph it cannot measure', () => {
    expect(Typography.ideographAdvanceFactor).toEqual(Rational.fromBigInt(1n));
  });
});

describe('maximumFontSize', () => {
  it('is positive', () => {
    expect(Rational.isPositive(Typography.maximumFontSize)).toBe(true);
  });

  it('is 640/9 CSS pixels', () => {
    expect(Typography.maximumFontSize).toEqual(Rational.makeUnsafe(640n, 9n));
  });

  it('fits a full-width character into the minimum viewport width when a reader sets the largest default font size a browser allows', () => {
    const characterWidth = Rational.multiply(
      Typography.maximumFontSize,
      Rational.multiply(Typography.highestMaximumFontSizeFactor, Typography.ideographAdvanceFactor),
    );

    expect(characterWidth).toEqual(Viewport.minimumViewportWidth);
  });
});

describe('minimumStepFactor', () => {
  it('is positive', () => {
    expect(Rational.isPositive(Typography.minimumStepFactor)).toBe(true);
  });

  it('keeps steps at the minimum font size apart by the coarsest layout unit', () => {
    const nextSize = Rational.multiply(Typography.minimumFontSize, Typography.minimumStepFactor);

    expect(nextSize).toEqual(Rational.sum(Typography.minimumFontSize, Length.coarsestLayoutUnit));
  });
});

describe('textScaleFactor', () => {
  it('is the text resize WCAG 2.2 Resize Text requires content to support', () => {
    expect(Typography.textScaleFactor).toEqual(Rational.fromBigInt(2n));
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
    expect(Typography.lineHeightFactor).toEqual(Rational.makeUnsafe(3n, 2n));
  });
});

describe('paragraphSpacingLineFactor', () => {
  it('is how much larger than the line spacing WCAG 2.2 Visual Presentation requires paragraph spacing to be', () => {
    expect(Typography.paragraphSpacingLineFactor).toEqual(Rational.makeUnsafe(3n, 2n));
  });
});

describe('paragraphSpacingFactor', () => {
  it('is positive', () => {
    expect(Rational.isPositive(Typography.paragraphSpacingFactor)).toBe(true);
  });

  it('is 9/4', () => {
    expect(Typography.paragraphSpacingFactor).toEqual(Rational.makeUnsafe(9n, 4n));
  });

  it('is at least the paragraph spacing a reader may set under WCAG 2.2 Text Spacing', () => {
    expect(
      Rational.isGreaterThanOrEqualTo(
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
    expect(Typography.textSpacingLineHeightFactor).toEqual(Rational.makeUnsafe(3n, 2n));
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
    expect(Typography.textSpacingLetterSpacingFactor).toEqual(Rational.makeUnsafe(3n, 25n));
  });
});

describe('textSpacingWordSpacingFactor', () => {
  it('is the word spacing WCAG 2.2 Text Spacing lets a reader set', () => {
    expect(Typography.textSpacingWordSpacingFactor).toEqual(Rational.makeUnsafe(4n, 25n));
  });
});

describe('maximumTextGrowthFactor', () => {
  it('is positive', () => {
    expect(Rational.isPositive(Typography.maximumTextGrowthFactor)).toBe(true);
  });

  it('is 8/5 for the viewport range, the page zoom and the text scale it follows from', () => {
    expect(Typography.maximumTextGrowthFactor).toEqual(Rational.makeUnsafe(8n, 5n));
  });

  it('lets text that grows by it reach the text scale factor at the maximum page zoom', () => {
    const growth = Typography.maximumTextGrowthFactor;
    const zoomedWidthAboveMinimum = Rational.divideUnsafe(
      Rational.subtract(
        Viewport.maximumViewportWidth,
        Rational.multiply(Viewport.lowestMaximumPageZoomFactor, Viewport.minimumViewportWidth),
      ),
      Viewport.lowestMaximumPageZoomFactor,
    );
    const viewportRange = Rational.subtract(
      Viewport.maximumViewportWidth,
      Viewport.minimumViewportWidth,
    );
    const zoomedSize = Rational.sum(
      Rational.fromBigInt(1n),
      Rational.divideUnsafe(
        Rational.multiply(
          Rational.subtract(growth, Rational.fromBigInt(1n)),
          zoomedWidthAboveMinimum,
        ),
        viewportRange,
      ),
    );

    expect(Rational.multiply(Viewport.lowestMaximumPageZoomFactor, zoomedSize)).toEqual(
      Rational.multiply(Typography.textScaleFactor, growth),
    );
  });

  it('lets text that grows by it reach the text scale factor at a font size of the maximum page zoom', () => {
    const growth = Typography.maximumTextGrowthFactor;
    const viewportRange = Rational.subtract(
      Viewport.maximumViewportWidth,
      Viewport.minimumViewportWidth,
    );
    const slope = Rational.divideUnsafe(
      Rational.subtract(growth, Rational.fromBigInt(1n)),
      viewportRange,
    );
    const intercept = Rational.divideUnsafe(
      Rational.subtract(
        Viewport.maximumViewportWidth,
        Rational.multiply(growth, Viewport.minimumViewportWidth),
      ),
      viewportRange,
    );
    const resizedSize = Rational.sum(
      Rational.multiply(Viewport.lowestMaximumPageZoomFactor, intercept),
      Rational.multiply(slope, Viewport.maximumViewportWidth),
    );

    expect(resizedSize).toEqual(Rational.multiply(Typography.textScaleFactor, growth));
  });
});

describe('ScaleOptions', () => {
  it('accepts ratios above 1 that rise from the minimum to the maximum and a body size in range', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: Rational.makeUnsafe(6n, 5n),
      maximumFactor: Rational.makeUnsafe(5n, 4n),
      maximumBodyFontSize: Rational.fromBigInt(20n),
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('accepts a maximum factor below the minimum factor', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: Rational.makeUnsafe(5n, 4n),
      maximumFactor: Rational.makeUnsafe(6n, 5n),
      maximumBodyFontSize: Rational.fromBigInt(20n),
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a minimum factor of 1', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: Rational.fromBigInt(1n),
      maximumFactor: Rational.makeUnsafe(5n, 4n),
      maximumBodyFontSize: Rational.fromBigInt(20n),
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
      minimumFactor: Rational.makeUnsafe(6n, 5n),
      maximumFactor: Rational.makeUnsafe(6n, 5n),
      maximumBodyFontSize: Rational.fromBigInt(20n),
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('reports an invalid minimum factor and an invalid maximum factor at once', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)(
      {
        minimumFactor: Rational.fromBigInt(1n),
        maximumFactor: Rational.makeUnsafe(1n, 2n),
        maximumBodyFontSize: Rational.fromBigInt(20n),
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
      minimumFactor: Rational.makeUnsafe(6n, 5n),
      maximumFactor: Rational.makeUnsafe(5n, 4n),
      maximumBodyFontSize: Rational.fromBigInt(16n),
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('accepts a body size of the default font size grown by the maximum text growth factor', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: Rational.makeUnsafe(6n, 5n),
      maximumFactor: Rational.makeUnsafe(5n, 4n),
      maximumBodyFontSize: Rational.makeUnsafe(128n, 5n),
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a body size below the default font size', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: Rational.makeUnsafe(6n, 5n),
      maximumFactor: Rational.makeUnsafe(5n, 4n),
      maximumBodyFontSize: Rational.makeUnsafe(159n, 10n),
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
      minimumFactor: Rational.makeUnsafe(6n, 5n),
      maximumFactor: Rational.makeUnsafe(5n, 4n),
      maximumBodyFontSize: Rational.makeUnsafe(257n, 10n),
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
      minimumFactor: Rational.makeUnsafe(6n, 5n),
      maximumFactor: Rational.makeUnsafe(5n, 4n),
      maximumBodyFontSize: Rational.fromBigInt(20n),
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
      minimumSize: Rational.fromBigInt(12n),
      maximumSize: Rational.fromBigInt(15n),
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
      minimumSize: Rational.fromBigInt(120n),
      maximumSize: Rational.fromBigInt(150n),
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['minimumSize'],
        message:
          'Expected a minimum size of at most 71.11111 px, so that a full-width character fits the minimum viewport width of 320 px at a font size of 450 %, as WCAG 2.2 Reflow requires',
      },
    ]);
  });

  it('rejects a step that shrinks', () => {
    const exit = Schema.decodeExit(Typography.Step)({
      position: 0,
      minimumSize: Rational.fromBigInt(24n),
      maximumSize: Rational.fromBigInt(12n),
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

  it('gives sizes that are not whole rounded to the decimal places of a CSS length', () => {
    const exit = Schema.decodeExit(Typography.Step)({
      position: 0,
      minimumSize: Rational.makeUnsafe(56n, 3n),
      maximumSize: Rational.fromBigInt(16n),
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['maximumSize'],
        message:
          'Expected a maximum size of 18.66667 px to 29.86667 px, so that the step never shrinks below its size at the minimum viewport width and grows no faster than text that can be enlarged to 200 % within the 300 % page zoom of Safari, as WCAG 2.2 Resize Text requires',
      },
    ]);
  });

  it('rejects a step that grows by more than 8/5', () => {
    const exit = Schema.decodeExit(Typography.Step)({
      position: 0,
      minimumSize: Rational.fromBigInt(24n),
      maximumSize: Rational.fromBigInt(40n),
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
  it('sizes every step as body text times each factor to the power of its position', () => {
    for (const [minimumFactor, maximumFactor] of [
      [Rational.makeUnsafe(6n, 5n), Rational.makeUnsafe(5n, 4n)],
      [Typography.minimumStepFactor, Typography.minimumStepFactor],
    ] as const) {
      const exit = Typography.scale({
        minimumFactor,
        maximumFactor,
        maximumBodyFontSize: Rational.fromBigInt(20n),
      });
      const steps = Exit.isSuccess(exit) ? exit.value : [];

      expect(steps).not.toHaveLength(0);
      for (const step of steps) {
        expect(step.minimumSize).toEqual(
          Rational.multiply(
            Typography.defaultFontSize,
            Rational.powUnsafe(minimumFactor, step.position),
          ),
        );
        expect(step.maximumSize).toEqual(
          Rational.multiply(
            Rational.fromBigInt(20n),
            Rational.powUnsafe(maximumFactor, step.position),
          ),
        );
      }
    }
  });

  it('runs from small print to the largest heading that keeps text resizable', () => {
    const exit = Typography.scale({
      minimumFactor: Rational.makeUnsafe(6n, 5n),
      maximumFactor: Rational.makeUnsafe(5n, 4n),
      maximumBodyFontSize: Rational.fromBigInt(20n),
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps.map((step) => step.position)).toEqual([-1, 0, 1, 2, 3, 4, 5, 6]);
    expect(steps.at(0)).toEqual({
      position: -1,
      minimumSize: Rational.makeUnsafe(40n, 3n),
      maximumSize: Rational.fromBigInt(16n),
    });
    expect(steps.at(-1)).toEqual({
      position: 6,
      minimumSize: Rational.makeUnsafe(746_496n, 15_625n),
      maximumSize: Rational.makeUnsafe(78_125n, 1024n),
    });
  });

  it('starts at body text when body text keeps the default font size on every screen', () => {
    const exit = Typography.scale({
      minimumFactor: Rational.makeUnsafe(6n, 5n),
      maximumFactor: Rational.makeUnsafe(5n, 4n),
      maximumBodyFontSize: Rational.fromBigInt(16n),
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps.map((step) => step.position)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('keeps every step growing by 1 to 8/5 and between the minimum and the maximum font size', () => {
    const exit = Typography.scale({
      minimumFactor: Rational.makeUnsafe(6n, 5n),
      maximumFactor: Rational.makeUnsafe(5n, 4n),
      maximumBodyFontSize: Rational.fromBigInt(20n),
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps).not.toHaveLength(0);
    for (const step of steps) {
      const growth = Rational.divideUnsafe(step.maximumSize, step.minimumSize);

      expect(Rational.isGreaterThanOrEqualTo(growth, Rational.fromBigInt(1n))).toBe(true);
      expect(Rational.isLessThanOrEqualTo(growth, Typography.maximumTextGrowthFactor)).toBe(true);
      expect(Rational.isGreaterThanOrEqualTo(step.minimumSize, Typography.minimumFontSize)).toBe(
        true,
      );
      expect(Rational.isLessThanOrEqualTo(step.minimumSize, Typography.maximumFontSize)).toBe(true);
    }
  });

  it('ends where the next step would grow by more than 8/5', () => {
    const exit = Typography.scale({
      minimumFactor: Rational.makeUnsafe(6n, 5n),
      maximumFactor: Rational.makeUnsafe(5n, 4n),
      maximumBodyFontSize: Rational.fromBigInt(20n),
    });
    const highest = Exit.isSuccess(exit) ? exit.value.at(-1) : undefined;
    const nextGrowth = (20 * (5 / 4) ** 7) / (16 * (6 / 5) ** 7);

    expect(highest?.position).toBe(6);
    expect(nextGrowth).toBeGreaterThan(8 / 5);
  });

  it('ends where the next step would shrink when the maximum factor is below the minimum factor', () => {
    const exit = Typography.scale({
      minimumFactor: Rational.makeUnsafe(5n, 4n),
      maximumFactor: Rational.makeUnsafe(6n, 5n),
      maximumBodyFontSize: Rational.fromBigInt(20n),
    });
    const highest = Exit.isSuccess(exit) ? exit.value.at(-1) : undefined;
    const nextGrowth = (20 * (6 / 5) ** 6) / (16 * (5 / 4) ** 6);

    expect(highest?.position).toBe(5);
    expect(nextGrowth).toBeLessThan(1);
  });

  it('starts where the next step down would be smaller than the minimum font size', () => {
    const exit = Typography.scale({
      minimumFactor: Rational.makeUnsafe(6n, 5n),
      maximumFactor: Rational.makeUnsafe(5n, 4n),
      maximumBodyFontSize: Rational.fromBigInt(20n),
    });
    const lowest = Exit.isSuccess(exit) ? exit.value.at(0) : undefined;
    const nextMinimumSize = 16 * (5 / 6) ** 2;

    expect(lowest?.position).toBe(-1);
    expect(nextMinimumSize).toBeLessThan(Rational.toNumberUnsafe(Typography.minimumFontSize));
  });

  it('ends where the next step would be larger than the maximum font size when the factors are equal', () => {
    const exit = Typography.scale({
      minimumFactor: Rational.makeUnsafe(6n, 5n),
      maximumFactor: Rational.makeUnsafe(6n, 5n),
      maximumBodyFontSize: Rational.fromBigInt(20n),
    });
    const highest = Exit.isSuccess(exit) ? exit.value.at(-1) : undefined;
    const nextMinimumSize = 16 * (6 / 5) ** 9;

    expect(highest?.position).toBe(8);
    expect(nextMinimumSize).toBeGreaterThan(Rational.toNumberUnsafe(Typography.maximumFontSize));
  });

  it('ends on both sides at the minimum step factor', () => {
    const exit = Typography.scale({
      minimumFactor: Typography.minimumStepFactor,
      maximumFactor: Typography.minimumStepFactor,
      maximumBodyFontSize: Rational.fromBigInt(16n),
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];
    const previousMinimumSize = 16 * (780 / 781) ** 163;
    const nextMinimumSize = 16 * (781 / 780) ** 1165;

    expect(steps.at(0)?.position).toBe(-162);
    expect(steps.at(-1)?.position).toBe(1164);
    expect(previousMinimumSize).toBeLessThan(Rational.toNumberUnsafe(Typography.minimumFontSize));
    expect(nextMinimumSize).toBeGreaterThan(Rational.toNumberUnsafe(Typography.maximumFontSize));
  });

  it('reports every invalid option at once', () => {
    const exit = Typography.scale({
      minimumFactor: Rational.fromBigInt(1n),
      maximumFactor: Rational.makeUnsafe(1n, 2n),
      maximumBodyFontSize: Rational.fromBigInt(40n),
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
