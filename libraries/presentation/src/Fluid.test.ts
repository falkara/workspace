import { describe, expect, it } from '@effect/vitest';
import { Exit, Option } from 'effect';

import * as Fluid from '#src/Fluid';
import * as Fraction from '#src/Fraction';
import * as Length from '#src/Length';
import * as Typography from '#src/Typography';
import * as Viewport from '#src/Viewport';

describe('clamp', () => {
  it('writes a CSS clamp() with the sizes in rem and the growth in vw', () => {
    const exit = Fluid.clamp(Fraction.make(16n, 1n), Fraction.make(20n, 1n));

    expect(Exit.isSuccess(exit) ? exit.value : '').toBe(
      'clamp(1rem, 0.9167rem + 0.4167vw, 1.25rem)',
    );
  });

  it('takes the minimum size at the minimum viewport width and the maximum size at the maximum viewport width', () => {
    const exit = Fluid.clamp(Fraction.make(16n, 1n), Fraction.make(20n, 1n));
    const [, minimum, intercept, , slope, maximum] =
      /^clamp\((-?[\d.]+)rem, (-?[\d.]+)rem ([+-]) ([\d.]+)vw, (-?[\d.]+)rem\)$/.exec(
        Exit.isSuccess(exit) ? exit.value : '',
      ) ?? [];
    const sizeAtMinimum = Math.min(
      Math.max(
        Number(intercept) * Typography.defaultFontSize +
          (Number(slope) * Viewport.minimumViewportWidth) / Length.viewportWidthUnits,
        Number(minimum) * Typography.defaultFontSize,
      ),
      Number(maximum) * Typography.defaultFontSize,
    );
    const sizeAtMaximum = Math.min(
      Math.max(
        Number(intercept) * Typography.defaultFontSize +
          (Number(slope) * Viewport.maximumViewportWidth) / Length.viewportWidthUnits,
        Number(minimum) * Typography.defaultFontSize,
      ),
      Number(maximum) * Typography.defaultFontSize,
    );

    expect(Math.abs(sizeAtMinimum - 16)).toBeLessThan(Length.layoutUnit);
    expect(Math.abs(sizeAtMaximum - 20)).toBeLessThan(Length.layoutUnit);
  });

  it('grows linearly between the minimum and the maximum viewport width', () => {
    const exit = Fluid.clamp(Fraction.make(16n, 1n), Fraction.make(20n, 1n));
    const [, minimum, intercept, , slope, maximum] =
      /^clamp\((-?[\d.]+)rem, (-?[\d.]+)rem ([+-]) ([\d.]+)vw, (-?[\d.]+)rem\)$/.exec(
        Exit.isSuccess(exit) ? exit.value : '',
      ) ?? [];
    const sizeHalfway = Math.min(
      Math.max(
        Number(intercept) * Typography.defaultFontSize +
          (Number(slope) * ((Viewport.minimumViewportWidth + Viewport.maximumViewportWidth) / 2)) /
            Length.viewportWidthUnits,
        Number(minimum) * Typography.defaultFontSize,
      ),
      Number(maximum) * Typography.defaultFontSize,
    );

    expect(Math.abs(sizeHalfway - 18)).toBeLessThan(Length.layoutUnit);
  });

  it('holds its sizes outside the viewport range', () => {
    const exit = Fluid.clamp(Fraction.make(16n, 1n), Fraction.make(20n, 1n));
    const [, minimum, intercept, , slope, maximum] =
      /^clamp\((-?[\d.]+)rem, (-?[\d.]+)rem ([+-]) ([\d.]+)vw, (-?[\d.]+)rem\)$/.exec(
        Exit.isSuccess(exit) ? exit.value : '',
      ) ?? [];
    const sizeBelow = Math.min(
      Math.max(
        Number(intercept) * Typography.defaultFontSize +
          (Number(slope) * (Viewport.minimumViewportWidth - 40)) / Length.viewportWidthUnits,
        Number(minimum) * Typography.defaultFontSize,
      ),
      Number(maximum) * Typography.defaultFontSize,
    );
    const sizeAbove = Math.min(
      Math.max(
        Number(intercept) * Typography.defaultFontSize +
          (Number(slope) * (Viewport.maximumViewportWidth + 320)) / Length.viewportWidthUnits,
        Number(minimum) * Typography.defaultFontSize,
      ),
      Number(maximum) * Typography.defaultFontSize,
    );

    expect(sizeBelow).toBe(16);
    expect(sizeAbove).toBe(20);
  });

  it('accepts a value that holds its size', () => {
    const exit = Fluid.clamp(Fraction.make(16n, 1n), Fraction.make(16n, 1n));

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('accepts a value that grows by the maximum text growth factor', () => {
    const exit = Fluid.clamp(
      Fraction.make(16n, 1n),
      Fraction.multiply(Fraction.make(16n, 1n), Typography.maximumTextGrowthFactor),
    );

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a value that would shrink', () => {
    const exit = Fluid.clamp(Fraction.make(20n, 1n), Fraction.make(16n, 1n));

    expect(Option.getOrThrow(Exit.findErrorOption(exit)).message).toContain('["maximumSize"]');
  });

  it('rejects a value that would grow by more than the maximum text growth factor', () => {
    const exit = Fluid.clamp(
      Fraction.make(16n, 1n),
      Fraction.sum(
        Fraction.multiply(Fraction.make(16n, 1n), Typography.maximumTextGrowthFactor),
        Fraction.make(1n, 10n),
      ),
    );

    expect(Option.getOrThrow(Exit.findErrorOption(exit)).message).toContain('["maximumSize"]');
  });
});
