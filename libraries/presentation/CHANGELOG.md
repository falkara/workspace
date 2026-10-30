# @falkara/presentation

## 0.8.0

### Minor Changes

- [`ad3e8f0`](https://github.com/falkara/workspace/commit/ad3e8f0cf9f36bedf6f4e2ab7aaee33f6fdf0bb6) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Color.shade` returns the closest shade that reaches the contrast both exactly and once it and the background are written in hex, each sRGB channel rounded to the 8 bits most displays show and tools measure, however a channel on the edge between two steps rounds, so that a shade at the edge of the contrast no longer falls just below it in a hex-based checker. `Color.verify` and `Color.reaches` take `channelBits`, from 1 to 16, to judge colors as a display or a tool holding channels in that many bits shows and measures them, `verify` then returning the contrast of the rounded colors. `Color.encodedTransferThreshold` holds the encoded value up to which CSS Color 4 reads an sRGB channel as linear.

- [`5dee6b1`](https://github.com/falkara/workspace/commit/5dee6b15600cfeadaa966aab7e42621e8fe0c55c) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Color.reaches(colors, ratio)` decides whether text over its background reaches a contrast ratio from 1:1 to 21:1 as `Color.verify` decides it, refusing only a shortfall that rounding cannot account for, and takes the ratio alone too, as `pipe` calls it. `Color.Colors` is the schema of the text and background it takes. `Color.contrast` says that its ratio is the one JavaScript computes, so that black against white gives 20.999999999999986, and that `reaches` or `verify` decides whether it meets a ratio.

- [`6081c9d`](https://github.com/falkara/workspace/commit/6081c9d7fc03faa32f897c87d4371ab328fa6287) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Color.Color` reads oklch() as CSS Color 4 writes it, apart from math functions and relative colors: the function named in any case, numbers with a sign or an exponent, `none` for any component, a negative lightness, chroma or alpha clamped to 0, and a hue in `deg`, `grad`, `rad` or `turn`. A color decodes with the unit of its hue as `hueUnit`, the angle is taken from that unit without passing through degrees, and the bound on the rounding error of its luminance carries the error that unit brings. `Color.halfTurns` holds the half turn of each unit but the radian, a color encodes each number as JavaScript writes it, which it decodes again exactly, and `Color.shade` writes the hue in the unit of the brand color.

- [`cd68983`](https://github.com/falkara/workspace/commit/cd68983f4b4cb6397f8150ec7147bf9bff5f4996) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Every guarantee rests on the maximum a reader adjustment reaches that it needs, each taken from the browsers: what a reader must be able to reach rests on the lowest maximum, which every Baseline core browser offers, and what must hold however far a reader goes rests on the highest. `Viewport.maximumPageZoomFactor` is split into `Viewport.lowestMaximumPageZoomFactor`, 3 in Safari, and `Viewport.highestMaximumPageZoomFactor`, 5 in Chromium and Firefox, and `Typography.highestMaximumDefaultFontSize`, 72 px in Chromium and Firefox, gives `Typography.highestMaximumFontSizeFactor`, 9/2, beside `Typography.lowestMaximumFontSizeFactor`, 1, as Safari lets a reader set no font size. `Typography.maximumTextGrowthFactor` stays on the lowest page zoom and keeps 8/5; `Typography.maximumFontSize` rests on the largest font size a reader sets and falls from 320/3 px to 640/9 px; and `Fluid.decimalPlaces` rests on the highest page zoom and font size together and rises from 4 to 5.

- [`bf11f29`](https://github.com/falkara/workspace/commit/bf11f295b766bf0b58bc73c065568b8d46adc919) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Space.scale` takes `Space.ScaleOptions`, the size body text reaches at the maximum viewport width alone, checked as the type scale checks it, so that the options of a type scale still serve it as they are but no ratio of the type scale refuses the space scale, which never uses them.

- [`c459e6c`](https://github.com/falkara/workspace/commit/c459e6cc4bef0a05034340e5e1d363779bdc95e4) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Color.Pair` and `Color.Brand` take the step of the type scale without its position, which the contrast never reads, so that a pair written by hand needs no invented position. The step keeps its sizes and their checks, as its size at the minimum viewport width must be its smallest for the contrast it needs, and a step from `Typography.scale` still serves as it is.

### Patch Changes

- [`6f30a8c`](https://github.com/falkara/workspace/commit/6f30a8cdb97061ce9a2b9493ced569fa3204592e) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Fluid.clamp` writes a value whose sizes are written alike as their rem length alone, such as `1rem`, instead of `clamp(1rem, 1rem + 0vw, 1rem)`, which never changes either.

- [`97057d5`](https://github.com/falkara/workspace/commit/97057d534d2364d456b9b078481dfe4a08589ad4) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Color.contrast`, `Color.verify` and `Color.reaches` say what the exact colors are that they hold a contrast to: the colors the matrices of CSS Color 4 convert as they are written, computed without rounding, by which white has a relative luminance of 0.99999999999999941 and black against white a contrast ratio of 20.999999999999987. The rounding they account for is derived from the five roundings of the largest contrast and checked against the contrast of grays and of colors at a hue of 0 computed without rounding.

- [`07a1418`](https://github.com/falkara/workspace/commit/07a14189bfc3902d6f770f9ae8774930c7e292e5) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Typography.scale` works each step out from the one before it, multiplied or divided by the factors once, rather than raising the factors to the power of every position again, so that a scale at the minimum step factor, 1327 steps, takes about 35 ms rather than 225 ms. The steps are the same.

- [`d37a07d`](https://github.com/falkara/workspace/commit/d37a07d54179badf6ba6b7920edef2c5daa3bd67) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Color.shade` writes each number of the shade as JavaScript writes it, the shortest form that reads back as the same number, with an exponent for a small one, which CSS reads as well, instead of sixteen decimal places, which wrote a lightness of 0.08691023952433169 as 0.0869102395243317, another number than the shade it found.

## 0.7.0

### Minor Changes

- [`e9b3c5f`](https://github.com/falkara/workspace/commit/e9b3c5fcb35caaf569f25a8abc82510f86d6f431) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Fraction.make` checks its numerator and denominator and returns an `Exit`, failing with the reason when either is not positive, so that no fraction breaks the promise of its type. `Fraction.makeUnsafe` builds a fraction of values known to be positive without checking them, as the constants of the library do. A type scale takes its options as plain objects, such as `{ numerator: 6n, denominator: 5n }`, and checks them itself.

- [`7940ef3`](https://github.com/falkara/workspace/commit/7940ef3fb11a7ce3fcc33511cde27e1e5169f9cd) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Color.Pair` and `Color.Brand` are the schemas of the inputs of `Color.verify` and `Color.shade`, built once with the module rather than on every call, and the `Pair` and `Brand` types are their encoded side, written as before.

- [`f05e349`](https://github.com/falkara/workspace/commit/f05e3498af0cceadb936a969c946a905283d0646) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Color.verify` fails with a `ContrastShortfall`, which holds the contrast of the colors and the contrast required, when a pair falls short of the contrast its text needs, and `Color.shade` fails with a `NoLegibleShade` when no shade within sRGB reaches it. Both are tagged errors apart from the `SchemaError` of an input that is not valid, so that a caller tells a result from a typo by its `_tag`, or catches it with `Effect.catchTag`, instead of reading the message.

- [`80a7ec8`](https://github.com/falkara/workspace/commit/80a7ec85f4974d9cc9b8a991ab46e4117fe748e0) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Fraction.sum`, `Fraction.subtract`, `Fraction.subtractUnsafe`, `Fraction.multiply`, `Fraction.divide` and `Fraction.pow` take their second operand alone as well, as the arithmetic of Effect does, so that `pipe(a, Fraction.multiply(b))` reads as `Fraction.multiply(a, b)`.

- [`c88cde1`](https://github.com/falkara/workspace/commit/c88cde1192900166282295f203a7ca09c5b2e279) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Every fact that the library derives fractions from is itself a fraction, such as `Viewport.minimumViewportWidth`, `Typography.defaultFontSize` or `Length.layoutUnit`, and every value that follows from them is derived by fraction arithmetic alone, so that a fact that is not a whole number, such as a viewport width factor of 15/4, gives exact values instead of failing as the module loads. Read a fact as a number with `Fraction.toNumber`.

- [`adc0745`](https://github.com/falkara/workspace/commit/adc0745a18650aedee1607c0885902a37dd1c7c9) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Fraction.order` is renamed `Fraction.Order`, as Effect names the order of its own data types, and `Fraction.Equivalence` compares fractions by value field by field, as a fraction in lowest terms is the only one of its value.

- [`5a1a0dc`](https://github.com/falkara/workspace/commit/5a1a0dcb2f5733a88aec090717376273473df1a5) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Fraction.subtract` gives the difference of two fractions, or a failure with the reason when it is not positive, and `Fraction.subtractUnsafe` gives it for a second fraction known to be smaller.

- [`8ee0ac4`](https://github.com/falkara/workspace/commit/8ee0ac4c2999b2f9b2e01c85e7261ba163b2e47d) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Color.maximumContrastRatio` is 21, the largest contrast ratio WCAG 2.2 defines, of black against white, derived from the flare. `Color.verify` and `Color.shade` refuse a `minimumContrast` above it with that reason, instead of a contrast no colors can reach or, in `shade`, a failure that blamed the background.

- [`1b59fff`](https://github.com/falkara/workspace/commit/1b59fff090343337987808743e8d306c59867171) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Color.Color` decodes an oklch() color once into its components, `{ lightness, chroma, hue, alpha }`, instead of checking a string that every function then reads again, and checks that the color is opaque and within sRGB on those components. It encodes them back in fixed notation. `Color.contrast`, `Color.verify` and `Color.shade` take colors written as strings as before.

- [`9edd859`](https://github.com/falkara/workspace/commit/9edd859779ced05c46c0ee849d4ea264144ca5bb) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Fluid.clamp` takes its sizes as plain fractions, such as `{ numerator: 16n, denominator: 1n }`, and checks them itself, as every other input of the library does.

- [`b8cf189`](https://github.com/falkara/workspace/commit/b8cf189a3249229d81312ebc307579846b875d83) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Length.layoutUnit` is split in two: `Length.finestLayoutUnit`, the 1/64 px of WebKit and Chromium, keeps the rounding of `Fluid` below the layout unit of every browser, and `Length.coarsestLayoutUnit`, the 1/60 px app unit of Gecko, sets `Typography.minimumStepFactor`, now 781/780. Its guarantee is restated as layout: a length of at least 1 em, such as the line height, falls on a different point of the layout grid in consecutive steps in every Baseline core browser. It promises nothing about how glyphs render, as browsers keep the font size itself unrounded.

### Patch Changes

- [`0762394`](https://github.com/falkara/workspace/commit/0762394300b9d87ea415893960ccd76b6b774ba5) Thanks [@filipfalcon](https://github.com/filipfalcon)! - The peer range on Effect is `^4.1.0`, so that a project can move to a later Effect 4 minor as soon as it is released: the library uses only Effect modules marked stable, which Effect keeps compatible across minors.

- [`46eb561`](https://github.com/falkara/workspace/commit/46eb561b3afd3be62a4edcd0adabcea0fba62846) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Fraction.makeUnsafe` refuses a literal that is not positive, such as `-1n` or `0n`, as the code is written.

- [`d288be3`](https://github.com/falkara/workspace/commit/d288be39de491041f034ab5cb18ad4e9cbe4e034) Thanks [@filipfalcon](https://github.com/filipfalcon)! - `Fraction.Fraction` checks that a fraction is in lowest terms, so that `Schema.is(Fraction.Fraction)` refuses a ratio such as `{ numerator: 2n, denominator: 4n }` that was not decoded. Decoding still brings every ratio to lowest terms first.

## 0.6.0

### Minor Changes

- [`6675760`](https://github.com/falkara/workspace/commit/6675760c4561882d72225f61890a98a33cec4fc4) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Built on Effect 4.1.0. `@falkara/presentation` asks for Effect `~4.1.0` as its peer, the 4.1 line it is built and tested against, where it accepted any Effect 4 from 4.0.7 before.

- [`e1ddea6`](https://github.com/falkara/workspace/commit/e1ddea6f0b163cf7a1dee360958c19788cf5c89a) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Every module is imported on its own path, such as `import * as Typography from '@falkara/presentation/Typography'`, on npm and on JSR, and the package root no longer exports anything. Every module ships as a file of its own and the package declares itself free of side effects, so that a bundler leaves out the modules a project never imports: a project that reads only the line lengths of `Layout` takes 0.2 kB instead of 6 kB with `Color` inside.

### Patch Changes

- [`4156ec1`](https://github.com/falkara/workspace/commit/4156ec1b609e9118fc8222732605656acffb46d0) Thanks [@filipfalcon](https://github.com/filipfalcon)! - The JavaScript keeps its documentation comments, as Rolldown and TypeScript emit them by default and as Effect ships them, so that the reason behind each value is also at hand where the code runs.

- [`f236684`](https://github.com/falkara/workspace/commit/f236684aeedb640761c4af27ddf0516efc96b57f) Thanks [@filipfalcon](https://github.com/filipfalcon)! - Publish to JSR alongside npm: the same built JavaScript with its type declarations, which the entry names for JSR, released with every version npm receives.

- [`621619a`](https://github.com/falkara/workspace/commit/621619a702a455ab4b1b1c542206c79b6d9d1bb1) Thanks [@filipfalcon](https://github.com/filipfalcon)! - The type declarations no longer export the namespaces the build used internally, such as `Typography_d_exports`, which type-checked as imports but do not exist at runtime.

- [`ac20719`](https://github.com/falkara/workspace/commit/ac207191d23b37295fa5565ef19e74c97de9cd1b) Thanks [@filipfalcon](https://github.com/filipfalcon)! - The package names its keywords, its homepage and where to report issues, so that npm search finds it and leads to the readme.

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
