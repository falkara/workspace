/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Simulation.Functor
public import Falkara.Simulation.Functor.BinaryProductFunctor
public import Mathlib.CategoryTheory.Endofunctor.Algebra
public import Mathlib.Data.Seq.Defs
import Mathlib.Tactic.TypeStar
import Falkara.ExportTypeScript
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Sequence Coalgebra

The module defines the sequence coalgebras as Jacobs [jacobs2017introductionCoalgebra] names them,
the coalgebras of the options of the binary products with a type of outputs, and their behavior,
the map into the sequences of outputs, the final coalgebra of the functor.

## Main Definitions

- `SequenceCoalgebra`: a sequence coalgebra.
- `SequenceCoalgebra.behavior`: the behavior of a sequence coalgebra.

## Main Statements

- `SequenceCoalgebra.behavior_destruct`: the behavior at a state ends where the coalgebra gives
  nothing from the state, and otherwise opens with the output of the state and goes on with the
  behavior at the next state.

## Implementation Notes

The behavior takes its name from the behavior map of Jacobs, as that of a stream coalgebra does,
and its sequence from `Stream'.Seq.corec` of Mathlib, whose step gives either nothing or the output
and the next state, as the coalgebra structure does. TypeScript writes the sequence as a stream of
Effect, which ends where the sequence does.
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

/-- The behavior of a sequence coalgebra, which gives from every state the sequence of the outputs
that the coalgebra gives from the state on until it gives nothing. -/
def SequenceCoalgebra.behavior {Output : Type*} (coalgebra : SequenceCoalgebra Output)
    (state : coalgebra.V) : Stream'.Seq Output :=
  Stream'.Seq.corec coalgebra.str state

attribute [cite "Definition 2.3.1" jacobs2017introductionCoalgebra] SequenceCoalgebra.behavior

/-! ### Theorems -/

/-- The behavior of a sequence coalgebra at a state ends where the coalgebra gives nothing from the
state, and otherwise opens with the output that the coalgebra gives and goes on with the behavior at
the next state. -/
theorem SequenceCoalgebra.behavior_destruct {Output : Type*}
    (coalgebra : SequenceCoalgebra Output) (state : coalgebra.V) :
    (coalgebra.behavior state).destruct =
      Stream'.Seq.omap coalgebra.behavior (coalgebra.str state) :=
  Stream'.Seq.corec_eq _ _

/-! ### Export -/

attribute [export_typescript] SequenceCoalgebra SequenceCoalgebra.behavior

end Falkara.Simulation
