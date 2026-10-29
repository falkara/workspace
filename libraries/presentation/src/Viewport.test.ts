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

  it('is the minimum viewport width scaled by the viewport width factor', () => {
    expect(Viewport.maximumViewportWidth).toBe(
      Viewport.minimumViewportWidth * Viewport.viewportWidthFactor,
    );
  });
});

describe('maximumPageZoomFactor', () => {
  it('is the maximum page zoom of Safari, the lowest among the Baseline core browsers', () => {
    expect(Viewport.maximumPageZoomFactor).toBe(3);
  });
});
