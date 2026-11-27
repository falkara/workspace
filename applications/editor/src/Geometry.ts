import * as Space from '@falkara/presentation/Space';
import { Rational } from 'effect';

import type { Position } from '#src/Design';

// The geometry of the canvas, in CSS pixels of the canvas, as the design file measures positions. The view sizes every box from these values and the wires are drawn from them, so that a wire meets its ports without any element being measured. Every length of a box is a whole count of steps of the grid, so that a box placed on the grid has its edges and the ends of its wires on lines of the grid too.

/** The step of the square grid every box is placed on: the step of the space scale of Falkara Presentation whose factor of body text is one, the spacing unit over the share of body text it is, as the editor keeps body text at the default font size. A cell of the grid is then one em of the text in a box, and every length of the canvas is a count of the unit the panels are spaced by. */
export const gridStep = Rational.toNumberUnsafe(
  // The factor of the spacing unit is a positive constant, so the division never divides by zero.
  Rational.divideUnsafe(Space.spacingUnit, Space.spacingUnitFactor),
);

/** The width of the canvas, a hundred and fifty steps of the grid, wide enough for a design of a few dozen boxes. */
export const canvasWidth = gridStep * 150;

/** The height of the canvas, a hundred steps of the grid. */
export const canvasHeight = gridStep * 100;

/** The width of a box, thirteen steps of the grid, which fits the longest title of the palette and a port name on either side. */
export const boxWidth = gridStep * 13;

/** The height of the header of a box, which holds its title and is the handle it is dragged by: two steps of the grid, the fewest whole steps that hold a line of body text, one and a half steps at the line height of the type scale. Above the 24 CSS pixels WCAG 2.2 Target Size (Minimum) requires of a target. */
export const headerHeight = gridStep * 2;

/** The height of the row of a port: two steps of the grid, the fewest whole steps that hold a line of text and that are even, so that the middle of the row, where the wires of the port end, lies on a line of the grid. Above the 24 CSS pixels WCAG 2.2 Target Size (Minimum) requires of a target. */
export const portHeight = gridStep * 2;

/** The diameter of the handle of a port, the dot on the edge of a box where the wires of the port end: large enough to read as a place to press, while the whole row of the port is the target. */
export const handleSize = 14;

/** Where the first box is placed, two steps of the grid clear of the edges. */
export const firstBoxOffset = gridStep * 2;

/** How far each new box is placed from the one before, down and to the right: the height of a header, so that the header of the box before stays in view. */
export const nextBoxOffset = headerHeight;

/** How many new boxes are placed down and to the right before the next starts over at the first place, so that new boxes stay in view. */
export const nextBoxCount = 8;

/** The position nearest to a position at which a box lies whole within the canvas by its width and its header, so that no box is moved out of reach. The bounds are whole steps of the grid, so a position on the grid stays on it. */
export const within = (position: Position): Position => ({
  x: Math.min(Math.max(position.x, 0), canvasWidth - boxWidth),
  y: Math.min(Math.max(position.y, 0), canvasHeight - headerHeight),
});

/** The position on the grid nearest to a position, where every box is placed, dropped, dragged and moved to. */
export const snap = (position: Position): Position => ({
  x: Math.round(position.x / gridStep) * gridStep,
  y: Math.round(position.y / gridStep) * gridStep,
});

/** Where a wire enters the input port at an index, from the top, of a box at a position: the middle of the row of the port, on the left edge of the box. */
export const inputAnchor = (position: Position, index: number): Position => ({
  x: position.x,
  y: position.y + headerHeight + portHeight * (index + 0.5),
});

/** Where a wire leaves the output port at an index, from the top, of a box at a position: the middle of the row of the port, on the right edge of the box. */
export const outputAnchor = (position: Position, index: number): Position => ({
  x: position.x + boxWidth,
  y: position.y + headerHeight + portHeight * (index + 0.5),
});

/** How far a pointer goes from where it pressed an output port or the canvas before the press is a drag, which draws a wire or pans the view, rather than a click, in CSS pixels of the viewport: far enough that a hand that trembles on a click drags nothing. */
export const dragThreshold = 4;

/** How far an arrow key pans the view, in CSS pixels of the viewport: the distance Chromium scrolls a page by for an arrow key, so that the canvas pans by keyboard as it scrolled in its panel before the editor drew the view itself. */
export const panStep = 40;

/** The levels the buttons and the keys zoom the view to, from the smallest to the largest: the levels of the page zoom of Chromium, from a quarter to five times, which a person already steps through in the browser. A pinch zooms between them freely, within the smallest and the largest. */
export const zoomLevels: ReadonlyArray<number> = [
  0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5,
];

/** The smallest zoom, the first of the levels. */
export const minimumZoom = 0.25;

/** The largest zoom, the last of the levels. */
export const maximumZoom = 5;

/** Whether a point of the canvas lies over the input port at an index, from the top, of a box at a position: within the row of the port, from the outer edge of its handle to the middle of the box, where the output ports begin. */
export const isOverInput = (point: Position, position: Position, index: number): boolean =>
  point.x >= position.x - handleSize / 2 &&
  point.x <= position.x + boxWidth / 2 &&
  point.y >= position.y + headerHeight + portHeight * index &&
  point.y < position.y + headerHeight + portHeight * (index + 1);

/** The path of a wire from an output anchor to an input anchor as SVG writes it: a cubic curve that leaves to the right and enters from the left, bent by half the distance between the anchors and by a port row at least, so that a wire between boxes one above the other still reads as a curve. */
export const wirePath = (from: Position, to: Position): string => {
  const bend = Math.max(Math.abs(to.x - from.x) / 2, portHeight);
  return `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`;
};
