module

meta import Falkara.Citation
public import Falkara.Presentation.Colorimetry.Chromaticity

/-!
# Chromaticity

The module defines the checks of the chromaticity against the vocabulary
[cie2020internationalLightingVocabulary] and CIE 015 [cie2018colorimetry]. The first check compares
the coordinate $z = 1 - x - y$ of the chromaticity with the quotient of the tristimulus value $Z$
and the sum $X + Y + Z$. The second compares the chromaticity coordinates of the white, rounded as
Table 9.1 of CIE 015 rounds them, with the values that the theory sets beside those of the table.

## Main Statements

- `Chromaticity.z_eq_of_ofTristimulus_eq_some`: the coordinate $z$ of the chromaticity of
  tristimulus values is the quotient of $Z$ and the sum of the values, $z = Z / (X + Y + Z)$.
- `Chromaticity.ofTristimulus_white_rounded`: the chromaticity coordinates of the white round to
  $x = 0.312\,73$ and $y = 0.329\,02$ at five decimal places, where Table 9.1 of CIE 015 gives
  $x = 0.312\,71$ and $y = 0.329\,03$.

## Implementation Notes

The check of the white is proved by `decide +kernel`, as `native_decide` proves every statement by
an axiom of its own, which asserts the result the compiler computes and lies beyond `propext`,
`Classical.choice`, and `Quot.sound`.
-/

public section

namespace Falkara.Presentation

/-- The coordinate $z$ of the chromaticity of tristimulus values is the quotient of $Z$ and the sum
of the values, $z = Z / (X + Y + Z)$. -/
theorem Chromaticity.z_eq_of_ofTristimulus_eq_some {tristimulus : Tristimulus}
    {chromaticity : Chromaticity}
    (ofTristimulus_eq_some : Chromaticity.ofTristimulus tristimulus = some chromaticity) :
    chromaticity.z = tristimulus.Z / (tristimulus.X + tristimulus.Y + tristimulus.Z) := by
  unfold Chromaticity.ofTristimulus at ofTristimulus_eq_some
  split at ofTristimulus_eq_some
  · contradiction
  · cases ofTristimulus_eq_some
    unfold Chromaticity.z
    grind

attribute [cite "17-23-053" cie2020internationalLightingVocabulary]
  Chromaticity.z_eq_of_ofTristimulus_eq_some

/-- The chromaticity coordinates of the white round to $x = 0.312\,73$ and $y = 0.329\,02$ at five
decimal places, where Table 9.1 of CIE 015 gives $x = 0.312\,71$ and $y = 0.329\,03$. -/
theorem Chromaticity.ofTristimulus_white_rounded :
    (Chromaticity.ofTristimulus Tristimulus.white).map (fun chromaticity ↦
      ((chromaticity.x * 100000 + 1 / 2).floor, (chromaticity.y * 100000 + 1 / 2).floor)) =
      some (31273, 32902) := by
  decide +kernel

attribute [cite "Table 9.1" cie2018colorimetry] Chromaticity.ofTristimulus_white_rounded

end Falkara.Presentation
