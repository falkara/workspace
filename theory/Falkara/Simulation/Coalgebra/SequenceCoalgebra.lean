/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Simulation.Functor
public import Falkara.Simulation.Functor.BinaryProductFunctor
public import Mathlib.CategoryTheory.Endofunctor.Algebra
import Mathlib.Tactic.TypeStar
import Falkara.ExportTypeScript
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Sequence Coalgebra

The module defines the sequence coalgebras as Jacobs [jacobs2017introductionCoalgebra] names them,
the coalgebras of the options of the binary products with a type of outputs.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- A sequence coalgebra, which gives from every state either nothing or an output and the next
state. -/
abbrev SequenceCoalgebra (Output : Type*) :=
  CategoryTheory.Endofunctor.Coalgebra
    (Functor.comp (binaryProductFunctor.obj Output) (CategoryTheory.ofTypeFunctor Option))

attribute [cite "Section 2.2.1" jacobs2017introductionCoalgebra] SequenceCoalgebra

/-! ### Export -/

attribute [export_typescript] SequenceCoalgebra

end Falkara.Simulation
