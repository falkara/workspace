/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Mathlib.CategoryTheory.Endofunctor.Algebra

import Falkara.ExportTypeScript
import Falkara.References

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
@[export_typescript /-- A coalgebra, a state space together with a coalgebra structure on it. -/
    cite "Definition 1.4.5" jacobs2017introductionCoalgebra
  (F := "Endofunctor")
  (V := "State")
  (str := "structure" /-- The coalgebra structure on the state space. -/
    cite "Definition 1.4.5" jacobs2017introductionCoalgebra)]
abbrev Coalgebra := @CategoryTheory.Endofunctor.Coalgebra

attribute [cite "CategoryTheory.Endofunctor.Coalgebra" mathlibCommunity2020leanMathematicalLibrary]
  Coalgebra

end Falkara.Simulation
