---
'@falkara/presentation': minor
---

`Colorimetry.purestColor` turns a hue into a color in a medium: the purest color of the hue the medium shows, where the line of the hue from the library's white leaves the gamut, at the highest luminance a headroom allows, as exact tristimulus values. The headroom bounds the largest linear channel relative to the white rather than the luminance Y; it is 1 by default, so that in HDR a color stays at the level of HDR Reference White, and may reach the peak of the medium, up to 10000/203 for PQ. `PurestColorOptions` refuses a headroom that is not positive or that exceeds the peak, each with its reason.
