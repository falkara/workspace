---
'@falkara/presentation': minor
---

A new module, `Colorimetry`, holds the white every color of the library will rest on: the CIE standard illuminant D65 under the CIE 1931 standard colorimetric observer for a 2° field. Only its tristimulus values relative to a Y of 1, `whiteTristimulus`, are worked out once, as a `Tristimulus`, the type of a color, branded apart from other values of the same shape and made from values a caller writes with `tristimulus`, exactly, from the spectrum of D65 and the color-matching functions of the observer in the official CIE datasets, which are cited with their checksums. Its chromaticity coordinates, `whiteChromaticity`, follow from them in the code. D65 is taken as its spectrum rather than as published chromaticity coordinates, which follow from the spectrum and an observer, so that a later observer keeps the same white and only its tristimulus values are worked out again.
