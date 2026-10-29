# @falkara/presentation

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
