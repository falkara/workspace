import * as stylex from '@stylexjs/stylex';

/**
 * How the handle of a port is drawn, set by the port and read by its handle, so that the state of the port, and a pointer over it or focus on it, shows on the handle without the handle knowing of either. StyleX keeps variables in a `.stylex.ts` module of their own.
 */
export const handle = stylex.defineVars({
  /** What the handle is filled with: the raised surface of the box while the port is free. */
  fill: stylex.env.color.raised,
  /** The edge of the handle, which tells it from the box at the contrast WCAG 2.2 Non-text Contrast requires. */
  ring: stylex.env.color.border,
  /** The glow around the handle, none unless a wire is drawn from the port or can enter it. */
  halo: 'transparent',
});
