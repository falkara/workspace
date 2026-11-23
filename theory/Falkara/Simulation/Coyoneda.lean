/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.References -- shake: keep
public import Mathlib.CategoryTheory.Yoneda
meta import Falkara.Citation -- shake: keep
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Coyoneda

The module defines the coyoneda embedding as Mathlib [mathlibCommunity2020leanMathematicalLibrary]
states it.

## Main Definitions

- `coyoneda`: the coyoneda embedding.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- The coyoneda embedding, which maps every type $k$ to the functor $Y \mapsto (k \to Y)$. -/
abbrev coyoneda := @CategoryTheory.coyoneda

attribute [cite "CategoryTheory.coyoneda" mathlibCommunity2020leanMathematicalLibrary] coyoneda

/-! ### Export -/

attribute [export_typescript] coyoneda

end Falkara.Simulation
