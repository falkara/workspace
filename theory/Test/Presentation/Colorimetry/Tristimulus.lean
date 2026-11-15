import Presentation.Colorimetry.Tristimulus

/-!
# Tristimulus

The module defines the checks of the tristimulus values against the data table [cie2019colorMatchingFunctions]. The check compares the tristimulus values of the color stimulus function that is 1 at every wavelength with the sums of the values of the color-matching functions $\bar{x}$, $\bar{y}$, and $\bar{z}$ among the validation values of the data table.

## Implementation Notes

The check is proved by `decide +kernel`, as `decide` reaches the maximum recursion depth of the elaborator on 471 rows and `native_decide` proves every statement by an axiom of its own, which asserts the result the compiler computes and lies beyond `propext`, `Classical.choice`, and `Quot.sound`.
-/

namespace Presentation.Colorimetry

deriving instance DecidableEq for Tristimulus

/-- The tristimulus values of the color stimulus function that is 1 at every wavelength equal the sums of the values of the color-matching functions, $(X, Y, Z) = (106.865\,469\,489\,595, 106.856\,917\,101\,171\,9, 106.892\,251\,278\,636)$. -/
theorem tristimulusOf_one :
    tristimulusOf (fun _ => 1) = ⟨106.865469489595, 106.8569171011719, 106.892251278636⟩ := by
  decide +kernel

attribute [cite "sumOfColumns" cie2019colorMatchingFunctions] tristimulusOf_one

end Presentation.Colorimetry
