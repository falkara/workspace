/**
 * The presentation of web content, in the sense WCAG gives the word: the rendering of content in a
 * form that readers perceive. Every value follows from a few axioms, each citing its source, and says
 * what it is and why.
 *
 * Values only: this package knows no styling system. An application brings the values into its own,
 * such as StyleX through `stylex.env`.
 */
export * as Viewport from '#src/Viewport';
export * as Typography from '#src/Typography';
export * as Fraction from '#src/Fraction';
