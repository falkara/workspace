---
'@falkara/presentation': patch
---

`Color.xyzToLinearSrgb` holds the matrix from CIE XYZ to linear sRGB as CSS Color 4 has written it since November 2022, each entry the quotient of whole numbers, rather than the decimals of its earlier revisions, which lie up to eight units in the last place from those quotients, so that every matrix of `Color` comes from one revision of CSS Color 4. Contrast ratios and shades move in their last bits: black against white now gives 20.99999999999999. The exact colors the decisions account for are those the matrices convert as JavaScript holds them, computed without rounding, as the rounding errors they bound always were.
