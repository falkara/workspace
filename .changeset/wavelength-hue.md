---
'@falkara/presentation': minor
---

`Colorimetry` gives a hue by a wavelength, as CIE S 017 defines it: `dominantWavelength` for λd and `complementaryWavelength` for λc, each from the wavelength and the color-matching functions x̄, ȳ and z̄ of the CIE 1931 2° observer at it, which the caller supplies as the CIE dataset publishes them. Both return a `Hue`, exactly in `Rational`: the chromaticity of the spectral light and the direction of the hue from the white, toward the spectral light for a dominant wavelength and away from it for a complementary one, left unscaled so that it can be intersected exactly. Their inputs, `DominantWavelengthOptions` and `ComplementaryWavelengthOptions`, refuse a wavelength outside 360 nm to 830 nm, a negative value, a row of zeros and a row whose spectral light has the chromaticity of the white, each with its reason. `whiteChromaticity` is now typed as the new `Chromaticity`.
