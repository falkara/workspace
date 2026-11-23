/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.References -- shake: keep
public import Mathlib.CategoryTheory.Limits.Types.Products
meta import Falkara.Citation -- shake: keep
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Binary Product Functor

The module defines the curried functor of binary products as Mathlib
[mathlibCommunity2020leanMathematicalLibrary] states it.

## Main Definitions

- `binaryProductFunctor`: the curried functor of binary products.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- The curried functor of binary products, which maps every type $X$ to the functor
$Y \mapsto X \times Y$. -/
abbrev binaryProductFunctor := @CategoryTheory.Limits.Types.binaryProductFunctor

attribute [cite "CategoryTheory.Limits.Types.binaryProductFunctor"
  mathlibCommunity2020leanMathematicalLibrary] binaryProductFunctor

/-! ### Export -/

attribute [export_typescript] binaryProductFunctor

end Falkara.Simulation
