/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Presentation.Colorimetry.Tristimulus

import Falkara.ExportTypeScript
import Falkara.References

/-!
# Chromaticity

The module defines the chromaticity of a color stimulus by the chromaticity coordinates $x$, $y$,
and $z$, the quotients of the tristimulus values $X$, $Y$, and $Z$ and their sum $X + Y + Z$
[cie2020internationalLightingVocabulary]. The three coordinates sum to 1, so the coordinates $x$
and $y$ define the chromaticity.

## Main Definitions

- `Chromaticity`: a property of a color stimulus that its chromaticity coordinates $x$ and $y$
  define.
- `Chromaticity.z`: gives the chromaticity coordinate $z$ of the chromaticity, $z = 1 - x - y$.
- `Chromaticity.ofTristimulus`: gives `none` where $X + Y + Z = 0$ and otherwise the chromaticity
  of the tristimulus values, $x = X / (X + Y + Z)$ and $y = Y / (X + Y + Z)$.

## Main Statements

- `Chromaticity.ofTristimulus_scale`: the chromaticity of a factor $c \neq 0$ of units of a color
  stimulus is the chromaticity of the stimulus, as the chromaticity coordinates are quotients of the
  tristimulus values and their sum, $c\,X / (c\,X + c\,Y + c\,Z) = X / (X + Y + Z)$ and likewise
  for $y$.

## Implementation Notes

The chromaticity holds the coordinates $x$ and $y$ alone and gives $z$ as $1 - x - y$, so every
pair of rational numbers is a chromaticity, and the three coordinates of every chromaticity sum
to 1.

The chromaticity of tristimulus values that sum to 0 is `none`, as a quotient by 0 is undefined.
-/

@[expose] public section

namespace Falkara.Presentation

/-! ### Type -/

/-- A property of a color stimulus that its chromaticity coordinates $x$ and $y$ define. -/
structure Chromaticity where
  /-- The quotient of the tristimulus value $X$ and the sum $X + Y + Z$. -/
  x : ℚ
  /-- The quotient of the tristimulus value $Y$ and the sum $X + Y + Z$. -/
  y : ℚ
  deriving DecidableEq

attribute [cite "17-23-052" cie2020internationalLightingVocabulary] Chromaticity
attribute [cite "17-23-053" cie2020internationalLightingVocabulary] Chromaticity.x
attribute [cite "17-23-053" cie2020internationalLightingVocabulary] Chromaticity.y

/-! ### Functions -/

/-- Gives the chromaticity coordinate $z$ of the chromaticity, $z = 1 - x - y$. -/
def Chromaticity.z (chromaticity : Chromaticity) : ℚ :=
  1 - chromaticity.x - chromaticity.y

attribute [cite "17-23-053" cie2020internationalLightingVocabulary] Chromaticity.z

/-- Gives `none` where $X + Y + Z = 0$ and otherwise the chromaticity of the tristimulus values,
$x = X / (X + Y + Z)$ and $y = Y / (X + Y + Z)$. -/
def Chromaticity.ofTristimulus (tristimulus : Tristimulus) : Option Chromaticity :=
  if tristimulus.X + tristimulus.Y + tristimulus.Z = 0 then
    none
  else
    some ⟨tristimulus.X / (tristimulus.X + tristimulus.Y + tristimulus.Z),
      tristimulus.Y / (tristimulus.X + tristimulus.Y + tristimulus.Z)⟩

attribute [cite "17-23-053" cie2020internationalLightingVocabulary] Chromaticity.ofTristimulus

/-! ### Theorems -/

/-- The chromaticity of a factor $c \neq 0$ of units of a color stimulus is the chromaticity of the
stimulus, as the chromaticity coordinates are quotients of the tristimulus values and their sum,
$c\,X / (c\,X + c\,Y + c\,Z) = X / (X + Y + Z)$ and likewise for $y$. -/
theorem Chromaticity.ofTristimulus_scale (tristimulus : Tristimulus) (factor : ℚ)
    (nonzero : factor ≠ 0) :
    Chromaticity.ofTristimulus (tristimulus.scale factor) =
      Chromaticity.ofTristimulus tristimulus := by
  unfold Chromaticity.ofTristimulus Tristimulus.scale
  simp only
  split <;> split
  · rfl
  · grind
  · grind
  · simp only [Option.some.injEq, Chromaticity.mk.injEq]
    constructor <;> grind

attribute [cite "17-23-053" cie2020internationalLightingVocabulary]
  Chromaticity.ofTristimulus_scale

/-! ### Export -/

attribute [export_typescript
  "A property of a color stimulus that its chromaticity coordinates $x$ and $y$ define."
  (x := "x" "The quotient of the tristimulus value $X$ and the sum $X + Y + Z$.")
  (y := "y" "The quotient of the tristimulus value $Y$ and the sum $X + Y + Z$.")] Chromaticity

attribute [export_typescript
  "Gives the chromaticity coordinate $z$ of the chromaticity, $z = 1 - x - y$."] Chromaticity.z

attribute [export_typescript
  "Gives `none` where $X + Y + Z = 0$ and otherwise the chromaticity of the tristimulus values,
  $x = X / (X + Y + Z)$ and $y = Y / (X + Y + Z)$."] Chromaticity.ofTristimulus

attribute [export_typescript
  "The chromaticity of a factor $c \\neq 0$ of units of a color stimulus is the chromaticity of the
  stimulus, as the chromaticity coordinates are quotients of the tristimulus values and their sum,
  $c\\,X / (c\\,X + c\\,Y + c\\,Z) = X / (X + Y + Z)$ and likewise for $y$."]
  Chromaticity.ofTristimulus_scale

end Falkara.Presentation
