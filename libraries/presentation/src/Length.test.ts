import { describe, expect, it } from '@effect/vitest';

import * as Length from '#src/Length';

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
