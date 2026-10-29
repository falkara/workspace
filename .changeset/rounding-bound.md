---
'@falkara/presentation': minor
---

`Color.verify` refuses a pair only when rounding cannot account for its shortfall, by a bound on the rounding error of each luminance carried through every step of the conversion from `Color.unitRoundoff`, where `Color.contrastTolerance` and `Color.conversionOperations` asserted one for every pair. `Color.Color` accepts an opaque alpha such as `oklch(50% 0 0 / 1)` and refuses only a translucent one as translucent, clamps lightness and alpha as CSS Color 4 does, and reduces the hue to one turn before converting it, so that a large hue keeps its precision.
