import { describe, expect, it } from '@effect/vitest';
import { Schema } from 'effect';

import * as Fraction from '#src/Fraction';
import * as Length from '#src/Length';

describe('layoutUnit', () => {
  it('is the layout unit of WebKit and Chromium, the finest among the Baseline core browsers', () => {
    expect(Length.layoutUnit).toEqual({ numerator: 1n, denominator: 64n });
  });
});

describe('inch', () => {
  it('is the length of a CSS inch', () => {
    expect(Length.inch).toEqual({ numerator: 96n, denominator: 1n });
  });
});

describe('pointsPerInch', () => {
  it('is the number of CSS points in a CSS inch', () => {
    expect(Length.pointsPerInch).toEqual({ numerator: 72n, denominator: 1n });
  });
});

describe('point', () => {
  it('is a valid fraction', () => {
    expect(Schema.is(Fraction.Fraction)(Length.point)).toBe(true);
  });

  it('is 4/3 CSS pixels', () => {
    expect(Length.point).toEqual({ numerator: 4n, denominator: 3n });
  });
});

describe('viewportWidthUnits', () => {
  it('is the number of vw units CSS Values defines in the viewport width', () => {
    expect(Length.viewportWidthUnits).toEqual({ numerator: 100n, denominator: 1n });
  });
});
