/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Simulation.Functor.BinaryProductFunctor
public import Mathlib.CategoryTheory.Endofunctor.Algebra
public import Mathlib.Data.Stream.Defs
import Mathlib.Data.Stream.Init
import Mathlib.Tactic.TypeStar
import Falkara.ExportTypeScript
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Stream Coalgebra

The module defines the stream coalgebras as Jacobs [jacobs2017introductionCoalgebra] names them,
the coalgebras of the functor of binary products with a type of outputs, and their behavior, the
map into the streams of outputs, the final coalgebra of the functor.

## Main Definitions

- `StreamCoalgebra`: a stream coalgebra.
- `StreamCoalgebra.behavior`: the behavior of a stream coalgebra.

## Main Statements

- `StreamCoalgebra.behavior_eq`: the behavior at a state opens with the output of the state and
  goes on with the behavior at the next state.

## Implementation Notes

The product takes the output before the state, as `binaryProductFunctor` of Mathlib and the head
and the tail of a stream in Jacobs take it, whereas the corollary that names the stream coalgebras
takes the state first. The two products are isomorphic.

The behavior takes its name from the behavior map of Jacobs, which some works call an unfold, and
its stream from `Stream'.corec'` of Mathlib, whose step gives the output and the next state
together, as the coalgebra structure does. TypeScript writes the stream as a stream of Effect.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- A stream coalgebra, which gives from every state an output and the next state. -/
abbrev StreamCoalgebra (Output : Type*) :=
  CategoryTheory.Endofunctor.Coalgebra (binaryProductFunctor.obj Output)

attribute [cite "Corollary 2.3.6.1" jacobs2017introductionCoalgebra] StreamCoalgebra

/-- The behavior of a stream coalgebra, which gives from every state the stream of the outputs that
the coalgebra gives from the state on. -/
def StreamCoalgebra.behavior {Output : Type*} (coalgebra : StreamCoalgebra Output)
    (state : coalgebra.V) : Stream' Output :=
  Stream'.corec' coalgebra.str state

attribute [cite "Definition 2.3.1" jacobs2017introductionCoalgebra] StreamCoalgebra.behavior

/-! ### Theorems -/

/-- The behavior of a stream coalgebra at a state opens with the output that the coalgebra gives
from the state and goes on with the behavior at the next state. -/
theorem StreamCoalgebra.behavior_eq {Output : Type*} (coalgebra : StreamCoalgebra Output)
    (state : coalgebra.V) :
    coalgebra.behavior state =
      Stream'.cons (coalgebra.str state).1 (coalgebra.behavior (coalgebra.str state).2) :=
  Stream'.corec'_eq _ _

/-! ### Export -/

attribute [export_typescript] StreamCoalgebra StreamCoalgebra.behavior

end Falkara.Simulation
