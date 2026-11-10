import { describe, expect, it } from '@effect/vitest';
import { Exit, Option, Rational, SchemaIssue } from 'effect';

import * as Fluid from '#src/Fluid';
import * as Length from '#src/Length';
import * as Typography from '#src/Typography';
import * as Viewport from '#src/Viewport';

describe('rem', () => {
  it('writes a size in rem of the default font size', () => {
    expect(Fluid.rem(16)).toBe('1rem');
    expect(Fluid.rem(20)).toBe('1.25rem');
  });

  it('rounds to the decimal places', () => {
    expect(Fluid.rem(40 / 3)).toBe('0.83333rem');
  });

  it('writes a negative size with its sign', () => {
    expect(Fluid.rem(-8)).toBe('-0.5rem');
  });
});

describe('vw', () => {
  it('writes a share of the viewport width in vw', () => {
    expect(Fluid.vw(1 / Rational.toNumberUnsafe(Length.viewportWidthUnits))).toBe('1vw');
  });

  it('rounds to the decimal places', () => {
    expect(Fluid.vw(1 / 240)).toBe('0.41667vw');
  });
});

describe('clamp', () => {
  it('writes a value that never changes as its rem length alone', () => {
    const exit = Fluid.clamp({
      minimumSize: Rational.fromBigInt(16n),
      maximumSize: Rational.fromBigInt(16n),
    });

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toBe('1rem');
  });

  it('writes a value whose sizes are written alike as their rem length alone', () => {
    const exit = Fluid.clamp({
      minimumSize: Rational.fromBigInt(16n),
      maximumSize: Rational.makeUnsafe(16_000_000_001n, 1_000_000_000n),
    });

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toBe('1rem');
  });

  it('takes sizes written as plain fractions and reduces them', () => {
    const exit = Fluid.clamp({
      minimumSize: Rational.makeUnsafe(32n, 2n),
      maximumSize: Rational.fromBigInt(20n),
    });

    expect(Exit.isSuccess(exit) ? exit.value : '').toBe(
      'clamp(1rem, 0.91667rem + 0.41667vw, 1.25rem)',
    );
  });

  it('takes a step as it is, whatever else it holds besides its sizes', () => {
    const step = {
      position: 0,
      minimumSize: Rational.fromBigInt(16n),
      maximumSize: Rational.fromBigInt(20n),
    };
    const exit = Fluid.clamp(step);

    expect(Exit.isSuccess(exit) ? exit.value : '').toBe(
      'clamp(1rem, 0.91667rem + 0.41667vw, 1.25rem)',
    );
  });

  it('rejects a minimum size that is not positive, with the reason', () => {
    const exit = Fluid.clamp({
      minimumSize: Rational.fromBigInt(0n),
      maximumSize: Rational.fromBigInt(20n),
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['minimumSize'],
        message:
          'Expected a positive size, as the growth of a value is bounded as a factor of its size at the minimum viewport width',
      },
    ]);
  });

  it('writes a CSS clamp() with the sizes in rem and the growth in vw', () => {
    const exit = Fluid.clamp({
      minimumSize: Rational.fromBigInt(16n),
      maximumSize: Rational.fromBigInt(20n),
    });

    expect(Exit.isSuccess(exit) ? exit.value : '').toBe(
      'clamp(1rem, 0.91667rem + 0.41667vw, 1.25rem)',
    );
  });

  it('takes the minimum size at the minimum viewport width and the maximum size at the maximum viewport width', () => {
    const exit = Fluid.clamp({
      minimumSize: Rational.fromBigInt(16n),
      maximumSize: Rational.fromBigInt(20n),
    });
    const [, minimum, intercept, , slope, maximum] =
      /^clamp\((-?[\d.]+)rem, (-?[\d.]+)rem ([+-]) ([\d.]+)vw, (-?[\d.]+)rem\)$/.exec(
        Exit.isSuccess(exit) ? exit.value : '',
      ) ?? [];
    const sizeAtMinimum = Math.min(
      Math.max(
        Number(intercept) * Rational.toNumberUnsafe(Typography.defaultFontSize) +
          (Number(slope) * Rational.toNumberUnsafe(Viewport.minimumViewportWidth)) /
            Rational.toNumberUnsafe(Length.viewportWidthUnits),
        Number(minimum) * Rational.toNumberUnsafe(Typography.defaultFontSize),
      ),
      Number(maximum) * Rational.toNumberUnsafe(Typography.defaultFontSize),
    );
    const sizeAtMaximum = Math.min(
      Math.max(
        Number(intercept) * Rational.toNumberUnsafe(Typography.defaultFontSize) +
          (Number(slope) * Rational.toNumberUnsafe(Viewport.maximumViewportWidth)) /
            Rational.toNumberUnsafe(Length.viewportWidthUnits),
        Number(minimum) * Rational.toNumberUnsafe(Typography.defaultFontSize),
      ),
      Number(maximum) * Rational.toNumberUnsafe(Typography.defaultFontSize),
    );

    expect(Math.abs(sizeAtMinimum - 16)).toBeLessThan(
      Rational.toNumberUnsafe(Length.finestLayoutUnit),
    );
    expect(Math.abs(sizeAtMaximum - 20)).toBeLessThan(
      Rational.toNumberUnsafe(Length.finestLayoutUnit),
    );
  });

  it('grows linearly between the minimum and the maximum viewport width', () => {
    const exit = Fluid.clamp({
      minimumSize: Rational.fromBigInt(16n),
      maximumSize: Rational.fromBigInt(20n),
    });
    const [, minimum, intercept, , slope, maximum] =
      /^clamp\((-?[\d.]+)rem, (-?[\d.]+)rem ([+-]) ([\d.]+)vw, (-?[\d.]+)rem\)$/.exec(
        Exit.isSuccess(exit) ? exit.value : '',
      ) ?? [];
    const sizeHalfway = Math.min(
      Math.max(
        Number(intercept) * Rational.toNumberUnsafe(Typography.defaultFontSize) +
          (Number(slope) *
            ((Rational.toNumberUnsafe(Viewport.minimumViewportWidth) +
              Rational.toNumberUnsafe(Viewport.maximumViewportWidth)) /
              2)) /
            Rational.toNumberUnsafe(Length.viewportWidthUnits),
        Number(minimum) * Rational.toNumberUnsafe(Typography.defaultFontSize),
      ),
      Number(maximum) * Rational.toNumberUnsafe(Typography.defaultFontSize),
    );

    expect(Math.abs(sizeHalfway - 18)).toBeLessThan(
      Rational.toNumberUnsafe(Length.finestLayoutUnit),
    );
  });

  it('holds its sizes outside the viewport range', () => {
    const exit = Fluid.clamp({
      minimumSize: Rational.fromBigInt(16n),
      maximumSize: Rational.fromBigInt(20n),
    });
    const [, minimum, intercept, , slope, maximum] =
      /^clamp\((-?[\d.]+)rem, (-?[\d.]+)rem ([+-]) ([\d.]+)vw, (-?[\d.]+)rem\)$/.exec(
        Exit.isSuccess(exit) ? exit.value : '',
      ) ?? [];
    const sizeBelow = Math.min(
      Math.max(
        Number(intercept) * Rational.toNumberUnsafe(Typography.defaultFontSize) +
          (Number(slope) * (Rational.toNumberUnsafe(Viewport.minimumViewportWidth) - 40)) /
            Rational.toNumberUnsafe(Length.viewportWidthUnits),
        Number(minimum) * Rational.toNumberUnsafe(Typography.defaultFontSize),
      ),
      Number(maximum) * Rational.toNumberUnsafe(Typography.defaultFontSize),
    );
    const sizeAbove = Math.min(
      Math.max(
        Number(intercept) * Rational.toNumberUnsafe(Typography.defaultFontSize) +
          (Number(slope) * (Rational.toNumberUnsafe(Viewport.maximumViewportWidth) + 320)) /
            Rational.toNumberUnsafe(Length.viewportWidthUnits),
        Number(minimum) * Rational.toNumberUnsafe(Typography.defaultFontSize),
      ),
      Number(maximum) * Rational.toNumberUnsafe(Typography.defaultFontSize),
    );

    expect(sizeBelow).toBe(16);
    expect(sizeAbove).toBe(20);
  });

  it('accepts a value that holds its size', () => {
    const exit = Fluid.clamp({
      minimumSize: Rational.fromBigInt(16n),
      maximumSize: Rational.fromBigInt(16n),
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('accepts a value that grows by the maximum text growth factor', () => {
    const exit = Fluid.clamp({
      minimumSize: Rational.fromBigInt(16n),
      maximumSize: Rational.multiply(Rational.fromBigInt(16n), Typography.maximumTextGrowthFactor),
    });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a value that would shrink', () => {
    const exit = Fluid.clamp({
      minimumSize: Rational.fromBigInt(20n),
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
          'Expected a maximum size of 20 px to 32 px, so that the value never shrinks and grows no faster than text that can be enlarged to 200 %, as WCAG 2.2 Resize Text requires, within the 300 % page zoom of Safari, the lowest maximum among the Baseline core browsers',
      },
    ]);
  });

  it('rejects a value that would grow by more than the maximum text growth factor', () => {
    const exit = Fluid.clamp({
      minimumSize: Rational.fromBigInt(16n),
      maximumSize: Rational.sum(
        Rational.multiply(Rational.fromBigInt(16n), Typography.maximumTextGrowthFactor),
        Rational.makeUnsafe(1n, 10n),
      ),
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['maximumSize'],
        message:
          'Expected a maximum size of 16 px to 25.6 px, so that the value never shrinks and grows no faster than text that can be enlarged to 200 %, as WCAG 2.2 Resize Text requires, within the 300 % page zoom of Safari, the lowest maximum among the Baseline core browsers',
      },
    ]);
  });
});
