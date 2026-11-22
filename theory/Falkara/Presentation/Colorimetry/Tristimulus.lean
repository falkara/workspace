/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

import Mathlib.Algebra.BigOperators.Ring.List
import Mathlib.Algebra.Ring.Rat
public import Falkara.Presentation.Colorimetry.Illuminant
public import Falkara.Presentation.Colorimetry.Observer
meta import Falkara.Citation -- shake: keep
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Tristimulus

The module defines the tristimulus values of a color stimulus as the amounts $X$, $Y$, and $Z$ that
match the color of the stimulus by the reference color stimuli $[X]$, $[Y]$, and $[Z]$ of the CIE
1931 standard colorimetric system [cie2020internationalLightingVocabulary]. The tristimulus values
of a color stimulus function $\varphi_\lambda(\lambda)$ are the sums of the products of the function
and the color-matching functions of the observer at wavelengths from 360 nm to 830 nm in steps of
1 nm [cie2019tristimulusValues]. Tristimulus values add and scale by a factor as the coordinates of
a vector do, as a color equation represents a color stimulus as a vector, so the tristimulus values
of the additive mixture of two color stimulus functions are the sums of their tristimulus values,
as Grassmann's laws state. The white is the color stimulus to which the tristimulus values of a
color are normalized, those of CIE standard illuminant D65 scaled so that their luminance factor $Y$
is 1, as that of an adapted white is [cie2020internationalLightingVocabulary].

## Main Definitions

- `Tristimulus`: a triple of the amounts $X$, $Y$, and $Z$ that match the color of a color stimulus
  by the reference color stimuli $[X]$, $[Y]$, and $[Z]$ of the CIE 1931 standard colorimetric
  system.
- `Tristimulus.add`: gives the tristimulus values of the additive mixture of two color stimuli as
  the sums of their amounts, $X_1 + X_2$, $Y_1 + Y_2$, and $Z_1 + Z_2$.
- `Tristimulus.scale`: gives the tristimulus values of a factor $c$ of units of a color stimulus as
  the products of the factor and its amounts, $cX$, $cY$, and $cZ$.
- `tristimulusOf`: gives the tristimulus values of a color stimulus function
  $\varphi_\lambda(\lambda)$ as the sums over the wavelengths $\lambda$ from 360 nm to 830 nm,
  $X = \sum_{\lambda} \varphi_\lambda(\lambda)\,\bar{x}(\lambda)\,\Delta\lambda$,
  $Y = \sum_{\lambda} \varphi_\lambda(\lambda)\,\bar{y}(\lambda)\,\Delta\lambda$, and
  $Z = \sum_{\lambda} \varphi_\lambda(\lambda)\,\bar{z}(\lambda)\,\Delta\lambda$ with
  $\Delta\lambda = 1\,\mathrm{nm}$.
- `whiteTristimulus`: the tristimulus values of the white, those of CIE standard illuminant D65
  scaled so that their luminance factor $Y$ is 1,
  $X = \sum_{\lambda} S(\lambda)\,\bar{x}(\lambda) / \sum_{\lambda} S(\lambda)\,\bar{y}(\lambda)$,
  $Y = 1$, and
  $Z = \sum_{\lambda} S(\lambda)\,\bar{z}(\lambda) / \sum_{\lambda} S(\lambda)\,\bar{y}(\lambda)$.

## Main Statements

- `Tristimulus.add_comm`: the additive mixture of two color stimuli is the same in either order,
  $X_1 + X_2 = X_2 + X_1$ and likewise for $Y$ and $Z$.
- `Tristimulus.add_assoc`: the additive mixture of three color stimuli is the same in either
  grouping, $(X_1 + X_2) + X_3 = X_1 + (X_2 + X_3)$ and likewise for $Y$ and $Z$.
- `Tristimulus.scale_add`: a factor of units of the additive mixture of two color stimuli is the
  mixture of that factor of units of each, $c\,(X_1 + X_2) = c\,X_1 + c\,X_2$ and likewise for $Y$
  and $Z$.
- `tristimulusOf_add`: the tristimulus values of the additive mixture of two color stimulus
  functions are the sums of their tristimulus values,
  $X(\varphi_1 + \varphi_2) = X(\varphi_1) + X(\varphi_2)$ and likewise for $Y$ and $Z$.
- `tristimulusOf_scale`: the tristimulus values of a color stimulus function multiplied by a factor
  $c$ are the products of the factor and its tristimulus values, $X(c\,\varphi) = c\,X(\varphi)$
  and likewise for $Y$ and $Z$.

