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

import Falkara.ExportTypeScript
import Falkara.References
import Mathlib.Data.Seq.Basic

/-!
# Sequence Coalgebra

The module defines the sequence coalgebras as Jacobs [jacobs2017introductionCoalgebra] names them,
the coalgebras of the options of the binary products with a type of outputs, their behavior, the
map into the sequences of outputs, the final coalgebra of the functor, their steps, which keep the
next state beside every output, and the coalgebra that maps every output.

## Main Definitions

- `SequenceCoalgebra`: a sequence coalgebra.
- `SequenceCoalgebra.behavior`: the behavior of a sequence coalgebra.
- `SequenceCoalgebra.steps`: the steps of a sequence coalgebra.
- `SequenceCoalgebra.mapOutput`: the coalgebra that maps every output of a coalgebra.

## Main Statements

- `SequenceCoalgebra.behavior_destruct`: the behavior at a state ends where the coalgebra gives
  nothing from the state, and otherwise opens with the output of the state and goes on with the
  behavior at the next state.
- `SequenceCoalgebra.behavior_eq_map_steps`: the behavior at a state is the sequence of the outputs
  of the steps.
- `SequenceCoalgebra.behavior_mapOutput`: the behavior of a mapped coalgebra maps the outputs of
  the behavior.

## Implementation Notes

The behavior takes its name from the behavior map of Jacobs, as that of a stream coalgebra does,
and its sequence from `Stream'.Seq.corec` of Mathlib, whose step gives either nothing or the output
and the next state, as the coalgebra structure does. TypeScript writes the sequence as a stream of
Effect, which ends where the sequence does.

The coalgebra gives its step in a lawful monad, the identity monad `Id` unless a monad is given, as
`StreamCoalgebra` does, so that a step may take an effect, such as one of `EffectFunctor`, and the
coalgebras in the identity monad are those of the section.
-/

@[expose] public section

namespace Falkara.Simulation

universe u

/-! ### Type -/

/-- A sequence coalgebra, which gives from every state either nothing or an output and the next
state in a monad. -/
@[export_typescript /-- A sequence coalgebra, which gives from every state either nothing or an
    output and the next state in a monad. -/
  (m := "Monad")]
abbrev SequenceCoalgebra (Output : Type u) (m : Type u → Type u := Id) [Monad m]
    [LawfulMonad m] :=
  CategoryTheory.Endofunctor.Coalgebra
    (Functor.comp (Functor.comp (binaryProductFunctor.obj Output)
      (CategoryTheory.ofTypeFunctor Option)) (CategoryTheory.ofTypeFunctor m))

attribute [cite "Section 2.2.1" jacobs2017introductionCoalgebra] SequenceCoalgebra

/-! ### Functions -/

/-- The behavior of a sequence coalgebra, which gives from every state the sequence of the outputs
that the coalgebra gives from the state on until it gives nothing. -/
@[export_typescript /-- The behavior of a sequence coalgebra, which gives from every state the
    sequence of the outputs that the coalgebra gives from the state on until it gives nothing. -/]
def SequenceCoalgebra.behavior {Output : Type u} (coalgebra : SequenceCoalgebra Output)
    (state : coalgebra.V) : Stream'.Seq Output :=
  Stream'.Seq.corec coalgebra.str state

attribute [cite "Definition 2.3.1" jacobs2017introductionCoalgebra] SequenceCoalgebra.behavior

/-- The steps of a sequence coalgebra, which gives from every state the sequence of the steps that
the coalgebra takes from the state on until it gives nothing, each an output with the next state,
the behavior of the coalgebra whose output is the whole step. -/
@[export_typescript /-- The steps of a sequence coalgebra, which gives from every state the
    sequence of the steps that the coalgebra takes from the state on until it gives nothing, each
    an output with the next state, the behavior of the coalgebra whose output is the whole step. -/]
def SequenceCoalgebra.steps {Output : Type u} (coalgebra : SequenceCoalgebra Output)
    (state : coalgebra.V) : Stream'.Seq ((binaryProductFunctor.obj Output).obj coalgebra.V) :=
  Stream'.Seq.corec (fun current ↦
    let step : Option (Output × coalgebra.V) := coalgebra.str current
    step.map fun step ↦ (step, step.2)) state

attribute [cite "Definition 2.3.1" jacobs2017introductionCoalgebra] SequenceCoalgebra.steps

/-- The coalgebra that maps every output of a sequence coalgebra by a function, upon the state space
of the coalgebra. -/
@[export_typescript /-- The coalgebra that maps every output of a sequence coalgebra by a function,
    upon the state space of the coalgebra. -/]
def SequenceCoalgebra.mapOutput {Output MappedOutput : Type u}
    (coalgebra : SequenceCoalgebra Output) (f : (output : Output) → MappedOutput) :
    SequenceCoalgebra MappedOutput where
  V := coalgebra.V
  str := TypeCat.ofHom fun state ↦
    let step : Option (Output × coalgebra.V) := coalgebra.str state
    step.map fun step ↦ (f step.1, step.2)

