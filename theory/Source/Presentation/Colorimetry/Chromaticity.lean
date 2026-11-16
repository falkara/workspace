import Presentation.Colorimetry.Tristimulus

/-!
# Chromaticity

The module defines the chromaticity of a color stimulus by the chromaticity coordinates $x$, $y$, and $z$, the quotients of the tristimulus values $X$, $Y$, and $Z$ and their sum $X + Y + Z$ [cie2020internationalLightingVocabulary]. The three coordinates sum to 1, so the coordinates $x$ and $y$ define the chromaticity.

## Implementation Notes

The chromaticity holds the coordinates $x$ and $y$ alone and gives $z$ as $1 - x - y$, so every pair of rational numbers is a chromaticity, and the three coordinates of every chromaticity sum to 1.

The chromaticity of tristimulus values that sum to 0 is `none`, as a quotient by 0 is undefined.
-/

namespace Presentation.Colorimetry

/-- A property of a color stimulus that its chromaticity coordinates $x$ and $y$ define. -/
structure Chromaticity where
  /-- The quotient of the tristimulus value $X$ and the sum $X + Y + Z$. -/
  x : Rat
  /-- The quotient of the tristimulus value $Y$ and the sum $X + Y + Z$. -/
  y : Rat

attribute [cite "17-23-052" cie2020internationalLightingVocabulary] Chromaticity
attribute [cite "17-23-053" cie2020internationalLightingVocabulary] Chromaticity.x
attribute [cite "17-23-053" cie2020internationalLightingVocabulary] Chromaticity.y
attribute [export_typescript] Chromaticity

/-- Gives the chromaticity coordinate $z$ of the chromaticity, $z = 1 - x - y$. -/
def Chromaticity.z (chromaticity : Chromaticity) : Rat :=
  1 - chromaticity.x - chromaticity.y

attribute [cite "17-23-053" cie2020internationalLightingVocabulary] Chromaticity.z
attribute [export_typescript] Chromaticity.z

/-- Gives `none` where $X + Y + Z = 0$ and otherwise the chromaticity of the tristimulus values, $x = X / (X + Y + Z)$ and $y = Y / (X + Y + Z)$. -/
def chromaticityOf (tristimulus : Tristimulus) : Option Chromaticity :=
  if tristimulus.X + tristimulus.Y + tristimulus.Z = 0 then
    none
  else
    some ⟨tristimulus.X / (tristimulus.X + tristimulus.Y + tristimulus.Z),
      tristimulus.Y / (tristimulus.X + tristimulus.Y + tristimulus.Z)⟩

attribute [cite "17-23-053" cie2020internationalLightingVocabulary] chromaticityOf
attribute [export_typescript] chromaticityOf

/-- The chromaticity of a factor $c \neq 0$ of units of a color stimulus is the chromaticity of the stimulus, as the chromaticity coordinates are quotients of the tristimulus values and their sum, $c\,X / (c\,X + c\,Y + c\,Z) = X / (X + Y + Z)$ and likewise for $y$. -/
theorem chromaticityOf_scale (tristimulus : Tristimulus) (factor : Rat) (nonzero : factor ≠ 0) :
    chromaticityOf (tristimulus.scale factor) = chromaticityOf tristimulus := by
  unfold chromaticityOf Tristimulus.scale
  simp only
  split <;> split
  · rfl
  · grind
  · grind
  · simp only [Option.some.injEq, Chromaticity.mk.injEq]
    constructor <;> grind

attribute [cite "17-23-053" cie2020internationalLightingVocabulary] chromaticityOf_scale
attribute [export_typescript] chromaticityOf_scale

end Presentation.Colorimetry