## Implementation Notes

The tristimulus values are rational numbers of either sign, as a color equation writes a reference
color stimulus added to the side of the matched stimulus as a negative amount, and as the observer
and the illuminant hold exact rational numbers.

The sums rest on the abstract of ISO/CIE 11664-3, as the text of the standard is sold. The sums
take no factor of normalization, so the tristimulus values of a sum of color stimulus functions are
the sum of their tristimulus values.

The multiple of tristimulus values by a factor rests on the color equation, which takes an amount
as units of a reference color stimulus in a vector representation, as the vocabulary states no law
of proportionality, and the multiple of the tristimulus values of a color stimulus function rests
on the sums of the standard.

The sums pair every wavelength with the row of the observer in the same place, which a check of the
observer proves to be the row at that wavelength, as the kernel of Lean walks two lists zipped in
step, while it reaches a row by its index by walking every row before it.

Each tristimulus value is the sum of a list of products, one list for each color-matching function,
so the theorems of addition and of scaling follow from the theorems of Mathlib on the sum of a
list, `List.sum_map_add` and `List.sum_map_mul_left`.

The white follows the sums of ISO/CIE 11664-3 rather than Table 9.1 of CIE 015
[cie2018colorimetry], which gives D65 as $X = 95.04$, $Y = 100.00$, and $Z = 108.88$ with the
chromaticity coordinates $x = 0.312\,71$ and $y = 0.329\,03$, while the sums at 1 nm from 360 nm
to 830 nm, rounded to the same places, give $X = 95.05$, $Z = 108.88$, $x = 0.312\,73$, and
$y = 0.329\,02$.
-/

@[expose] public section

namespace Falkara.Presentation.Colorimetry

/-! ### Type -/

/-- A triple of the amounts $X$, $Y$, and $Z$ that match the color of a color stimulus by the
reference color stimuli $[X]$, $[Y]$, and $[Z]$ of the CIE 1931 standard colorimetric system. -/
structure Tristimulus where
  /-- The amount of the reference color stimulus $[X]$. -/
  X : ℚ
  /-- The amount of the reference color stimulus $[Y]$. -/
  Y : ℚ
  /-- The amount of the reference color stimulus $[Z]$. -/
  Z : ℚ
  deriving DecidableEq

attribute [cite "17-23-045" cie2020internationalLightingVocabulary] Tristimulus
attribute [cite "17-23-038" cie2020internationalLightingVocabulary] Tristimulus.X
attribute [cite "17-23-038" cie2020internationalLightingVocabulary] Tristimulus.Y
attribute [cite "17-23-038" cie2020internationalLightingVocabulary] Tristimulus.Z

/-! ### Functions -/

/-- Gives the tristimulus values of the additive mixture of two color stimuli as the sums of their
amounts, $X_1 + X_2$, $Y_1 + Y_2$, and $Z_1 + Z_2$. -/
def Tristimulus.add (first second : Tristimulus) : Tristimulus :=
  ⟨first.X + second.X, first.Y + second.Y, first.Z + second.Z⟩

attribute [cite "17-23-040" cie2020internationalLightingVocabulary] Tristimulus.add

/-- Gives the tristimulus values of a factor $c$ of units of a color stimulus as the products of the
factor and its amounts, $cX$, $cY$, and $cZ$. -/
def Tristimulus.scale (tristimulus : Tristimulus) (factor : ℚ) : Tristimulus :=
  ⟨factor * tristimulus.X, factor * tristimulus.Y, factor * tristimulus.Z⟩

attribute [cite "17-23-040" cie2020internationalLightingVocabulary] Tristimulus.scale

/-- Gives the tristimulus values of a color stimulus function $\varphi_\lambda(\lambda)$ as the sums
over the wavelengths $\lambda$ from 360 nm to 830 nm,
$X = \sum_{\lambda} \varphi_\lambda(\lambda)\,\bar{x}(\lambda)\,\Delta\lambda$,
$Y = \sum_{\lambda} \varphi_\lambda(\lambda)\,\bar{y}(\lambda)\,\Delta\lambda$, and
$Z = \sum_{\lambda} \varphi_\lambda(\lambda)\,\bar{z}(\lambda)\,\Delta\lambda$ with
$\Delta\lambda = 1\,\mathrm{nm}$. -/
def tristimulusOf (colorStimulusFunction : (wavelength : Wavelength) → ℚ) : Tristimulus :=
  let pairs := wavelengths.zip observer
  ⟨(pairs.map fun pair ↦ colorStimulusFunction pair.1 * pair.2.xBar).sum,
    (pairs.map fun pair ↦ colorStimulusFunction pair.1 * pair.2.yBar).sum,
    (pairs.map fun pair ↦ colorStimulusFunction pair.1 * pair.2.zBar).sum⟩

