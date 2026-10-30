import { describe, expect, it } from '@effect/vitest';
import { Exit, Option, SchemaIssue } from 'effect';

import * as Fluid from '#src/Fluid';
import * as Fraction from '#src/Fraction';
import * as Length from '#src/Length';
import * as Typography from '#src/Typography';
import * as Viewport from '#src/Viewport';

describe('decimalPlaces', () => {
  it('keeps the rendered rounding below the finest layout unit for a reader at the maximum page zoom and font size', () => {
    const sizes = Array.from({ length: 100_000 }, (_, index) => index / 1000);
    const shares = Array.from({ length: 100_000 }, (_, index) => index / 10_000_000);
    const remError = Math.max(
      ...sizes.map((size) =>
        Math.abs(
          Number.parseFloat(Fluid.rem(size)) - size / Fraction.toNumber(Typography.defaultFontSize),
        ),
      ),
    );
    const vwError = Math.max(
      ...shares.map((share) =>
        Math.abs(
          Number.parseFloat(Fluid.vw(share)) - share * Fraction.toNumber(Length.viewportWidthUnits),
        ),
      ),
    );
    const renderedError =
      Fraction.toNumber(Viewport.maximumPageZoomFactor) *
      (remError *
        Fraction.toNumber(Typography.defaultFontSize) *
        Fraction.toNumber(Viewport.maximumPageZoomFactor) +
        (vwError * Fraction.toNumber(Viewport.maximumViewportWidth)) /
          Fraction.toNumber(Length.viewportWidthUnits));

    expect(renderedError).toBeLessThan(Fraction.toNumber(Length.finestLayoutUnit));
  });

  it('is the fewest decimal places that do', () => {
    const fewer = 10 ** (Fluid.decimalPlaces - 1);
    const sizes = Array.from({ length: 100_000 }, (_, index) => index / 1000);
    const shares = Array.from({ length: 100_000 }, (_, index) => index / 10_000_000);
    const remError = Math.max(
      ...sizes.map((size) =>
        Math.abs(
          Math.round((size / Fraction.toNumber(Typography.defaultFontSize)) * fewer) / fewer -
            size / Fraction.toNumber(Typography.defaultFontSize),
        ),
      ),
    );
    const vwError = Math.max(
      ...shares.map((share) =>
        Math.abs(
          Math.round(share * Fraction.toNumber(Length.viewportWidthUnits) * fewer) / fewer -
            share * Fraction.toNumber(Length.viewportWidthUnits),
        ),
      ),
    );
    const renderedError =
      Fraction.toNumber(Viewport.maximumPageZoomFactor) *
      (remError *
        Fraction.toNumber(Typography.defaultFontSize) *
        Fraction.toNumber(Viewport.maximumPageZoomFactor) +
        (vwError * Fraction.toNumber(Viewport.maximumViewportWidth)) /
          Fraction.toNumber(Length.viewportWidthUnits));

    expect(renderedError).toBeGreaterThanOrEqual(Fraction.toNumber(Length.finestLayoutUnit));
  });

  it('is 4', () => {
    expect(Fluid.decimalPlaces).toBe(4);
  });
});

describe('rem', () => {
  it('writes a size in rem of the default font size', () => {
    expect(Fluid.rem(16)).toBe('1rem');
    expect(Fluid.rem(20)).toBe('1.25rem');
  });

  it('rounds to the decimal places', () => {
    expect(Fluid.rem(40 / 3)).toBe('0.8333rem');
  });

  it('writes a negative size with its sign', () => {
    expect(Fluid.rem(-8)).toBe('-0.5rem');
  });
});

describe('vw', () => {
  it('writes a share of the viewport width in vw', () => {
    expect(Fluid.vw(1 / Fraction.toNumber(Length.viewportWidthUnits))).toBe('1vw');
  });

  it('rounds to the decimal places', () => {
    expect(Fluid.vw(1 / 240)).toBe('0.4167vw');
  });
});

