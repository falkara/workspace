module

public import Falkara.Presentation.Colorimetry.Illuminant

import Falkara.Counterpart
import Falkara.References

/-!
# Illuminant

The module defines the checks of the illuminant against the data table of CIE standard illuminant
D65. The checks compare the sum of the wavelengths $\lambda$, the sum of the values of the relative
spectral distribution $S$, and the value at one sample wavelength with the validation values of the
data table, and the wavelengths with the range and the step that the data table gives. A further
check compares the value of the distribution at 560 nm with 100, as the data table gives it, and a
last theorem proves that the distribution as a function of the wavelength gives at every wavelength
from 360 nm to 830 nm the row of the data table at that wavelength.

## Implementation Notes

The distribution at every wavelength is proved from the wavelengths of the rows for a wavelength
of any value, rather than computed at each of the 471 wavelengths, as the kernel of Lean reaches a
row by its index by walking every row before it, which takes gigabytes of memory over every
wavelength.

The checks are proved by `decide +kernel`, as `decide` reaches the maximum recursion depth of the
elaborator on 531 rows and `native_decide` proves every statement by an axiom of its own, which
asserts the result the compiler computes and lies beyond `propext`, `Classical.choice`, and
`Quot.sound`.
-/

public section

namespace Falkara.Presentation

/-- The sum of the wavelengths and the sum of the values of the relative spectral distribution equal
the validation values of the data table, $\sum \lambda = 300\,015$ and
$\sum S(\lambda) = 40\,852.204$. -/
@[counterpart CIE.standardIlluminantD65 "sumOfColumns"]
theorem illuminant_sumOfColumns :
    illuminant.foldl (fun sum component ↦ sum + component.wavelength) 0 = 300015 ∧
      illuminant.foldl (fun sum component ↦ sum + component.relativeSpectralPower) 0 =
        40852.20400 := by
  decide +kernel

/-- The value at the sample wavelength equals the validation value of the data table,
$S(419\,\mathrm{nm}) = 93.237\,2$. -/
@[counterpart CIE.standardIlluminantD65 "sampleRow"]
theorem illuminant_sampleRow :
    illuminant[119]? = some ⟨419, 93.2372⟩ := by
  decide +kernel

/-- The wavelengths of the illuminant run from 300 nm to 830 nm in steps of 1 nm,
$\lambda_i = (300 + i)\,\mathrm{nm}$ for $i = 0, \ldots, 530$. -/
@[counterpart CIE.standardIlluminantD65 "lambda"]
theorem illuminant_wavelengths :
    illuminant.map (·.wavelength) = (List.range 531).map (300 + ·) := by
  decide +kernel

/-- The relative spectral distribution of the illuminant is 100 at 560 nm,
$S(560\,\mathrm{nm}) = 100$. -/
@[counterpart CIE.standardIlluminantD65 "S_D65(lambda)"]
theorem illuminant_normalization :
    (illuminant.find? (·.wavelength = 560)).map (·.relativeSpectralPower) = some 100 := by
  decide +kernel

/-- The distribution as a function of the wavelength gives the row of the data table at every
wavelength from 360 nm to 830 nm, $S(\lambda)$. -/
@[counterpart CIE.standardIlluminantD65 "S_D65(lambda)"]
theorem relativeSpectralPowerAt_row (wavelength : Wavelength) :
    ∃ component ∈ illuminant, component.wavelength = wavelength.val ∧
      relativeSpectralPowerAt wavelength = component.relativeSpectralPower := by
  have bounds := wavelength.property
  have index : wavelength.val - 300 < illuminant.length := by rw [length_illuminant]; omega
  refine ⟨illuminant[wavelength.val - 300], List.getElem_mem index, ?_, rfl⟩
  have row := congrArg (fun rows ↦ rows[wavelength.val - 300]?) illuminant_wavelengths
  simp only [List.getElem?_map, List.getElem?_eq_getElem index,
    List.getElem?_range (by omega : wavelength.val - 300 < 531)] at row
  simp at row
  omega

end Falkara.Presentation
