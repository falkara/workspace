import ExportTypeScript
import Presentation.Colorimetry.Observer

/-!
# Tristimulus

The module defines the tristimulus values of a color stimulus as the amounts $X$, $Y$, and $Z$ that match the color of the stimulus by the reference color stimuli $[X]$, $[Y]$, and $[Z]$ of the CIE 1931 standard colorimetric system [cie2020internationalLightingVocabulary]. The tristimulus values of a color stimulus function $\varphi_\lambda(\lambda)$ are the sums of the products of the function and the color-matching functions of the observer at wavelengths from 360 nm to 830 nm in steps of 1 nm [cie2019tristimulusValues]. Tristimulus values add and scale by a factor as the coordinates of a vector do, as a color equation represents a color stimulus as a vector, so the tristimulus values of the additive mixture of two color stimulus functions are the sums of their tristimulus values, as Grassmann's laws state.

## Implementation Notes

The tristimulus values are rational numbers of either sign, as a color equation writes a reference color stimulus added to the side of the matched stimulus as a negative amount, and as the observer and the illuminant hold exact rational numbers.

The sums rest on the abstract of ISO/CIE 11664-3, as the text of the standard is sold. The sums take no factor of normalization, so the tristimulus values of a sum of color stimulus functions are the sum of their tristimulus values.

The multiple of tristimulus values by a factor rests on the color equation, which takes an amount as units of a reference color stimulus in a vector representation, as the vocabulary states no law of proportionality, and the multiple of the tristimulus values of a color stimulus function rests on the sums of the standard.
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
attribute [export_typescript] Tristimulus

/-- Gives the tristimulus values of the additive mixture of two color stimuli as the sums of their amounts, $X_1 + X_2$, $Y_1 + Y_2$, and $Z_1 + Z_2$. -/
def Tristimulus.add (first second : Tristimulus) : Tristimulus :=
  ⟨first.X + second.X, first.Y + second.Y, first.Z + second.Z⟩

attribute [cite "17-23-040" cie2020internationalLightingVocabulary] Tristimulus.add
attribute [export_typescript] Tristimulus.add

/-- Gives the tristimulus values of a factor $c$ of units of a color stimulus as the products of the factor and its amounts, $cX$, $cY$, and $cZ$. -/
def Tristimulus.scale (tristimulus : Tristimulus) (factor : Rat) : Tristimulus :=
  ⟨factor * tristimulus.X, factor * tristimulus.Y, factor * tristimulus.Z⟩

attribute [cite "17-23-040" cie2020internationalLightingVocabulary] Tristimulus.scale
attribute [export_typescript] Tristimulus.scale

/-- The additive mixture of two color stimuli is the same in either order, $X_1 + X_2 = X_2 + X_1$ and likewise for $Y$ and $Z$. -/
theorem Tristimulus.add_comm (first second : Tristimulus) : first.add second = second.add first := by
  simp only [Tristimulus.add, Tristimulus.mk.injEq]
  refine ⟨?_, ?_, ?_⟩ <;> grind

attribute [cite "17-23-040" cie2020internationalLightingVocabulary] Tristimulus.add_comm
attribute [export_typescript] Tristimulus.add_comm

/-- The additive mixture of three color stimuli is the same in either grouping, $(X_1 + X_2) + X_3 = X_1 + (X_2 + X_3)$ and likewise for $Y$ and $Z$. -/
theorem Tristimulus.add_assoc (first second third : Tristimulus) :
    (first.add second).add third = first.add (second.add third) := by
  simp only [Tristimulus.add, Tristimulus.mk.injEq]
  refine ⟨?_, ?_, ?_⟩ <;> grind

attribute [cite "17-23-040" cie2020internationalLightingVocabulary] Tristimulus.add_assoc
attribute [export_typescript] Tristimulus.add_assoc

/-- A factor of units of the additive mixture of two color stimuli is the mixture of that factor of units of each, $c\,(X_1 + X_2) = c\,X_1 + c\,X_2$ and likewise for $Y$ and $Z$. -/
theorem Tristimulus.scale_add (first second : Tristimulus) (factor : Rat) :
    (first.add second).scale factor = (first.scale factor).add (second.scale factor) := by
  simp only [Tristimulus.add, Tristimulus.scale, Tristimulus.mk.injEq]
  refine ⟨?_, ?_, ?_⟩ <;> grind

attribute [cite "17-23-040" cie2020internationalLightingVocabulary] Tristimulus.scale_add
attribute [export_typescript] Tristimulus.scale_add

/-- Gives the tristimulus values of a color stimulus function $\varphi_\lambda(\lambda)$ as the sums over the wavelengths $\lambda$ of the observer, $X = \sum_{\lambda} \varphi_\lambda(\lambda)\,\bar{x}(\lambda)\,\Delta\lambda$, $Y = \sum_{\lambda} \varphi_\lambda(\lambda)\,\bar{y}(\lambda)\,\Delta\lambda$, and $Z = \sum_{\lambda} \varphi_\lambda(\lambda)\,\bar{z}(\lambda)\,\Delta\lambda$ with $\Delta\lambda = 1\,\mathrm{nm}$. -/
def tristimulusOf (colorStimulusFunction : (wavelength : Rat) → Rat) : Tristimulus :=
  observer.foldl
    (fun sum monochromaticStimulus =>
      ⟨sum.X + colorStimulusFunction monochromaticStimulus.wavelength * monochromaticStimulus.xBar,
        sum.Y + colorStimulusFunction monochromaticStimulus.wavelength * monochromaticStimulus.yBar,
        sum.Z + colorStimulusFunction monochromaticStimulus.wavelength * monochromaticStimulus.zBar⟩)
    ⟨0, 0, 0⟩

