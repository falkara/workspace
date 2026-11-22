/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.References -- shake: keep
public import Mathlib.CategoryTheory.Endofunctor.Algebra
meta import Falkara.Citation -- shake: keep
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Coalgebra

The module defines the coalgebras of an endofunctor as Mathlib
[mathlibCommunity2020leanMathematicalLibrary] states them.

## Main Definitions

- `Coalgebra`: a coalgebra of an endofunctor.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- A coalgebra of an endofunctor, a carrier with a structure morphism into the object to which the
endofunctor maps the carrier. -/
abbrev Coalgebra := @CategoryTheory.Endofunctor.Coalgebra

attribute [cite "CategoryTheory.Endofunctor.Coalgebra" mathlibCommunity2020leanMathematicalLibrary]
  Coalgebra

/-! ### Export -/

attribute [export_typescript] Coalgebra

end Falkara.Simulation
