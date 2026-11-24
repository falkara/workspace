/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.References -- shake: keep
public import Mathlib.CategoryTheory.Functor.Const
import Falkara.ExportTypeScript
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Constant Functor

The module defines the curried functor of constant functors as Mathlib
[mathlibCommunity2020leanMathematicalLibrary] states it.

## Main Definitions

- `Functor.const`: the curried functor of constant functors.

## Implementation Notes

The type that the curried functor maps takes the type parameter `Constant` in TypeScript, as Jacobs
[jacobs2017introductionCoalgebra] calls the functor that maps every set to the same set a constant
functor. The curried functor takes a documentation comment of the theory in TypeScript, which
writes it as the type of the functor it gives at a constant, a type whose comment opens with an
article and names the constant as the type parameter does.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- The curried functor of constant functors, which maps every type $X$ to the functor
$Y \mapsto X$. -/
abbrev Functor.const := @CategoryTheory.Functor.const

attribute [cite "CategoryTheory.Functor.const" mathlibCommunity2020leanMathematicalLibrary]
  Functor.const

/-! ### Export -/

attribute [export_typescript
  "A constant functor, which maps every type to the constant."
  (X := "Constant")] Functor.const

end Falkara.Simulation
