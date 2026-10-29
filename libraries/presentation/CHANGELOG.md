# @falkara/presentation

## 0.2.0

### Minor Changes

- [`b1182cb`](https://github.com/falkara/workspace/commit/b1182cb6524efb42d5346894ed67af2d5b9a58b0) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Fluid.clamp` takes its sizes as fractions and returns an `Exit` that fails with a `SchemaError` when the value would shrink or grow by more than the maximum text growth factor, so that no fluid value the library writes breaks the guarantees it makes for text. The steps of `Typography.scale` and `Space.scale` hold their sizes as fractions to match.

- [`911bcb3`](https://github.com/falkara/workspace/commit/911bcb3a7bb82fa362e3ba93c5db987e6c49113c) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Add `Space.scale`, the layout spacing that grows exactly as body text does: the counts of the USWDS spacing unit as multiples of body text, from 1/4 to 15/2, taken from the same intent as `Typography.scale`.

## 0.1.0

### Minor Changes

- [`fe835d5`](https://github.com/falkara/workspace/commit/fe835d5adfc5eb80a057e856cbfc926207733005) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Add the line height and the paragraph spacing that WCAG 2.2 Visual Presentation requires at Level AAA, as factors of the font size: `Typography.lineHeightFactor` (3/2) and `Typography.paragraphSpacingFactor` (9/4).
