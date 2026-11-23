/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.References -- shake: keep
public import Mathlib.CategoryTheory.Functor.Const
meta import Falkara.Citation -- shake: keep
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Constant Functor

The module defines the curried functor of constant functors as Mathlib
[mathlibCommunity2020leanMathematicalLibrary] states it.

## Main Definitions

- `Functor.const`: the curried functor of constant functors.
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

attribute [export_typescript] Functor.const

end Falkara.Simulation