/-! ### Theorems -/

/-- The sequence that a step gives, with every output mapped by a function, is the sequence that the
step gives with the function applied to every output it gives. -/
private theorem map_corec {Output MappedOutput State : Type u}
    (step : State → Option (Output × State)) (f : Output → MappedOutput) (state : State) :
    Stream'.Seq.map f (Stream'.Seq.corec step state) =
      Stream'.Seq.corec (fun current ↦ (step current).map fun some ↦ (f some.1, some.2)) state := by
  refine Stream'.Seq.eq_of_bisim (fun first second ↦ ∃ current,
    first = Stream'.Seq.map f (Stream'.Seq.corec step current) ∧
      second = Stream'.Seq.corec (fun current ↦ (step current).map fun some ↦ (f some.1, some.2))
        current) ?_ ⟨state, rfl, rfl⟩
  rintro _ _ ⟨current, rfl, rfl⟩
  have original := Stream'.Seq.corec_eq step current
  have mapped := Stream'.Seq.corec_eq
    (fun current ↦ (step current).map fun some ↦ (f some.1, some.2)) current
  rcases h : step current with _ | ⟨output, next⟩
  · simp only [h, Option.map_none, Stream'.Seq.omap] at original mapped
    rw [Stream'.Seq.destruct_eq_none original, Stream'.Seq.destruct_eq_none mapped,
      Stream'.Seq.map_nil]
    exact trivial
  · simp only [h, Option.map_some, Stream'.Seq.omap] at original mapped
    rw [Stream'.Seq.destruct_eq_cons original, Stream'.Seq.destruct_eq_cons mapped,
      Stream'.Seq.map_cons]
    simp only [Stream'.Seq.destruct_cons, Stream'.Seq.BisimO]
    exact ⟨trivial, next, rfl, rfl⟩

namespace SequenceCoalgebra

/-- The behavior of a sequence coalgebra at a state ends where the coalgebra gives nothing from the
state, and otherwise opens with the output that the coalgebra gives and goes on with the behavior at
the next state. -/
theorem behavior_destruct {Output : Type u}
    (coalgebra : SequenceCoalgebra Output) (state : coalgebra.V) :
    (coalgebra.behavior state).destruct =
      Stream'.Seq.omap coalgebra.behavior (coalgebra.str state) :=
  Stream'.Seq.corec_eq _ _

/-- The behavior of a sequence coalgebra at a state is the sequence of the outputs of its steps. -/
theorem behavior_eq_map_steps {Output : Type u}
    (coalgebra : SequenceCoalgebra Output) (state : coalgebra.V) :
    coalgebra.behavior state = (coalgebra.steps state).map Prod.fst := by
  refine Stream'.Seq.eq_of_bisim
    (fun first second ↦ ∃ current, first = coalgebra.behavior current ∧
      second = (coalgebra.steps current).map Prod.fst) ?_ ⟨state, rfl, rfl⟩
  rintro _ _ ⟨current, rfl, rfl⟩
  have behavior := Stream'.Seq.corec_eq coalgebra.str current
  have steps := Stream'.Seq.corec_eq
    (fun current ↦ (coalgebra.str current : Option (Output × coalgebra.V)).map
      fun step ↦ (step, step.2)) current
  rcases h : (coalgebra.str current : Option (Output × coalgebra.V)) with _ | ⟨output, next⟩
  · simp only [h, Option.map_none, Stream'.Seq.omap] at behavior steps
    rw [SequenceCoalgebra.behavior, SequenceCoalgebra.steps, Stream'.Seq.destruct_eq_none behavior,
      Stream'.Seq.destruct_eq_none steps]
    -- The steps take their elements as objects of the functor, which `map_nil` reaches only by
    -- unfolding them into products.
    erw [Stream'.Seq.map_nil]
    exact trivial
  · simp only [h, Stream'.Seq.omap] at behavior steps
    simp only [SequenceCoalgebra.behavior, SequenceCoalgebra.steps,
      Stream'.Seq.destruct_eq_cons behavior, Stream'.Seq.destruct_eq_cons steps,
      Stream'.Seq.destruct_cons, Stream'.Seq.BisimO]
    exact ⟨rfl, next, rfl, rfl⟩

/-- The behavior of the coalgebra that maps every output of a sequence coalgebra maps every output
of the behavior of the coalgebra. -/
theorem behavior_mapOutput {Output MappedOutput : Type u}
    (coalgebra : SequenceCoalgebra Output) (f : (output : Output) → MappedOutput)
    (state : coalgebra.V) :
    (coalgebra.mapOutput f).behavior state = (coalgebra.behavior state).map f :=
  (map_corec (fun current ↦ (coalgebra.str current : Option (Output × coalgebra.V))) f state).symm

end SequenceCoalgebra

end Falkara.Simulation