describe('clamp', () => {
  it('takes sizes written as plain fractions and reduces them', () => {
    const exit = Fluid.clamp(
      { numerator: 32n, denominator: 2n },
      { numerator: 20n, denominator: 1n },
    );

    expect(Exit.isSuccess(exit) ? exit.value : '').toBe(
      'clamp(1rem, 0.9167rem + 0.4167vw, 1.25rem)',
    );
  });

  it('rejects a size that is not a positive fraction, with the reason', () => {
    const exit = Fluid.clamp(
      { numerator: 0n, denominator: 1n },
      { numerator: 20n, denominator: 1n },
    );

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['minimumSize', 'numerator'],
        message:
          'Expected a positive numerator, so that every operation on the fraction keeps it positive',
      },
    ]);
  });

  it('writes a CSS clamp() with the sizes in rem and the growth in vw', () => {
    const exit = Fluid.clamp(Fraction.makeUnsafe(16n, 1n), Fraction.makeUnsafe(20n, 1n));

    expect(Exit.isSuccess(exit) ? exit.value : '').toBe(
      'clamp(1rem, 0.9167rem + 0.4167vw, 1.25rem)',
    );
  });

  it('takes the minimum size at the minimum viewport width and the maximum size at the maximum viewport width', () => {
    const exit = Fluid.clamp(Fraction.makeUnsafe(16n, 1n), Fraction.makeUnsafe(20n, 1n));
    const [, minimum, intercept, , slope, maximum] =
      /^clamp\((-?[\d.]+)rem, (-?[\d.]+)rem ([+-]) ([\d.]+)vw, (-?[\d.]+)rem\)$/.exec(
        Exit.isSuccess(exit) ? exit.value : '',
      ) ?? [];
    const sizeAtMinimum = Math.min(
      Math.max(
        Number(intercept) * Fraction.toNumber(Typography.defaultFontSize) +
          (Number(slope) * Fraction.toNumber(Viewport.minimumViewportWidth)) /
            Fraction.toNumber(Length.viewportWidthUnits),
        Number(minimum) * Fraction.toNumber(Typography.defaultFontSize),
      ),
      Number(maximum) * Fraction.toNumber(Typography.defaultFontSize),
    );
    const sizeAtMaximum = Math.min(
      Math.max(
        Number(intercept) * Fraction.toNumber(Typography.defaultFontSize) +
          (Number(slope) * Fraction.toNumber(Viewport.maximumViewportWidth)) /
            Fraction.toNumber(Length.viewportWidthUnits),
        Number(minimum) * Fraction.toNumber(Typography.defaultFontSize),
      ),
      Number(maximum) * Fraction.toNumber(Typography.defaultFontSize),
    );

    expect(Math.abs(sizeAtMinimum - 16)).toBeLessThan(Fraction.toNumber(Length.finestLayoutUnit));
    expect(Math.abs(sizeAtMaximum - 20)).toBeLessThan(Fraction.toNumber(Length.finestLayoutUnit));
  });

  it('grows linearly between the minimum and the maximum viewport width', () => {
    const exit = Fluid.clamp(Fraction.makeUnsafe(16n, 1n), Fraction.makeUnsafe(20n, 1n));
    const [, minimum, intercept, , slope, maximum] =
      /^clamp\((-?[\d.]+)rem, (-?[\d.]+)rem ([+-]) ([\d.]+)vw, (-?[\d.]+)rem\)$/.exec(
        Exit.isSuccess(exit) ? exit.value : '',
      ) ?? [];
    const sizeHalfway = Math.min(
      Math.max(
        Number(intercept) * Fraction.toNumber(Typography.defaultFontSize) +
          (Number(slope) *
            ((Fraction.toNumber(Viewport.minimumViewportWidth) +
              Fraction.toNumber(Viewport.maximumViewportWidth)) /
              2)) /
            Fraction.toNumber(Length.viewportWidthUnits),
        Number(minimum) * Fraction.toNumber(Typography.defaultFontSize),
      ),
      Number(maximum) * Fraction.toNumber(Typography.defaultFontSize),
    );

    expect(Math.abs(sizeHalfway - 18)).toBeLessThan(Fraction.toNumber(Length.finestLayoutUnit));
  });

  it('holds its sizes outside the viewport range', () => {
    const exit = Fluid.clamp(Fraction.makeUnsafe(16n, 1n), Fraction.makeUnsafe(20n, 1n));
    const [, minimum, intercept, , slope, maximum] =
      /^clamp\((-?[\d.]+)rem, (-?[\d.]+)rem ([+-]) ([\d.]+)vw, (-?[\d.]+)rem\)$/.exec(
        Exit.isSuccess(exit) ? exit.value : '',
      ) ?? [];
    const sizeBelow = Math.min(
      Math.max(
        Number(intercept) * Fraction.toNumber(Typography.defaultFontSize) +
          (Number(slope) * (Fraction.toNumber(Viewport.minimumViewportWidth) - 40)) /
            Fraction.toNumber(Length.viewportWidthUnits),
        Number(minimum) * Fraction.toNumber(Typography.defaultFontSize),
      ),
      Number(maximum) * Fraction.toNumber(Typography.defaultFontSize),
    );
    const sizeAbove = Math.min(
      Math.max(
        Number(intercept) * Fraction.toNumber(Typography.defaultFontSize) +
          (Number(slope) * (Fraction.toNumber(Viewport.maximumViewportWidth) + 320)) /
            Fraction.toNumber(Length.viewportWidthUnits),
        Number(minimum) * Fraction.toNumber(Typography.defaultFontSize),
      ),
      Number(maximum) * Fraction.toNumber(Typography.defaultFontSize),
    );

    expect(sizeBelow).toBe(16);
    expect(sizeAbove).toBe(20);
  });

  it('accepts a value that holds its size', () => {
    const exit = Fluid.clamp(Fraction.makeUnsafe(16n, 1n), Fraction.makeUnsafe(16n, 1n));

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('accepts a value that grows by the maximum text growth factor', () => {
    const exit = Fluid.clamp(
      Fraction.makeUnsafe(16n, 1n),
      Fraction.multiply(Fraction.makeUnsafe(16n, 1n), Typography.maximumTextGrowthFactor),
    );

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a value that would shrink', () => {
    const exit = Fluid.clamp(Fraction.makeUnsafe(20n, 1n), Fraction.makeUnsafe(16n, 1n));

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['maximumSize'],
        message:
          'Expected a maximum size of 20 px to 32 px, so that the value never shrinks and grows no faster than text that can be enlarged to 200 % within the 300 % page zoom of Safari, as WCAG 2.2 Resize Text requires',
      },
    ]);
  });

  it('rejects a value that would grow by more than the maximum text growth factor', () => {
    const exit = Fluid.clamp(
      Fraction.makeUnsafe(16n, 1n),
      Fraction.sum(
        Fraction.multiply(Fraction.makeUnsafe(16n, 1n), Typography.maximumTextGrowthFactor),
        Fraction.makeUnsafe(1n, 10n),
      ),
    );

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['maximumSize'],
        message:
          'Expected a maximum size of 16 px to 25.6 px, so that the value never shrinks and grows no faster than text that can be enlarged to 200 % within the 300 % page zoom of Safari, as WCAG 2.2 Resize Text requires',
      },
    ]);
  });
});
