---
'@falkara/presentation': patch
---

The colors of `Color` are refused outside sRGB with the reason WCAG 2.2 gives, that sRGB is the color space whose relative luminance it gives and in which it asks authors to evaluate contrast unless another is known to be used, instead of the claim that it defines contrast only there, as its definition of relative luminance holds in any color space.
