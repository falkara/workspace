/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Simulation.Coalgebra.MealyMachine

import Falkara.ExportTypeScript
import Falkara.References
import Mathlib.Data.Stream.Init

/-!
# Stream Coalgebra

The module defines the stream coalgebras as Jacobs [jacobs2017introductionCoalgebra] names them,
the coalgebras of the functor of binary products with a type of outputs, their behavior, the map
into the streams of outputs, the final coalgebra of the functor, their steps, which keep the next
state beside every output, the coalgebra that maps every output, and the Mealy machine that a
coalgebra runs as, which takes inputs that carry nothing.

## Main Definitions

- `StreamCoalgebra`: a stream coalgebra.
- `StreamCoalgebra.behavior`: the behavior of a stream coalgebra.
- `StreamCoalgebra.steps`: the steps of a stream coalgebra.
- `StreamCoalgebra.mapOutput`: the coalgebra that maps every output of a coalgebra.
- `StreamCoalgebra.toMealyMachine`: the Mealy machine that a coalgebra runs as.

## Main Statements

- `StreamCoalgebra.behavior_eq`: the behavior at a state opens with the output of the state and
  goes on with the behavior at the next state.
- `StreamCoalgebra.behavior_eq_map_steps`: the behavior at a state is the stream of the outputs of
  the steps.
- `StreamCoalgebra.behavior_mapOutput`: the behavior of a mapped coalgebra maps the outputs of the
  behavior.
- `StreamCoalgebra.behavior_toMealyMachine`: the Mealy machine of a coalgebra behaves as the
  coalgebra upon any inputs.

## Implementation Notes

The product takes the output before the state, as `binaryProductFunctor` of Mathlib and the head
and the tail of a stream in Jacobs take it, whereas the corollary that names the stream coalgebras
takes the state first. The two products are isomorphic.

The coalgebra gives its step in a lawful monad, the identity monad `Id` unless a monad is given, as
a coalgebra of the functor composed with the functor of the monad, so that a step may take an
effect, such as one of `EffectFunctor`. The coalgebras in the identity monad are those of the
corollary, and TypeScript writes their steps as values alone.

The behavior takes its name from the behavior map of Jacobs, which some works call an unfold, and
its stream from `Stream'.corec'` of Mathlib, whose step gives the output and the next state
together, as the coalgebra structure does. TypeScript writes the stream as a stream of Effect.

The Mealy machine of a coalgebra takes inputs of the type with one value, which TypeScript writes as
`void`, so that a coalgebra composes with a machine as the module `MealyMachine` composes machines.
-/

@[expose] public section

namespace Falkara.Simulation

universe u

/-- A stream coalgebra, which gives from every state an output and the next state in a monad. -/
@[export_typescript /-- A stream coalgebra, which gives from every state an output and the next
    state in a monad. -/
  (m := "Monad")]
abbrev StreamCoalgebra (Output : Type u) (m : Type u → Type u := Id) [Monad m] [LawfulMonad m] :=
  CategoryTheory.Endofunctor.Coalgebra
    (Functor.comp (binaryProductFunctor.obj Output) (CategoryTheory.ofTypeFunctor m))

attribute [cite "Corollary 2.3.6.1" jacobs2017introductionCoalgebra] StreamCoalgebra

/-- The behavior of a stream coalgebra, which gives from every state the stream of the outputs that
the coalgebra gives from the state on. -/
@[export_typescript /-- The behavior of a stream coalgebra, which gives from every state the stream
    of the outputs that the coalgebra gives from the state on. -/]
def StreamCoalgebra.behavior {Output : Type u} (coalgebra : StreamCoalgebra Output)
    (state : coalgebra.V) : Stream' Output :=
  Stream'.corec' coalgebra.str state

attribute [cite "Definition 2.3.1" jacobs2017introductionCoalgebra] StreamCoalgebra.behavior

/-- The steps of a stream coalgebra, which gives from every state the stream of the steps that the
coalgebra takes from the state on, each an output with the next state, the behavior of the
coalgebra whose output is the whole step. -/
@[export_typescript /-- The steps of a stream coalgebra, which gives from every state the stream of
    the steps that the coalgebra takes from the state on, each an output with the next state, the
    behavior of the coalgebra whose output is the whole step. -/]
def StreamCoalgebra.steps {Output : Type u} (coalgebra : StreamCoalgebra Output)
    (state : coalgebra.V) : Stream' ((binaryProductFunctor.obj Output).obj coalgebra.V) :=
  Stream'.corec' (fun current ↦
    let step : Output × coalgebra.V := coalgebra.str current
    (step, step.2)) state