attribute [cite "Abstract" cie2019tristimulusValues] tristimulusOf

/-! ### Data -/

/-- The tristimulus values of the white, those of CIE standard illuminant D65 scaled so that their
luminance factor $Y$ is 1,
$X = \sum_{\lambda} S(\lambda)\,\bar{x}(\lambda) / \sum_{\lambda} S(\lambda)\,\bar{y}(\lambda)$,
$Y = 1$, and
$Z = \sum_{\lambda} S(\lambda)\,\bar{z}(\lambda) / \sum_{\lambda} S(\lambda)\,\bar{y}(\lambda)$. -/
def whiteTristimulus : Tristimulus :=
  (tristimulusOf relativeSpectralPowerAt).scale (tristimulusOf relativeSpectralPowerAt).Y⁻¹

attribute [cite "17-23-081" cie2020internationalLightingVocabulary] whiteTristimulus

/-! ### Theorems -/

namespace Tristimulus

/-- The additive mixture of two color stimuli is the same in either order,
$X_1 + X_2 = X_2 + X_1$ and likewise for $Y$ and $Z$. -/
theorem add_comm (first second : Tristimulus) : first.add second = second.add first := by
  simp only [Tristimulus.add, Tristimulus.mk.injEq]
  refine ⟨?_, ?_, ?_⟩ <;> grind

attribute [cite "17-23-040" cie2020internationalLightingVocabulary] add_comm

/-- The additive mixture of three color stimuli is the same in either grouping,
$(X_1 + X_2) + X_3 = X_1 + (X_2 + X_3)$ and likewise for $Y$ and $Z$. -/
theorem add_assoc (first second third : Tristimulus) :
    (first.add second).add third = first.add (second.add third) := by
  simp only [Tristimulus.add, Tristimulus.mk.injEq]
  refine ⟨?_, ?_, ?_⟩ <;> grind

attribute [cite "17-23-040" cie2020internationalLightingVocabulary] add_assoc

/-- A factor of units of the additive mixture of two color stimuli is the mixture of that factor of
units of each, $c\,(X_1 + X_2) = c\,X_1 + c\,X_2$ and likewise for $Y$ and $Z$. -/
theorem scale_add (first second : Tristimulus) (factor : ℚ) :
    (first.add second).scale factor = (first.scale factor).add (second.scale factor) := by
  simp only [Tristimulus.add, Tristimulus.scale, Tristimulus.mk.injEq]
  refine ⟨?_, ?_, ?_⟩ <;> grind

attribute [cite "17-23-040" cie2020internationalLightingVocabulary] scale_add

end Tristimulus

/-- The tristimulus values of the additive mixture of two color stimulus functions are the sums of
their tristimulus values, $X(\varphi_1 + \varphi_2) = X(\varphi_1) + X(\varphi_2)$ and likewise for
$Y$ and $Z$. -/
theorem tristimulusOf_add (first second : (wavelength : Wavelength) → ℚ) :
    tristimulusOf (fun wavelength ↦ first wavelength + second wavelength) =
      (tristimulusOf first).add (tristimulusOf second) := by
  simp only [tristimulusOf, Tristimulus.add, add_mul, List.sum_map_add]

attribute [cite "17-23-033" cie2020internationalLightingVocabulary] tristimulusOf_add

/-- The tristimulus values of a color stimulus function multiplied by a factor $c$ are the products
of the factor and its tristimulus values, $X(c\,\varphi) = c\,X(\varphi)$ and likewise for $Y$ and
$Z$. -/
theorem tristimulusOf_scale (colorStimulusFunction : (wavelength : Wavelength) → ℚ)
    (factor : ℚ) :
    tristimulusOf (fun wavelength ↦ factor * colorStimulusFunction wavelength) =
      (tristimulusOf colorStimulusFunction).scale factor := by
  simp only [tristimulusOf, Tristimulus.scale, mul_assoc, List.sum_map_mul_left]

attribute [cite "Abstract" cie2019tristimulusValues] tristimulusOf_scale

/-! ### Export -/

attribute [export_typescript]
  Tristimulus Tristimulus.add Tristimulus.scale whiteTristimulus
  Tristimulus.add_comm Tristimulus.add_assoc Tristimulus.scale_add

end Falkara.Presentation.Colorimetry
