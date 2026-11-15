import Presentation.Colorimetry.Observer

/-!
# Tristimulus

The module defines the tristimulus values of a color stimulus as the amounts $X$, $Y$, and $Z$ that match the color of the stimulus by the reference color stimuli $[X]$, $[Y]$, and $[Z]$ of the CIE 1931 standard colorimetric system [cie2020internationalLightingVocabulary]. The tristimulus values of a color stimulus function $\varphi_\lambda(\lambda)$ are the sums of the products of the function and the color-matching functions of the observer at wavelengths from 360 nm to 830 nm in steps of 1 nm [cie2019tristimulusValues].

## Implementation Notes

The tristimulus values are rational numbers of either sign, as a color equation writes a reference color stimulus added to the side of the matched stimulus as a negative amount, and as the observer and the illuminant hold exact rational numbers.

The sums rest on the abstract of ISO/CIE 11664-3, as the text of the standard is sold. The sums take no factor of normalization, so the tristimulus values of a sum of color stimulus functions are the sum of their tristimulus values.
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

/-- Gives the tristimulus values of a color stimulus function $\varphi_\lambda(\lambda)$ as the sums over the wavelengths $\lambda$ of the observer, $X = \sum_{\lambda} \varphi_\lambda(\lambda)\,\bar{x}(\lambda)\,\Delta\lambda$, $Y = \sum_{\lambda} \varphi_\lambda(\lambda)\,\bar{y}(\lambda)\,\Delta\lambda$, and $Z = \sum_{\lambda} \varphi_\lambda(\lambda)\,\bar{z}(\lambda)\,\Delta\lambda$ with $\Delta\lambda = 1\,\mathrm{nm}$. -/
def tristimulusOf (colorStimulusFunction : Rat → Rat) : Tristimulus :=
  observer.foldl
    (fun sum monochromaticStimulus =>
      ⟨sum.X + colorStimulusFunction monochromaticStimulus.wavelength * monochromaticStimulus.xBar,
        sum.Y + colorStimulusFunction monochromaticStimulus.wavelength * monochromaticStimulus.yBar,
        sum.Z + colorStimulusFunction monochromaticStimulus.wavelength * monochromaticStimulus.zBar⟩)
    ⟨0, 0, 0⟩

attribute [cite "Abstract" cie2019tristimulusValues] tristimulusOf

end Presentation.Colorimetry
