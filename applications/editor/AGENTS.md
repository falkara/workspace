# Falkara Workspace Editor

The notes of the editor, beside the workspace `AGENTS.md`. `EFFECT-UI.md` logs every limitation of Effect UI met here.

## Color Schemes

**Every view is developed and checked in the light and the dark scheme alike.**

- Every color is a pair in `Environment.ts`, its light and its dark value, which StyleX receives as their `light-dark()`. Every color of text set on a background is a pair of `pairs` there, verified with `Color.verify` in both schemes as the build works out the values, and every border, dot of the grid, handle, wire and state drawn on a background is a pair of `boundaries`, held to the 3:1 of WCAG 2.2 Non-text Contrast. A dark scheme lifts each level of background by making it lighter than the one under it: the ground, then the panels, then what is raised on them.
- StyleX writes `light-dark()` as it is, lowering nothing (`vite.config.ts`). Lowered, it becomes variables that only a lowered `color-scheme` defines, which `src/Styles.css` is not in development, and every color goes blank.
- The scheme is the `data-scheme` of the root, which `src/Scheme.ts` sets and keeps under `schemeKey`, and the inline script of `index.html` reads under the same key before the first paint, so that the prerendered document never shows the other scheme first.
- A view is done when it has been looked at, and its tests pass, in both schemes.
