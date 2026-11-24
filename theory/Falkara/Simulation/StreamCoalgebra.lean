/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Simulation.BinaryProductFunctor
public import Mathlib.CategoryTheory.Endofunctor.Algebra
import Mathlib.Tactic.TypeStar
import Falkara.ExportTypeScript
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Stream Coalgebra

The module defines the stream coalgebras as Jacobs [jacobs2017introductionCoalgebra] names them,
the coalgebras of the functor of binary products with a type of outputs.

## Main Definitions

- `StreamCoalgebra`: a stream coalgebra.

## Implementation Notes

The product takes the output before the state, as `binaryProductFunctor` of Mathlib and the head
and the tail of a stream in Jacobs take it, whereas the corollary that names the stream coalgebras
takes the state first. The two products are isomorphic.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- A stream coalgebra, which gives from every state an output and the next state. -/
abbrev StreamCoalgebra (Output : Type*) :=
  CategoryTheory.Endofunctor.Coalgebra (binaryProductFunctor.obj Output)

attribute [cite "Corollary 2.3.6.1" jacobs2017introductionCoalgebra] StreamCoalgebra

/-! ### Export -/

attribute [export_typescript] StreamCoalgebra

end Falkara.Simulation
