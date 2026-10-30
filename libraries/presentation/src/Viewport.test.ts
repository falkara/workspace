import { describe, expect, it } from '@effect/vitest';
import { Schema } from 'effect';

import * as Fraction from '#src/Fraction';
import * as Viewport from '#src/Viewport';

describe('minimumViewportWidth', () => {
  it('is the width WCAG 2.2 Reflow requires content to support', () => {
    expect(Viewport.minimumViewportWidth).toEqual({ numerator: 320n, denominator: 1n });
  });
});

describe('viewportWidthFactor', () => {
  it('is the page zoom by which an informative note of WCAG 2.2 Reflow equates a desktop viewport with the minimum viewport width', () => {
    expect(Viewport.viewportWidthFactor).toEqual({ numerator: 4n, denominator: 1n });
  });
});

describe('maximumViewportWidth', () => {
  it('is a valid fraction', () => {
    expect(Schema.is(Fraction.Fraction)(Viewport.maximumViewportWidth)).toBe(true);
  });

  it('is the desktop viewport an informative note of WCAG 2.2 Reflow pairs with the minimum viewport width', () => {
    expect(Viewport.maximumViewportWidth).toEqual({ numerator: 1280n, denominator: 1n });
  });

  it('narrows to the minimum viewport width at the page zoom WCAG 2.2 pairs them with', () => {
    expect(Fraction.divide(Viewport.maximumViewportWidth, Viewport.viewportWidthFactor)).toEqual(
      Viewport.minimumViewportWidth,
    );
  });
});

describe('maximumPageZoomFactor', () => {
  it('is the maximum page zoom of Safari, the lowest among the Baseline core browsers', () => {
    expect(Viewport.maximumPageZoomFactor).toEqual({ numerator: 3n, denominator: 1n });
  });

  it('keeps the maximum viewport width within the viewport range at full zoom', () => {
    expect(
      Fraction.isGreaterThanOrEqualTo(
        Fraction.divide(Viewport.maximumViewportWidth, Viewport.maximumPageZoomFactor),
        Viewport.minimumViewportWidth,
      ),
    ).toBe(true);
  });
});
