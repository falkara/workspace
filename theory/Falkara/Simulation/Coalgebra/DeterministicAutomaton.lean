/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Simulation.Functor
public import Falkara.Simulation.Functor.BinaryProductFunctor
public import Falkara.Simulation.Functor.Coyoneda
public import Mathlib.CategoryTheory.Endofunctor.Algebra
public import Mathlib.Data.Stream.Defs
import Mathlib.Data.Stream.Init
import Falkara.ExportTypeScript
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Deterministic Automaton

The module defines the deterministic automata as Jacobs [jacobs2017introductionCoalgebra] names
them, the coalgebras of the binary products of a type of outputs with the functions from a type of
inputs, and their behavior, which maps a stream of inputs to the stream of the outputs of the states
that the inputs lead through.

## Main Definitions

- `DeterministicAutomaton`: a deterministic automaton.
- `DeterministicAutomaton.behavior`: the behavior of a deterministic automaton.

## Main Statements

- `DeterministicAutomaton.behavior_eq`: the behavior at a state upon a stream of inputs opens with
  the output of the state and goes on with the behavior at the state that the first input leads to
  upon the rest.

## Implementation Notes

The product takes the output before the transition, as `StreamCoalgebra` does, whereas the section
that names the deterministic automata takes the transition first. The two products are isomorphic.

The behavior takes its name from the behavior map of Jacobs, as that of a stream coalgebra does.
It gives the output of every state that the inputs lead through, the output of the state itself
first, as the automaton gives an output from a state before any input, whereas the behavior map
of the section gives the output after a finite sequence of inputs alone. TypeScript writes both
streams as streams of Effect, and the module of the package takes a stream of inputs that may fail
or need services and passes both on to the outputs, as the contract admits a function more general
than the theory states.
-/

@[expose] public section

namespace Falkara.Simulation

universe u

/-! ### Definitions -/

/-- A deterministic automaton, which gives from every state an output and the next state upon every
input. -/
abbrev DeterministicAutomaton (Input Output : Type u) :=
  CategoryTheory.Endofunctor.Coalgebra
    (Functor.comp (coyoneda.obj (Opposite.op Input)) (binaryProductFunctor.obj Output))

attribute [cite "Section 2.2.3" jacobs2017introductionCoalgebra] DeterministicAutomaton

/-- The behavior of a deterministic automaton, which gives from every state upon a stream of inputs
the stream of the outputs of the state and of every state that the inputs lead to one after
another. -/
def DeterministicAutomaton.behavior {Input Output : Type u}
    (automaton : DeterministicAutomaton Input Output) (state : automaton.V)
    (inputs : Stream' Input) : Stream' Output :=
  Stream'.corec'
    (fun (current, rest) ↦
      let step : Output × (Input ⟶ automaton.V) := automaton.str current
      (step.1, step.2 rest.head, rest.tail))
    (state, inputs)

attribute [cite "Definition 2.3.1" jacobs2017introductionCoalgebra]
  DeterministicAutomaton.behavior

/-! ### Theorems -/

/-- The behavior of a deterministic automaton at a state upon a stream of inputs opens with the
output of the state and goes on with the behavior at the state that the first input leads to upon
the rest of the inputs. -/
theorem DeterministicAutomaton.behavior_eq {Input Output : Type u}
    (automaton : DeterministicAutomaton Input Output) (state : automaton.V)
    (inputs : Stream' Input) :
    let step : Output × (Input ⟶ automaton.V) := automaton.str state
    automaton.behavior state inputs =
      Stream'.cons step.1 (automaton.behavior (step.2 inputs.head) inputs.tail) :=
  Stream'.corec'_eq _ _

/-! ### Export -/

attribute [export_typescript] DeterministicAutomaton DeterministicAutomaton.behavior

end Falkara.Simulation
