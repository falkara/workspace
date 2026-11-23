/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Simulation.BinaryProductFunctor
public import Falkara.Simulation.Coyoneda
public import Falkara.Simulation.FunctorComp
public import Mathlib.CategoryTheory.Endofunctor.Algebra
meta import Falkara.Citation -- shake: keep
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Deterministic Automaton

The module defines the deterministic automata as Jacobs [jacobs2017introductionCoalgebra] names
them, the coalgebras of the binary products of a type of outputs with the functions from a type of
inputs.

## Main Definitions

- `DeterministicAutomaton`: a deterministic automaton.

## Implementation Notes

The product takes the output before the transition, as `StreamCoalgebra` does, whereas the section
that names the deterministic automata takes the transition first. The two products are isomorphic.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- A deterministic automaton, which gives from every state an output and the next state upon every
input. -/
abbrev DeterministicAutomaton.{u} (A B : Type u) :=
  CategoryTheory.Endofunctor.Coalgebra
    (Functor.comp (coyoneda.obj (Opposite.op A)) (binaryProductFunctor.obj B))

attribute [cite "Section 2.2.3" jacobs2017introductionCoalgebra] DeterministicAutomaton

/-! ### Export -/

attribute [export_typescript] DeterministicAutomaton

end Falkara.Simulation
