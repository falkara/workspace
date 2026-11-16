import Presentation.Colorimetry.Illuminant
import Presentation.Colorimetry.Observer

/-!
# Illuminant

The module defines the checks of the illuminant against the data table [cie2019standardIlluminantD65]. The checks compare the sum of the wavelengths $\lambda$, the sum of the values of the relative spectral distribution $S$, and the value at one sample wavelength with the validation values of the data table, and the wavelengths with the range and the step that the data table gives. A further check compares the value of the distribution at 560 nm with 100, as the data table gives it, a further check compares the distribution as a function of the wavelength at every wavelength of the observer with the row of the data table at that wavelength, and a last check finds that the function gives no value at every row below 360 nm, beyond 830 nm, and between two rows.

## Implementation Notes

The checks are proved by `decide +kernel`, as `decide` reaches the maximum recursion depth of the elaborator on 531 rows and `native_decide` proves every statement by an axiom of its own, which asserts the result the compiler computes and lies beyond `propext`, `Classical.choice`, and `Quot.sound`.
-/

namespace Presentation.Colorimetry

deriving instance DecidableEq for MonochromaticComponent

/-- The sum of the wavelengths and the sum of the values of the relative spectral distribution equal the validation values of the data table, $\sum \lambda = 300\,015$ and $\sum S(\lambda) = 40\,852.204$. -/
theorem illuminant_sumOfColumns :
    illuminant.foldl (fun sum component => sum + component.wavelength) 0 = 300015 ∧
      illuminant.foldl (fun sum component => sum + component.relativeSpectralPower) 0 =
        40852.20400 := by
  decide +kernel

attribute [cite "sumOfColumns" cie2019standardIlluminantD65] illuminant_sumOfColumns

/-- The value at the sample wavelength equals the validation value of the data table, $S(419\,\mathrm{nm}) = 93.237\,2$. -/
theorem illuminant_sampleRow :
    illuminant[119]? = some ⟨419, 93.2372⟩ := by
  decide +kernel

attribute [cite "sampleRow" cie2019standardIlluminantD65] illuminant_sampleRow

/-- The wavelengths of the illuminant run from 300 nm to 830 nm in steps of 1 nm, $\lambda_i = (300 + i)\,\mathrm{nm}$ for $i = 0, \ldots, 530$. -/
theorem illuminant_wavelengths :
    illuminant.map (·.wavelength) = (List.range 531).map (fun (index : Nat) => 300 + (index : Rat)) := by
  decide +kernel

attribute [cite "lambda" cie2019standardIlluminantD65] illuminant_wavelengths

/-- The relative spectral distribution of the illuminant is 100 at 560 nm, $S(560\,\mathrm{nm}) = 100$. -/
theorem illuminant_normalization :
    (illuminant.find? (·.wavelength = 560)).map (·.relativeSpectralPower) = some 100 := by
  decide +kernel

attribute [cite "S_D65(lambda)" cie2019standardIlluminantD65] illuminant_normalization

/-- The distribution as a function of the wavelength gives the row of the data table at every wavelength of the observer, $S(\lambda)$ for $\lambda$ from 360 nm to 830 nm, so it gives a value at every one of them. -/
theorem relativeSpectralPowerAt_observer :
    (observer.map fun stimulus => relativeSpectralPowerAt stimulus.wavelength) =
      (illuminant.drop 60).map fun component => some component.relativeSpectralPower := by
  decide +kernel

attribute [cite "S_D65(lambda)" cie2019standardIlluminantD65] relativeSpectralPowerAt_observer

/-- The distribution as a function of the wavelength gives no value at the rows of the data table below 360 nm, beyond 830 nm, and between two rows, as the metadata of the data table gives the column of the distribution the wavelengths from 360 nm to 830 nm in steps of 1 nm. -/
theorem relativeSpectralPowerAt_outside :
    (illuminant.take 60).map (fun component => relativeSpectralPowerAt component.wavelength) = List.replicate 60 none ∧
      relativeSpectralPowerAt 831 = none ∧ relativeSpectralPowerAt (1121 / 2) = none := by
  decide +kernel

attribute [cite "columnHeaders" cie2019standardIlluminantD65] relativeSpectralPowerAt_outside

end Presentation.Colorimetry
