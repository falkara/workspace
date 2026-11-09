import { describe, expect, it } from '@effect/vitest';
import { Rational } from 'effect';

import * as Viewport from '#src/Viewport';

describe('minimumViewportWidth', () => {
  it('is the width WCAG 2.2 Reflow requires content to support', () => {
    expect(Viewport.minimumViewportWidth).toEqual(Rational.fromBigInt(320n));
  });
});

describe('viewportWidthFactor', () => {
  it('is the page zoom by which an informative note of WCAG 2.2 Reflow equates a desktop viewport with the minimum viewport width', () => {
    expect(Viewport.viewportWidthFactor).toEqual(Rational.fromBigInt(4n));
  });
});

describe('maximumViewportWidth', () => {
  it('is positive', () => {
    expect(Rational.isPositive(Viewport.maximumViewportWidth)).toBe(true);
  });

  it('is the desktop viewport an informative note of WCAG 2.2 Reflow pairs with the minimum viewport width', () => {
    expect(Viewport.maximumViewportWidth).toEqual(Rational.fromBigInt(1280n));
  });

  it('narrows to the minimum viewport width at the page zoom WCAG 2.2 pairs them with', () => {
    expect(
      Rational.divideUnsafe(Viewport.maximumViewportWidth, Viewport.viewportWidthFactor),
    ).toEqual(Viewport.minimumViewportWidth);
  });
});

describe('lowestMaximumPageZoomFactor', () => {
  it('is the maximum page zoom of Safari, the lowest maximum among the Baseline core browsers', () => {
    expect(Viewport.lowestMaximumPageZoomFactor).toEqual(Rational.fromBigInt(3n));
  });

  it('keeps the maximum viewport width within the viewport range at full zoom', () => {
    expect(
      Rational.isGreaterThanOrEqualTo(
        Rational.divideUnsafe(Viewport.maximumViewportWidth, Viewport.lowestMaximumPageZoomFactor),
        Viewport.minimumViewportWidth,
      ),
    ).toBe(true);
  });
});

describe('highestMaximumPageZoomFactor', () => {
  it('is the maximum page zoom of Chromium and Firefox, the highest maximum among the Baseline core browsers', () => {
    expect(Viewport.highestMaximumPageZoomFactor).toEqual(Rational.fromBigInt(5n));
  });

  it('is at least the lowest maximum page zoom', () => {
    expect(
      Rational.isGreaterThanOrEqualTo(
        Viewport.highestMaximumPageZoomFactor,
        Viewport.lowestMaximumPageZoomFactor,
      ),
    ).toBe(true);
  });
});
