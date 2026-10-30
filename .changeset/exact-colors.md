---
'@falkara/presentation': patch
---

`Color.contrast`, `Color.verify` and `Color.reaches` say what the exact colors are that they hold a contrast to: the colors the matrices of CSS Color 4 convert as they are written, computed without rounding, by which white has a relative luminance of 0.99999999999999941 and black against white a contrast ratio of 20.999999999999987. The rounding they account for is derived from the five roundings of the largest contrast and checked against the contrast of grays and of colors at a hue of 0 computed without rounding.
