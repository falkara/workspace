import { describe, expect, it } from '@effect/vitest';

import * as Viewport from '#src/Viewport';

describe('minimumViewportWidth', () => {
  it('is the width WCAG 2.2 Reflow requires content to support', () => {
    expect(Viewport.minimumViewportWidth).toBe(320);
  });
});

describe('viewportWidthFactor', () => {
  it('is the page zoom at which WCAG 2.2 Reflow equates a desktop viewport with the minimum viewport width', () => {
    expect(Viewport.viewportWidthFactor).toBe(4);
  });
});

describe('maximumViewportWidth', () => {
  it('is the desktop viewport WCAG 2.2 Reflow pairs with the minimum viewport width', () => {
    expect(Viewport.maximumViewportWidth).toBe(1280);
  });

  it('narrows to the minimum viewport width at the page zoom WCAG 2.2 pairs them with', () => {
    expect(Viewport.maximumViewportWidth / Viewport.viewportWidthFactor).toBe(
      Viewport.minimumViewportWidth,
    );
  });
});

describe('maximumPageZoomFactor', () => {
  it('is the maximum page zoom of Safari, the lowest among the Baseline core browsers', () => {
    expect(Viewport.maximumPageZoomFactor).toBe(3);
  });

  it('keeps the maximum viewport width within the viewport range at full zoom', () => {
    expect(Viewport.maximumViewportWidth / Viewport.maximumPageZoomFactor).toBeGreaterThanOrEqual(
      Viewport.minimumViewportWidth,
    );
  });
});
