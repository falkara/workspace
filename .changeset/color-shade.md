---
'@falkara/presentation': minor
---

Add `Color.shade`, which finds the shade of a brand color closest to it in lightness that reaches the contrast its text needs against a background: the hue is kept, the chroma is kept or, where sRGB cannot hold it, reduced as CSS Color 4 gamut mapping reduces it, and a background no shade can reach is refused with the reason.
