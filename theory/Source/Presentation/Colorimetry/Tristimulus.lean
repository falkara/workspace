import References

/-!
# Tristimulus

The module defines the tristimulus values of a color stimulus as the amounts $X$, $Y$, and $Z$ that match the color of the stimulus by the reference color stimuli $[X]$, $[Y]$, and $[Z]$ of the CIE 1931 standard colorimetric system [cie2020internationalLightingVocabulary].

## Implementation Notes

The tristimulus values are rational numbers of either sign, as a color equation writes a reference color stimulus added to the side of the matched stimulus as a negative amount, and as the observer and the illuminant hold exact rational numbers.
-/

namespace Presentation.Colorimetry

/-- A triple of the amounts $X$, $Y$, and $Z$ that match the color of a color stimulus by the reference color stimuli $[X]$, $[Y]$, and $[Z]$ of the CIE 1931 standard colorimetric system. -/
structure Tristimulus where
  /-- The amount of the reference color stimulus $[X]$. -/
  X : Rat
  /-- The amount of the reference color stimulus $[Y]$. -/
  Y : Rat
  /-- The amount of the reference color stimulus $[Z]$. -/
  Z : Rat

attribute [cite "17-23-045" cie2020internationalLightingVocabulary] Tristimulus
attribute [cite "17-23-038" cie2020internationalLightingVocabulary] Tristimulus.X
attribute [cite "17-23-038" cie2020internationalLightingVocabulary] Tristimulus.Y
attribute [cite "17-23-038" cie2020internationalLightingVocabulary] Tristimulus.Z

end Presentation.Colorimetry
