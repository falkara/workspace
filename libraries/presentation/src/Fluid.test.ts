import { describe, expect, it } from '@effect/vitest';

import * as Fluid from '#src/Fluid';
import * as Length from '#src/Length';
import * as Typography from '#src/Typography';
import * as Viewport from '#src/Viewport';

describe('clamp', () => {
  it('writes a CSS clamp() with the sizes in rem and the growth in vw', () => {
    expect(Fluid.clamp(16, 20)).toBe('clamp(1rem, 0.9167rem + 0.4167vw, 1.25rem)');
  });

  it('takes the minimum size at the minimum viewport width and the maximum size at the maximum viewport width', () => {
    const [, minimum, intercept, , slope, maximum] =
      /^clamp\((-?[\d.]+)rem, (-?[\d.]+)rem ([+-]) ([\d.]+)vw, (-?[\d.]+)rem\)$/.exec(
        Fluid.clamp(16, 20),
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
    const [, minimum, intercept, , slope, maximum] =
      /^clamp\((-?[\d.]+)rem, (-?[\d.]+)rem ([+-]) ([\d.]+)vw, (-?[\d.]+)rem\)$/.exec(
        Fluid.clamp(16, 20),
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
    const [, minimum, intercept, , slope, maximum] =
      /^clamp\((-?[\d.]+)rem, (-?[\d.]+)rem ([+-]) ([\d.]+)vw, (-?[\d.]+)rem\)$/.exec(
        Fluid.clamp(16, 20),
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

  it('shrinks from the minimum to the maximum viewport width when the maximum size is the smaller', () => {
    const value = Fluid.clamp(20, 16);
    const [, minimum, intercept, sign, slope, maximum] =
      /^clamp\((-?[\d.]+)rem, (-?[\d.]+)rem ([+-]) ([\d.]+)vw, (-?[\d.]+)rem\)$/.exec(value) ?? [];
    const sizeAtMinimum = Math.min(
      Math.max(
        Number(intercept) * Typography.defaultFontSize -
          (Number(slope) * Viewport.minimumViewportWidth) / Length.viewportWidthUnits,
        Number(minimum) * Typography.defaultFontSize,
      ),
      Number(maximum) * Typography.defaultFontSize,
    );
    const sizeAtMaximum = Math.min(
      Math.max(
        Number(intercept) * Typography.defaultFontSize -
          (Number(slope) * Viewport.maximumViewportWidth) / Length.viewportWidthUnits,
        Number(minimum) * Typography.defaultFontSize,
      ),
      Number(maximum) * Typography.defaultFontSize,
    );

    expect(value).toBe('clamp(1rem, 1.3333rem - 0.4167vw, 1.25rem)');
    expect(sign).toBe('-');
    expect(Math.abs(sizeAtMinimum - 20)).toBeLessThan(Length.layoutUnit);
    expect(Math.abs(sizeAtMaximum - 16)).toBeLessThan(Length.layoutUnit);
  });
});
