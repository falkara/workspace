import * as Length from '#src/Length';
import * as Viewport from '#src/Viewport';

/** The CSS clamp() value that changes linearly from the minimum size at the minimum viewport width to the maximum size at the maximum viewport width. Sizes measured in CSS pixels. */
export const clamp = (minimumSize: number, maximumSize: number): string => {
  const slope =
    (maximumSize - minimumSize) / (Viewport.maximumViewportWidth - Viewport.minimumViewportWidth);
  const intercept = minimumSize - slope * Viewport.minimumViewportWidth;
  const preferred =
    slope < 0
      ? `${Length.rem(intercept)} - ${Length.vw(-slope)}`
      : `${Length.rem(intercept)} + ${Length.vw(slope)}`;
  return `clamp(${Length.rem(Math.min(minimumSize, maximumSize))}, ${preferred}, ${Length.rem(Math.max(minimumSize, maximumSize))})`;
};
