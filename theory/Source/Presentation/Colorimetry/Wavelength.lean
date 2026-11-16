import References

/-!
# Wavelength

The module defines the wavelength at which the theory computes, a whole number of nanometers from 360 nm to 830 nm, as the standard method of ISO/CIE 11664-3 sums at 1 nm from 360 nm to 830 nm [cie2019tristimulusValues], and every such wavelength in order.

## Implementation Notes

The wavelength bounds the functions of the theory alone, while the data tables hold the wavelength of every row as the whole number that the data table gives, as a data table may hold rows beyond 360 nm to 830 nm, such as the rows of CIE standard illuminant D65 from 300 nm. A function of the wavelength thus gives a value at every wavelength, and a wavelength beyond the range has no value to give.
-/

namespace Presentation.Colorimetry

/-- A wavelength at which the theory computes, a whole number of nanometers from 360 nm to 830 nm. -/
abbrev Wavelength := { nanometers : Nat // 360 ≤ nanometers ∧ nanometers ≤ 830 }

attribute [cite "Abstract" cie2019tristimulusValues] Wavelength

/-- The wavelengths at which the theory computes, from 360 nm to 830 nm in steps of 1 nm. -/
def wavelengths : List Wavelength :=
  (List.finRange 471).map fun index => ⟨360 + index.val, by have := index.isLt; omega⟩

attribute [cite "Abstract" cie2019tristimulusValues] wavelengths

end Presentation.Colorimetry
