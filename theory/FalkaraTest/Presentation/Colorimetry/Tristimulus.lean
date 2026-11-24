module

meta import Falkara.Citation
public import Falkara.Presentation.Colorimetry.Tristimulus

/-!
# Tristimulus

The module defines the checks of the tristimulus values against the data table
[cie2019colorMatchingFunctions] and of the white against the vocabulary
[cie2020internationalLightingVocabulary] and CIE 015 [cie2018colorimetry]. The first check compares
the tristimulus values of the color stimulus function that is 1 at every wavelength with the sums
of the values of the color-matching functions $\bar{x}$, $\bar{y}$, and $\bar{z}$ among the
validation values of the data table. The checks of the white compare its luminance factor with 1,
and its tristimulus values rounded as Table 9.1 of CIE 015 rounds them with the values that the
theory sets beside those of the table.

## Main Statements

- `Tristimulus.ofColorStimulusFunction_one`: the tristimulus values of the color stimulus function
  that is 1 at every wavelength equal the sums of the values of the color-matching functions,
  $(X, Y, Z) = (106.865\,469\,489\,595, 106.856\,917\,101\,171\,9, 106.892\,251\,278\,636)$.
- `Tristimulus.white_Y`: the luminance factor of the white is 1, $Y = 1$.
- `Tristimulus.white_rounded`: the tristimulus values of the white scaled so that $Y = 100$ round
  to $X = 95.05$ and $Z = 108.88$ at two decimal places, where Table 9.1 of CIE 015 gives
  $X = 95.04$ and $Z = 108.88$.

## Implementation Notes

The checks are proved by `decide +kernel`, as `decide` reaches the maximum recursion depth of the
elaborator on 471 rows and `native_decide` proves every statement by an axiom of its own, which
asserts the result the compiler computes and lies beyond `propext`, `Classical.choice`, and
`Quot.sound`.
-/

public section

namespace Falkara.Presentation

/-- The tristimulus values of the color stimulus function that is 1 at every wavelength equal the
sums of the values of the color-matching functions,
$(X, Y, Z) = (106.865\,469\,489\,595, 106.856\,917\,101\,171\,9, 106.892\,251\,278\,636)$. -/
theorem Tristimulus.ofColorStimulusFunction_one :
    Tristimulus.ofColorStimulusFunction (fun _ ↦ 1) =
      ⟨106.865469489595, 106.8569171011719, 106.892251278636⟩ := by
  decide +kernel

attribute [cite "sumOfColumns" cie2019colorMatchingFunctions]
  Tristimulus.ofColorStimulusFunction_one

/-- The luminance factor of the white is 1, $Y = 1$. -/
theorem Tristimulus.white_Y : Tristimulus.white.Y = 1 := by
  decide +kernel

attribute [cite "17-23-081" cie2020internationalLightingVocabulary] Tristimulus.white_Y

/-- The tristimulus values of the white scaled so that $Y = 100$ round to $X = 95.05$ and
$Z = 108.88$ at two decimal places, where Table 9.1 of CIE 015 gives $X = 95.04$ and
$Z = 108.88$. -/
theorem Tristimulus.white_rounded :
    (Tristimulus.white.X * 10000 + 1 / 2).floor = 9505 ∧
      (Tristimulus.white.Z * 10000 + 1 / 2).floor = 10888 := by
  decide +kernel

attribute [cite "Table 9.1" cie2018colorimetry] Tristimulus.white_rounded

end Falkara.Presentation
