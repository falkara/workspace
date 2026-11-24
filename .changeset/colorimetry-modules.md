---
'@falkara/presentation': minor
---

`Tristimulus` and `Chromaticity` are modules of their own, `@falkara/presentation/Colorimetry/Tristimulus` and `@falkara/presentation/Colorimetry/Chromaticity`, each imported as a namespace as Effect imports its modules, and `Colorimetry` no longer re-exports them. Each names its declarations after the module: `Tristimulus.make` and `Chromaticity.make` brand values written by hand in place of `tristimulus` and `chromaticity`, and `Colorimetry.whiteTristimulus`, `Colorimetry.chromaticityOf`, and `Colorimetry.whiteChromaticity` are now `Tristimulus.white`, `Chromaticity.ofTristimulus`, and `Chromaticity.white`.
