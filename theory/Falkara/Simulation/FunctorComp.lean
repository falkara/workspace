/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.References -- shake: keep
public import Mathlib.CategoryTheory.Functor.Basic
meta import Falkara.Citation -- shake: keep
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Composite Functor

The module defines the composition of functors as Mathlib
[mathlibCommunity2020leanMathematicalLibrary] states it.

## Main Definitions

- `Functor.comp`: the composite of two functors.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- The composite of two functors, which applies the functor $F$ and then the functor $G$. -/
abbrev Functor.comp := @CategoryTheory.Functor.comp

attribute [cite "CategoryTheory.Functor.comp" mathlibCommunity2020leanMathematicalLibrary]
  Functor.comp

/-! ### Export -/

attribute [export_typescript] Functor.comp

end Falkara.Simulation
