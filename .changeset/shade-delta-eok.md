---
'@falkara/presentation': minor
---

`Color.shade` picks the shade closest to the brand color by deltaEOK, the color difference CSS Color 4 defines, rather than by lightness alone, so a shade that keeps more chroma wins over one barely nearer in lightness. Its chroma is described as what it is: reduced at constant lightness and hue to the edge of sRGB, the reduction every CSS Color 4 gamut mapping algorithm aims at, reached exactly rather than within their tolerance.
