import { describe, expect, it } from '@effect/vitest';
import { Exit, Option, Schema } from 'effect';

import * as Fraction from '#src/Fraction';
import * as Typography from '#src/Typography';
import * as Viewport from '#src/Viewport';

describe('defaultFontSize', () => {
  it('is the font size the Baseline core browsers give the root element', () => {
    expect(Typography.defaultFontSize).toBe(16);
  });
});

describe('minimumFontSize', () => {
  it('is the smallest size of the USWDS theme type scale', () => {
    expect(Typography.minimumFontSize).toBe(12);
  });
});

describe('textScaleFactor', () => {
  it('is the text resize WCAG 2.2 Resize Text requires content to support', () => {
    expect(Typography.textScaleFactor).toBe(2);
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

  it('rejects a minimum factor of 1', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: { numerator: 1n, denominator: 1n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });

    expect(Option.getOrThrow(Exit.findErrorOption(exit)).message).toContain('["minimumFactor"]');
  });

  it('rejects a maximum factor equal to the minimum factor', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 6n, denominator: 5n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });

    expect(Option.getOrThrow(Exit.findErrorOption(exit)).message).toContain('["maximumFactor"]');
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
    const message = Option.getOrThrow(Exit.findErrorOption(exit)).message;

    expect(message).toContain('["minimumFactor"]');
    expect(message).toContain('["maximumFactor"]');
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

    expect(Option.getOrThrow(Exit.findErrorOption(exit)).message).toContain(
      '["maximumBodyFontSize"]',
    );
  });

  it('rejects a body size above the default font size grown by the maximum text growth factor', () => {
    const exit = Schema.decodeExit(Typography.ScaleOptions)({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 257n, denominator: 10n },
    });

    expect(Option.getOrThrow(Exit.findErrorOption(exit)).message).toContain(
      '["maximumBodyFontSize"]',
    );
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
    expect(steps.at(0)).toEqual({ position: -1, minimumSize: 40 / 3, maximumSize: 16 });
    expect(steps.at(-1)).toEqual({
      position: 6,
      minimumSize: 746_496 / 15_625,
      maximumSize: 312_500 / 4096,
    });
  });

  it('starts at body text when body text keeps the default font size on every screen', () => {
    const exit = Typography.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 16n, denominator: 1n },
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps.map((step) => step.position)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('keeps every step growing by 1 to 8/5 and at or above the minimum font size', () => {
    const exit = Typography.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps).not.toHaveLength(0);
    for (const step of steps) {
      expect(step.maximumSize / step.minimumSize).toBeGreaterThanOrEqual(1);
      expect(step.maximumSize / step.minimumSize).toBeLessThanOrEqual(8 / 5);
      expect(step.minimumSize).toBeGreaterThanOrEqual(12);
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

  it('starts where the next step down would be smaller than the minimum font size', () => {
    const exit = Typography.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });
    const lowest = Exit.isSuccess(exit) ? exit.value.at(0) : undefined;
    const nextMinimumSize = 16 * (5 / 6) ** 2;

    expect(lowest?.position).toBe(-1);
    expect(nextMinimumSize).toBeLessThan(12);
  });

  it('reports every invalid option at once', () => {
    const exit = Typography.scale({
      minimumFactor: { numerator: 1n, denominator: 1n },
      maximumFactor: { numerator: 1n, denominator: 2n },
      maximumBodyFontSize: { numerator: 40n, denominator: 1n },
    });
    const message = Option.getOrThrow(Exit.findErrorOption(exit)).message;

    expect(message).toContain('["minimumFactor"]');
    expect(message).toContain('["maximumFactor"]');
    expect(message).toContain('["maximumBodyFontSize"]');
  });
});
