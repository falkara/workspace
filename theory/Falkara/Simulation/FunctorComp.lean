/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.References -- shake: keep
public import Mathlib.CategoryTheory.Functor.Basic
import Falkara.ExportTypeScript
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Composite Functor

The module defines the composition of functors as Mathlib
[mathlibCommunity2020leanMathematicalLibrary] states it.

## Main Definitions

- `Functor.comp`: the composite of two functors.

## Implementation Notes

The two functors take the type parameters `FirstEndofunctor` and `SecondEndofunctor` in
TypeScript, as a functor on types is an endofunctor, as a coalgebra names it, and Mathlib states
that the composite applies the functor `F` first and then the functor `G`. The composite takes a
documentation comment of the theory in TypeScript, which writes it as a type, whose comment opens
with an article and names the endofunctors as the type parameters do.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- The composite of two functors, which applies the functor $F$ and then the functor $G$. -/
abbrev Functor.comp := @CategoryTheory.Functor.comp

attribute [cite "CategoryTheory.Functor.comp" mathlibCommunity2020leanMathematicalLibrary]
  Functor.comp

/-! ### Export -/

attribute [export_typescript
  "A composite of two endofunctors, which applies the first endofunctor and then the second \
    endofunctor."
  (F := "FirstEndofunctor")
  (G := "SecondEndofunctor")] Functor.comp

end Falkara.Simulation
