/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.References -- shake: keep
public import Mathlib.CategoryTheory.Endofunctor.Algebra
import Falkara.ExportTypeScript
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Coalgebra

The module defines the coalgebras of an endofunctor as Mathlib
[mathlibCommunity2020leanMathematicalLibrary] states them.

## Main Definitions

- `Coalgebra`: a coalgebra of an endofunctor.

## Implementation Notes

The functor takes the type parameter `Endofunctor` in TypeScript, the carrier the type parameter
`State`, and the structure morphism the field `structure`, as Jacobs
[jacobs2017introductionCoalgebra] defines a coalgebra of an endofunctor, calls its carrier the state
space, and calls its structure morphism the coalgebra structure, which in an automaton holds a
transition function beside an observation function, so that `transition` would name a part alone.
The coalgebra and its coalgebra structure take documentation comments in TypeScript in the terms
of Jacobs, which cite the definition of Jacobs beside Mathlib, as the names in TypeScript take the
terms of Jacobs whereas the comments of the theory take those of Mathlib, which it cites.
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

attribute [export_typescript
  "A coalgebra, a state space together with a coalgebra structure on it."
    cite "Definition 1.4.5" jacobs2017introductionCoalgebra
  (F := "Endofunctor")
  (V := "State")
  (str := "structure"
    "The coalgebra structure on the state space."
      cite "Definition 1.4.5" jacobs2017introductionCoalgebra)] Coalgebra

end Falkara.Simulation
