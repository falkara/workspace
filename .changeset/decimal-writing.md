---
'@falkara/presentation': patch
---

Every number the library writes in CSS goes through Effect's `Rational.toBigDecimal` and `BigDecimal.format`, rounded as CSS Color 4 rounds, a number exactly halfway toward +∞, in place of a writer of its own. Numbers with fewer than 16 decimal places are written as before. A number written exactly with 16 decimal places or more, such as a component of a `Color` encoded back to `oklch()` or the hue of a shade, is now written with an exponent, such as `1e-17`, which CSS reads as well.
