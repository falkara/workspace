import { describe, expect, it } from '@effect/vitest';

import * as Length from '#src/Length';
import * as Typography from '#src/Typography';
import * as Viewport from '#src/Viewport';

describe('layoutUnit', () => {
  it('is the layout unit of WebKit and Chromium, the finest among the Baseline core browsers', () => {
    expect(Length.layoutUnit).toBe(1 / 64);
  });
});

describe('inch', () => {
  it('is the length of a CSS inch', () => {
    expect(Length.inch).toBe(96);
  });
});

describe('pointsPerInch', () => {
  it('is the number of CSS points in a CSS inch', () => {
    expect(Length.pointsPerInch).toBe(72);
  });
});

describe('point', () => {
  it('is 4/3 CSS pixels', () => {
    expect(Length.point).toEqual({ numerator: 4n, denominator: 3n });
  });
});

describe('viewportWidthUnits', () => {
  it('is the number of vw units CSS Values defines in the viewport width', () => {
    expect(Length.viewportWidthUnits).toBe(100);
  });
});

describe('decimalPlaces', () => {
  it('keeps the rendered rounding below the layout unit for a reader at the maximum page zoom and font size', () => {
    const sizes = Array.from({ length: 100_000 }, (_, index) => index / 1000);
    const shares = Array.from({ length: 100_000 }, (_, index) => index / 10_000_000);
    const remError = Math.max(
      ...sizes.map((size) =>
        Math.abs(Number.parseFloat(Length.rem(size)) - size / Typography.defaultFontSize),
      ),
    );
    const vwError = Math.max(
      ...shares.map((share) =>
        Math.abs(Number.parseFloat(Length.vw(share)) - share * Length.viewportWidthUnits),
      ),
    );
    const renderedError =
      Viewport.maximumPageZoomFactor *
      (remError * Typography.defaultFontSize * Viewport.maximumPageZoomFactor +
        (vwError * Viewport.maximumViewportWidth) / Length.viewportWidthUnits);

    expect(renderedError).toBeLessThan(Length.layoutUnit);
  });

  it('is the fewest decimal places that do', () => {
    const fewer = 10 ** (Length.decimalPlaces - 1);
    const sizes = Array.from({ length: 100_000 }, (_, index) => index / 1000);
    const shares = Array.from({ length: 100_000 }, (_, index) => index / 10_000_000);
    const remError = Math.max(
      ...sizes.map((size) =>
        Math.abs(
          Math.round((size / Typography.defaultFontSize) * fewer) / fewer -
            size / Typography.defaultFontSize,
        ),
      ),
    );
    const vwError = Math.max(
      ...shares.map((share) =>
        Math.abs(
          Math.round(share * Length.viewportWidthUnits * fewer) / fewer -
            share * Length.viewportWidthUnits,
        ),
      ),
    );
    const renderedError =
      Viewport.maximumPageZoomFactor *
      (remError * Typography.defaultFontSize * Viewport.maximumPageZoomFactor +
        (vwError * Viewport.maximumViewportWidth) / Length.viewportWidthUnits);

    expect(renderedError).toBeGreaterThanOrEqual(Length.layoutUnit);
  });

  it('is 4', () => {
    expect(Length.decimalPlaces).toBe(4);
  });
});

describe('rem', () => {
  it('writes a size in rem of the default font size', () => {
    expect(Length.rem(16)).toBe('1rem');
    expect(Length.rem(20)).toBe('1.25rem');
  });

  it('rounds to the decimal places', () => {
    expect(Length.rem(40 / 3)).toBe('0.8333rem');
  });

  it('writes a negative size with its sign', () => {
    expect(Length.rem(-8)).toBe('-0.5rem');
  });
});

describe('vw', () => {
  it('writes a share of the viewport width in vw', () => {
    expect(Length.vw(1 / Length.viewportWidthUnits)).toBe('1vw');
  });

  it('rounds to the decimal places', () => {
    expect(Length.vw(1 / 240)).toBe('0.4167vw');
  });
});
