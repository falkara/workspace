import { describe, expect, it } from '@effect/vitest';
import { Rational } from 'effect';

import * as Length from '#src/Length';

describe('finestLayoutUnit', () => {
  it('is the layout unit of WebKit and Chromium, the finest among the Baseline core browsers', () => {
    expect(Length.finestLayoutUnit).toEqual(Rational.makeUnsafe(1n, 64n));
  });
});

describe('coarsestLayoutUnit', () => {
  it('is the app unit of Gecko, the coarsest layout unit among the Baseline core browsers', () => {
    expect(Length.coarsestLayoutUnit).toEqual(Rational.makeUnsafe(1n, 60n));
  });

  it('is at least the finest layout unit, so that lengths apart by it are apart on every layout grid', () => {
    expect(
      Rational.isGreaterThanOrEqualTo(Length.coarsestLayoutUnit, Length.finestLayoutUnit),
    ).toBe(true);
  });
});

describe('inch', () => {
  it('is the length of a CSS inch', () => {
    expect(Length.inch).toEqual(Rational.fromBigInt(96n));
  });
});

describe('pointsPerInch', () => {
  it('is the number of CSS points in a CSS inch', () => {
    expect(Length.pointsPerInch).toEqual(Rational.fromBigInt(72n));
  });
});

describe('point', () => {
  it('is positive', () => {
    expect(Rational.isPositive(Length.point)).toBe(true);
  });

  it('is 4/3 CSS pixels', () => {
    expect(Length.point).toEqual(Rational.makeUnsafe(4n, 3n));
  });
});

describe('viewportWidthUnits', () => {
  it('is the number of vw units CSS Values defines in the viewport width', () => {
    expect(Length.viewportWidthUnits).toEqual(Rational.fromBigInt(100n));
  });
});
