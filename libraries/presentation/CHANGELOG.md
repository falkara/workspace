# @falkara/presentation

## 0.5.0

### Minor Changes

- [`b9c538b`](https://github.com/falkara/workspace/commit/b9c538b2bb42d0e9a37c17748b78cce7ab08ffd3) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Every `Fraction` is in lowest terms: decoding reduces it, its type is branded, and every operation keeps it so by cancelling before it multiplies, which keeps the arithmetic fast and the call stack shallow for whole numbers of any size. `Fraction.toNumber` rounds a fraction of any size to the nearest number, ties to even, as IEEE 754 does. The type scales take their options as written, before decoding.

- [`b9c538b`](https://github.com/falkara/workspace/commit/b9c538b2bb42d0e9a37c17748b78cce7ab08ffd3) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `rem`, `vw` and `decimalPlaces` move from `Length` to `Fluid`, which writes the CSS they serve, so that `Length` holds the facts of CSS lengths alone and depends on no other module.

- [`deb6746`](https://github.com/falkara/workspace/commit/deb67468c78ac254417b4f1fab2681e25a2959ff) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Typography.minimumFontSize` is 13 px, the smallest size of the USWDS theme type scale in its default settings, where 12 px had been taken from an outdated page. A type scale no longer starts with a step smaller than 13 px.

- [`dbc1d33`](https://github.com/falkara/workspace/commit/dbc1d33a66a27ab5885334750302eae10b8b8d94) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Color.verify` refuses a pair only when rounding cannot account for its shortfall, by a bound on the rounding error of each luminance carried through every step of the conversion from `Color.unitRoundoff`, where `Color.contrastTolerance` and `Color.conversionOperations` asserted one for every pair. `Color.Color` accepts an opaque alpha such as `oklch(50% 0 0 / 1)` and refuses only a translucent one as translucent, clamps lightness and alpha as CSS Color 4 does, and reduces the hue to one turn before converting it, so that a large hue keeps its precision.

- [`6619d55`](https://github.com/falkara/workspace/commit/6619d55fbe1f086a44e6336c38a47e5f49290112) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Color.shade` picks the shade closest to the brand color by deltaEOK, the color difference CSS Color 4 defines, rather than by lightness alone, so a shade that keeps more chroma wins over one barely nearer in lightness. Its chroma is described as what it is: reduced at constant lightness and hue to the edge of sRGB, the reduction every CSS Color 4 gamut mapping algorithm aims at, reached exactly rather than within their tolerance.

- [`60b7b5d`](https://github.com/falkara/workspace/commit/60b7b5d291391a2a50c7518642eb0cf5f881e552) Thanks [@filipfalcon](https://github.com/filipfalcon)! - The line height, paragraph spacing and text spacing factors of `Typography` are fractions, as every other ratio the library derives, so that `paragraphSpacingFactor` is exactly 9/4 and a factor such as 3/25 is held exactly rather than rounded to a number. `Fraction.toNumber` writes one into CSS.

- [`b9c538b`](https://github.com/falkara/workspace/commit/b9c538b2bb42d0e9a37c17748b78cce7ab08ffd3) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Typography.scale` takes any factors at or above `Typography.minimumStepFactor`, 833/832, at which steps at the minimum font size still differ by the layout unit of browsers, with a maximum factor below, at or above the minimum factor, as Utopia does. A scale ends where the next step would shrink, grow by more than 8/5, fall below the minimum font size or rise above `Typography.maximumFontSize`, 320/3 px: the largest size at which a full-width character, one em wide as CSS Values 4 assumes it in `Typography.ideographAdvanceFactor`, still fits the minimum viewport width when a reader sets the font size to 300 %, as WCAG 2.2 Reflow requires. A step larger than that is no longer part of the scale.

- [`037299a`](https://github.com/falkara/workspace/commit/037299ab4d3bbbd4fbbf8c83e1ee8b663ae31a8a) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Typography.Step` is a schema, and `Color.verify` and `Color.shade` decode the step they are given with the rest of their input before its size decides the contrast its text needs. A step whose smallest size lies outside the minimum and the maximum font size is refused. So is a step that shrinks or grows by more than 8/5, as its size at the minimum viewport width would no longer be its smallest and could earn small text the ratio of large text.

### Patch Changes

- [`2eac9dd`](https://github.com/falkara/workspace/commit/2eac9dd09e99b818b799c8724febe9024a9d7188) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Viewport.viewportWidthFactor` and `Viewport.maximumViewportWidth` describe 1280 CSS pixels as the choice it is: WCAG 2.2 names that width only in an informative note of Reflow and sets no maximum viewport width. The readme promises values of its own to every screen up to a desktop.

- [`47b953d`](https://github.com/falkara/workspace/commit/47b953d80b5ab8c719af6e683513d86967da878a) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Layout.measures` says what WCAG 2.2 Visual Presentation asks of it: a mechanism by which a reader can bring lines to 80 characters or fewer, which columns in ex give by narrowing with the window, as technique C20 tests by relative units without asking the default view to stay under 80 characters.

- [`64e08bc`](https://github.com/falkara/workspace/commit/64e08bc968bf39ef7bb5fc6258163175aad55077) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Ship documentation comments once, in the type declarations an editor reads, and not again in the JavaScript, which makes the package smaller.

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
