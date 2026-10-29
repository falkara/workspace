# @falkara/presentation

## 0.4.0

### Minor Changes

- [`346f261`](https://github.com/falkara/workspace/commit/346f2611bf7cf6a9c1f811c18ba906d5bf66902d) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Add `Color`: colors written in `oklch()` as CSS Color 4 writes it, `Color.contrast` for their WCAG 2.2 contrast ratio, and `Color.verify` for whether a pair is legible for a step of the type scale at a font weight, with the contrast WCAG 2.2 Contrast (Enhanced) requires derived from the step's smallest size. `Length.point` and the font weights of CSS Fonts join the values it builds on.

- [`69f56b9`](https://github.com/falkara/workspace/commit/69f56b9af908409d5b70b48f28545591f48ffed0) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Add `Color.shade`, which finds the shade of a brand color closest to it in lightness that reaches the contrast its text needs against a background: the hue is kept, the chroma is kept or, where sRGB cannot hold it, reduced as CSS Color 4 gamut mapping reduces it, and a background no shade can reach is refused with the reason.

- [`52492ea`](https://github.com/falkara/workspace/commit/52492ea6c41e20bf9f5d79bcd074b7d1149f22cd) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Add `Layout.measures`, the line lengths of the USWDS measure tokens in ex, which follow the font and every size a reader gives it, as WCAG 2.2 Visual Presentation asks of column widths.

- [`91a7f67`](https://github.com/falkara/workspace/commit/91a7f67e9b35c7401a0a755c9425d168f83846ee) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Add `Typography.textAlignment`, start, which keeps text unjustified as WCAG 2.2 Visual Presentation requires, and the line height, paragraph, letter and word spacing that WCAG 2.2 Text Spacing lets a reader set, for checking that a layout holds when a reader sets them.

### Patch Changes

- [`8e54414`](https://github.com/falkara/workspace/commit/8e5441472d089e3cf9fac443f690fc1006e7ea2d) Thanks [@filipfalcon](https://github.com/filipfalcon)! - The readme names every module and what it does: typography, space, color and layout, and the facts and arithmetic they stand on.

## 0.3.0

### Minor Changes

- [`937ef2d`](https://github.com/falkara/workspace/commit/937ef2d64a3404423d38590c6d34f23758e2352b) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Every value the library refuses now comes with its reason and, where there is one, the standard behind it, such as "Expected a body font size of at most 25.6 px, so that text can be enlarged to 200 % within the 300 % page zoom of Safari, as WCAG 2.2 Resize Text requires". `Fraction.format` writes a whole fraction as its numerator alone.

### Patch Changes

- [`4fac880`](https://github.com/falkara/workspace/commit/4fac880b880549e32ed1a9b7c6d3bdeea97a23b7) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Describe the package on npm as the README introduces it: an Effect-based TypeScript library for interface design that derives each value from established standards.

## 0.2.0

### Minor Changes

- [`b1182cb`](https://github.com/falkara/workspace/commit/b1182cb6524efb42d5346894ed67af2d5b9a58b0) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Fluid.clamp` takes its sizes as fractions and returns an `Exit` that fails with a `SchemaError` when the value would shrink or grow by more than the maximum text growth factor, so that no fluid value the library writes breaks the guarantees it makes for text. The steps of `Typography.scale` and `Space.scale` hold their sizes as fractions to match.

- [`911bcb3`](https://github.com/falkara/workspace/commit/911bcb3a7bb82fa362e3ba93c5db987e6c49113c) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Add `Space.scale`, the layout spacing that grows exactly as body text does: the counts of the USWDS spacing unit as multiples of body text, from 1/4 to 15/2, taken from the same intent as `Typography.scale`.

## 0.1.0

### Minor Changes

- [`fe835d5`](https://github.com/falkara/workspace/commit/fe835d5adfc5eb80a057e856cbfc926207733005) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Add the line height and the paragraph spacing that WCAG 2.2 Visual Presentation requires at Level AAA, as factors of the font size: `Typography.lineHeightFactor` (3/2) and `Typography.paragraphSpacingFactor` (9/4).