attribute [cite "Definition 2.3.1" jacobs2017introductionCoalgebra] StreamCoalgebra.steps

/-- The coalgebra that maps every output of a stream coalgebra by a function, upon the state space
of the coalgebra. -/
@[export_typescript /-- The coalgebra that maps every output of a stream coalgebra by a function,
    upon the state space of the coalgebra. -/]
def StreamCoalgebra.mapOutput {Output MappedOutput : Type u} (coalgebra : StreamCoalgebra Output)
    (f : (output : Output) → MappedOutput) : StreamCoalgebra MappedOutput where
  V := coalgebra.V
  str := TypeCat.ofHom fun state ↦
    let step : Output × coalgebra.V := coalgebra.str state
    (f step.1, step.2)

/-- The Mealy machine that a stream coalgebra runs as, which takes inputs that carry nothing and
gives upon every one of them the step of the coalgebra, upon the state space of the coalgebra. -/
@[export_typescript /-- The Mealy machine that a stream coalgebra runs as, which takes inputs that
    carry nothing and gives upon every one of them the step of the coalgebra, upon the state space
    of the coalgebra. -/]
def StreamCoalgebra.toMealyMachine {Output : Type u} (coalgebra : StreamCoalgebra Output) :
    MealyMachine PUnit Output where
  V := coalgebra.V
  str := TypeCat.ofHom fun state ↦
    (TypeCat.ofHom fun _ ↦ (coalgebra.str state : Output × coalgebra.V) :
      PUnit ⟶ Output × coalgebra.V)

namespace StreamCoalgebra

/-- The behavior of a stream coalgebra at a state opens with the output that the coalgebra gives
from the state and goes on with the behavior at the next state. -/
theorem behavior_eq {Output : Type u} (coalgebra : StreamCoalgebra Output)
    (state : coalgebra.V) :
    coalgebra.behavior state =
      Stream'.cons (coalgebra.str state).1 (coalgebra.behavior (coalgebra.str state).2) :=
  Stream'.corec'_eq _ _

/-- The behavior of a stream coalgebra at a state is the stream of the outputs of its steps. -/
theorem behavior_eq_map_steps {Output : Type u}
    (coalgebra : StreamCoalgebra Output) (state : coalgebra.V) :
    coalgebra.behavior state = (coalgebra.steps state).map Prod.fst := by
  simp only [StreamCoalgebra.behavior, StreamCoalgebra.steps, Stream'.corec', Stream'.corec_def]
  rfl

/-- The behavior of the coalgebra that maps every output of a stream coalgebra maps every output of
the behavior of the coalgebra. -/
theorem behavior_mapOutput {Output MappedOutput : Type u}
    (coalgebra : StreamCoalgebra Output) (f : (output : Output) → MappedOutput)
    (state : coalgebra.V) :
    (coalgebra.mapOutput f).behavior state = (coalgebra.behavior state).map f := by
  refine Stream'.eq_of_bisim (fun first second ↦ ∃ current,
    first = (coalgebra.mapOutput f).behavior current ∧
      second = (coalgebra.behavior current).map f) ?_ ⟨state, rfl, rfl⟩
  rintro _ _ ⟨current, rfl, rfl⟩
  refine ⟨rfl, _, congrArg Stream'.tail (StreamCoalgebra.behavior_eq _ _), ?_⟩
  -- The state of the mapped coalgebra is one of the coalgebra, which a rewrite finds by unfolding.
  erw [StreamCoalgebra.behavior_eq coalgebra current, Stream'.map_cons]
  rfl

/-- The Mealy machine of a stream coalgebra behaves upon any inputs as the coalgebra. -/
theorem behavior_toMealyMachine {Output : Type u}
    (coalgebra : StreamCoalgebra Output) (state : coalgebra.V) (inputs : Stream' PUnit) :
    coalgebra.toMealyMachine.behavior state inputs = coalgebra.behavior state := by
  refine Stream'.eq_of_bisim (fun first second ↦ ∃ current rest,
    first = coalgebra.toMealyMachine.behavior current rest ∧
      second = coalgebra.behavior current) ?_ ⟨state, inputs, rfl, rfl⟩
  rintro _ _ ⟨current, rest, rfl, rfl⟩
  refine ⟨rfl, _, rest.tail, congrArg Stream'.tail (MealyMachine.behavior_eq _ _ _), ?_⟩
  -- The state of the machine is one of the coalgebra, which a rewrite finds by unfolding.
  erw [StreamCoalgebra.behavior_eq coalgebra current]
  rfl

end StreamCoalgebra

end Falkara.Simulation
