---
'@falkara/presentation': minor
---

The library no longer computes in floating point. Every value is exact: rational numbers in the `Rational` of Effect, and an irrational number, such as a root, a logarithm, a cosine or π, as bounds that narrow on demand until each decision is certain. What consumers gain:

- `Colorimetry.write` encodes every medium exactly and writes each channel correctly rounded to `Colorimetry.decimalPlaces`, 5, the fewest that tell apart every step of a 16-bit channel, `Colorimetry.deepestChannelBits`, with a number exactly halfway rounded toward +∞, as CSS Color 4 rounds. The bound of 32 units in the last place is gone.
- `Color` reads each number of `oklch()` exactly as the decimal it is written as, so `0.1` is 1/10, and converts it through the matrices of CSS Color 4 exactly. `contrast`, `verify` and the contrast in `ContrastShortfall` give the number JavaScript holds nearest to the exact contrast; black against white gives 20.999999999999993, as white falls a little short of a relative luminance of 1 by those matrices.
- With `channelBits`, `reaches` and `verify` decide the contrast of rounded colors exactly, however close the ratio, by Besicovitch's theorem on sums of roots.
- Without `channelBits`, the cosine and the sine of a hue make exact decisions on `oklch()` colors impossible to settle where they fall on their edge, so they follow one stated rule: a contrast or a channel closer to its edge than the smallest change a 16-bit channel shows counts as lying on it, and meets it. Black against white reaches 21:1 by that rule.
- `shade` searches the lightnesses and chromas written with 5 decimal places, so that the shade written is exactly the shade judged, and passes over a lightness with a channel on the edge between two 8-bit steps, which tools computing in rounded numbers may round either way. Its output changes: `oklch(64% 0.17 147)` on white gives `oklch(0.4491 0.13347 147)`.
- `Fluid` and `Typography` round every length exactly.
- Exactness costs time, milliseconds per value, so the library is meant for build time, as the README now says; a test holds each value to a second.

What changes for consumers:

- The components of a decoded `Color` are `Rational`, and encoding writes them exactly in decimal, refusing a number whose decimal expansion never ends. A number whose exponent exceeds 10000 either way is refused, as `BigDecimal` reads no further.
- The ratio of `reaches`, the `minimumContrast` of `Pair` and `Brand`, and the `requiredContrast` of `ContrastShortfall` and `NoLegibleShade` are `Rational`.
- `enhancedContrastRatio`, `largeTextEnhancedContrastRatio`, `gamutTolerance`, `oklabToLms`, `lmsToXyz`, `fullChroma`, `luminanceWeights`, `contrastFlare`, `maximumContrastRatio`, `halfTurns` and `encodedTransferThreshold` are `Rational`; the matrices are `Colorimetry.Matrix`.
- `unitRoundoff` is removed, as nothing rounds. `xyzToLinearSrgb` is removed in favor of `Colorimetry.srgb.xyzToLinear`, which equals it entry for entry, and `transferThreshold`, `transferSlope`, `transferGamma` and `transferOffset` in favor of `Colorimetry.srgbTransfer`.
- `Fluid.rem` and `Fluid.vw` take a `Rational`, as `Fluid.clamp` does.
