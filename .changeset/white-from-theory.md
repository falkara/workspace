---
'@falkara/presentation': patch
---

`Colorimetry` takes `whiteTristimulus` from the theory of the library, which sums CIE standard illuminant D65 under the CIE 1931 standard colorimetric observer at every 1 nm from 360 nm to 830 nm and scales the sums so that the luminance factor $Y$ is 1. The value is the same to the last digit, so no color changes.