attribute [cite "Abstract" cie2019tristimulusValues] tristimulusOf

/-- The tristimulus values of the additive mixture of two color stimulus functions are the sums of their tristimulus values, $X(\varphi_1 + \varphi_2) = X(\varphi_1) + X(\varphi_2)$ and likewise for $Y$ and $Z$. -/
theorem tristimulusOf_add (first second : (wavelength : Rat) → Rat) :
    tristimulusOf (fun wavelength => first wavelength + second wavelength) =
      (tristimulusOf first).add (tristimulusOf second) := by
  unfold tristimulusOf
  rw [← Array.foldl_toList, ← Array.foldl_toList, ← Array.foldl_toList]
  generalize observer.toList = stimuli
  suffices ∀ (firstSum secondSum : Tristimulus),
      stimuli.foldl (fun sum monochromaticStimulus =>
          ⟨sum.X + (first monochromaticStimulus.wavelength + second monochromaticStimulus.wavelength) * monochromaticStimulus.xBar,
            sum.Y + (first monochromaticStimulus.wavelength + second monochromaticStimulus.wavelength) * monochromaticStimulus.yBar,
            sum.Z + (first monochromaticStimulus.wavelength + second monochromaticStimulus.wavelength) * monochromaticStimulus.zBar⟩)
        (firstSum.add secondSum) =
      (stimuli.foldl (fun sum monochromaticStimulus =>
          ⟨sum.X + first monochromaticStimulus.wavelength * monochromaticStimulus.xBar,
            sum.Y + first monochromaticStimulus.wavelength * monochromaticStimulus.yBar,
            sum.Z + first monochromaticStimulus.wavelength * monochromaticStimulus.zBar⟩) firstSum).add
        (stimuli.foldl (fun sum monochromaticStimulus =>
          ⟨sum.X + second monochromaticStimulus.wavelength * monochromaticStimulus.xBar,
            sum.Y + second monochromaticStimulus.wavelength * monochromaticStimulus.yBar,
            sum.Z + second monochromaticStimulus.wavelength * monochromaticStimulus.zBar⟩) secondSum) by
    have zero : (⟨0, 0, 0⟩ : Tristimulus) = (⟨0, 0, 0⟩ : Tristimulus).add ⟨0, 0, 0⟩ := by
      simp only [Tristimulus.add, Tristimulus.mk.injEq]
      grind
    conv => lhs; rw [zero]
    exact this _ _
  induction stimuli with
  | nil => intro firstSum secondSum; rfl
  | cons monochromaticStimulus rest ih =>
    intro firstSum secondSum
    simp only [List.foldl]
    rw [← ih]
    congr 1
    simp only [Tristimulus.add, Tristimulus.mk.injEq]
    refine ⟨?_, ?_, ?_⟩ <;> grind

attribute [cite "17-23-033" cie2020internationalLightingVocabulary] tristimulusOf_add

/-- The tristimulus values of a color stimulus function multiplied by a factor $c$ are the products of the factor and its tristimulus values, $X(c\,\varphi) = c\,X(\varphi)$ and likewise for $Y$ and $Z$. -/
theorem tristimulusOf_scale (colorStimulusFunction : (wavelength : Rat) → Rat) (factor : Rat) :
    tristimulusOf (fun wavelength => factor * colorStimulusFunction wavelength) =
      (tristimulusOf colorStimulusFunction).scale factor := by
  unfold tristimulusOf
  rw [← Array.foldl_toList, ← Array.foldl_toList]
  generalize observer.toList = stimuli
  suffices ∀ (sum : Tristimulus),
      stimuli.foldl (fun sum monochromaticStimulus =>
          ⟨sum.X + factor * colorStimulusFunction monochromaticStimulus.wavelength * monochromaticStimulus.xBar,
            sum.Y + factor * colorStimulusFunction monochromaticStimulus.wavelength * monochromaticStimulus.yBar,
            sum.Z + factor * colorStimulusFunction monochromaticStimulus.wavelength * monochromaticStimulus.zBar⟩)
        (sum.scale factor) =
      (stimuli.foldl (fun sum monochromaticStimulus =>
          ⟨sum.X + colorStimulusFunction monochromaticStimulus.wavelength * monochromaticStimulus.xBar,
            sum.Y + colorStimulusFunction monochromaticStimulus.wavelength * monochromaticStimulus.yBar,
            sum.Z + colorStimulusFunction monochromaticStimulus.wavelength * monochromaticStimulus.zBar⟩) sum).scale factor by
    have zero : (⟨0, 0, 0⟩ : Tristimulus) = (⟨0, 0, 0⟩ : Tristimulus).scale factor := by
      simp [Tristimulus.scale]
    conv => lhs; rw [zero]
    exact this _
  induction stimuli with
  | nil => intro sum; rfl
  | cons monochromaticStimulus rest ih =>
    intro sum
    simp only [List.foldl]
    rw [← ih]
    congr 1
    simp only [Tristimulus.scale, Tristimulus.mk.injEq]
    refine ⟨?_, ?_, ?_⟩ <;> grind

attribute [cite "Abstract" cie2019tristimulusValues] tristimulusOf_scale

end Presentation.Colorimetry
