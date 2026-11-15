import Presentation.Colorimetry.Chromaticity

/-!
# Chromaticity

The module defines the checks of the chromaticity against the vocabulary [cie2020internationalLightingVocabulary]. The check compares the coordinate $z = 1 - x - y$ of the chromaticity with the quotient of the tristimulus value $Z$ and the sum $X + Y + Z$.
-/

namespace Presentation.Colorimetry

/-- The coordinate $z$ of the chromaticity of tristimulus values is the quotient of $Z$ and the sum of the values, $z = Z / (X + Y + Z)$. -/
theorem z_eq_of_chromaticityOf_eq_some {tristimulus : Tristimulus} {chromaticity : Chromaticity}
    (chromaticityOf_eq_some : chromaticityOf tristimulus = some chromaticity) :
    chromaticity.z = tristimulus.Z / (tristimulus.X + tristimulus.Y + tristimulus.Z) := by
  unfold chromaticityOf at chromaticityOf_eq_some
  split at chromaticityOf_eq_some
  · contradiction
  · cases chromaticityOf_eq_some
    unfold Chromaticity.z
    grind

attribute [cite "17-23-053" cie2020internationalLightingVocabulary] z_eq_of_chromaticityOf_eq_some

end Presentation.Colorimetry
