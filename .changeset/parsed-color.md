---
'@falkara/presentation': minor
---

`Color.Color` decodes an oklch() color once into its components, `{ lightness, chroma, hue, alpha }`, instead of checking a string that every function then reads again, and checks that the color is opaque and within sRGB on those components. It encodes them back in fixed notation. `Color.contrast`, `Color.verify` and `Color.shade` take colors written as strings as before.
