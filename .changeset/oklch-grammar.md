---
'@falkara/presentation': minor
---

`Color.Color` reads oklch() as CSS Color 4 writes it, apart from math functions and relative colors: the function named in any case, numbers with a sign or an exponent, `none` for any component, a negative lightness, chroma or alpha clamped to 0, and a hue in `deg`, `grad`, `rad` or `turn`. A color decodes with the unit of its hue as `hueUnit`, the angle is taken from that unit without passing through degrees, and the bound on the rounding error of its luminance carries the error that unit brings. `Color.halfTurns` holds the half turn of each unit but the radian, a color encodes each number as JavaScript writes it, which it decodes again exactly, and `Color.shade` writes the hue in the unit of the brand color.
