/**
 * The line lengths of the USWDS measure tokens, from the shortest to the longest. Measured in ex, the x-height of the font they are set in, a relative unit, so that a column follows the font and every size a reader gives it and narrows with the window. Narrowing the window is the mechanism by which WCAG 2.2 Visual Presentation lets a reader bring lines to 80 characters or fewer, and its sufficient technique C20 tests for it by column widths in relative units, without asking the default view to stay under 80 characters.
 *
 * @see https://designsystem.digital.gov/design-tokens/typesetting/measure/
 * @see https://www.w3.org/TR/WCAG22/#visual-presentation
 * @see https://www.w3.org/WAI/WCAG22/Techniques/css/C20
 */
export const measures: ReadonlyArray<number> = [44, 60, 64, 68, 72, 88];
