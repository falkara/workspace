/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Simulation.Coalgebra.MealyMachine

import Falkara.Counterpart
import Falkara.References
import Mathlib.Data.Stream.Init

/-!
# Deterministic Automaton

The module defines the deterministic automata, the coalgebras of the binary products of a type of
outputs with the functions from a type of inputs, their behavior, which maps a stream of inputs to
the stream of the outputs of the states that the inputs lead through, the automata that an automaton
maps into, and the Mealy machine that an automaton runs as.

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

The theory states the behavior on infinite streams alone, whereas a stream of Effect may end. On a
stream of inputs that ends, the module of the package gives the output of every state that the
inputs lead through and then the output of the state that the last input leads to, one output more
than the inputs, as the automaton gives an output from every state it reaches.

The automaton gives the next state upon an input in a lawful monad, the identity monad `Id` unless
a monad is given, and its output without one, so that a transition may take an effect, such as one
of `EffectFunctor`, whereas the output of a state stays a value that observing the state never runs
twice. The automata in the identity monad are those of the section.

The Mealy machine of an automaton gives upon every input the output of its state, so that it gives
on infinite streams the behavior of the automaton, and its steps and its compositions are those of
the module `MealyMachine`. On a stream of inputs that ends, it leaves out the output of the state
that the last input leads to, which no input asks for.
-/

@[expose] public section

namespace Falkara.Simulation

universe u

/-- A deterministic automaton, which gives from every state an output and the next state upon every
input in a monad. -/
@[counterpart Jacobs.introductionToCoalgebra "Section 2.2.3"
  typescript
    r"A deterministic automaton, which gives from every state an output and the next state upon
    every input in a monad."
    (m → "Monad")
    constructor
      r"Creates a deterministic automaton from the function that gives from every state an output
      and the next state upon every input."]
abbrev DeterministicAutomaton (Input Output : Type u) (m : Type u → Type u := Id) [Monad m]
    [LawfulMonad m] :=
  CategoryTheory.Endofunctor.Coalgebra
    (Functor.comp (Functor.comp (CategoryTheory.ofTypeFunctor m)
      (exponentFunctor.obj (Opposite.op Input))) (binaryProductFunctor.obj Output))

/-- The behavior of a deterministic automaton, which gives from every state upon a stream of inputs
the stream of the outputs of the state and of every state that the inputs lead to one after
another. -/
@[counterpart Jacobs.introductionToCoalgebra "Definition 2.3.1"
  typescript
    r"The behavior of a deterministic automaton, which gives from every state upon a stream of
    inputs the stream of the outputs of the state and of every state that the inputs lead to one
    after another."]
def DeterministicAutomaton.behavior {Input Output : Type u}
    (automaton : DeterministicAutomaton Input Output) (state : automaton.V)
    (inputs : Stream' Input) : Stream' Output :=
  Stream'.corec'
    (fun (current, rest) ↦
      let step : Output × (Input ⟶ automaton.V) := automaton.str current
      (step.1, step.2 rest.head, rest.tail))
    (state, inputs)

/-- The automaton that maps every output of a deterministic automaton by a function, upon the state
space of the automaton. -/
@[counterpart
  typescript
    r"The automaton that maps every output of a deterministic automaton by a function, upon the
    state space of the automaton."]
def DeterministicAutomaton.mapOutput {Input Output MappedOutput : Type u}
    (automaton : DeterministicAutomaton Input Output) (f : (output : Output) → MappedOutput) :
    DeterministicAutomaton Input MappedOutput where
  V := automaton.V
  str := TypeCat.ofHom fun state ↦
    let step : Output × (Input ⟶ automaton.V) := automaton.str state
    (f step.1, step.2)

/-- The automaton that maps every input by a function before a deterministic automaton takes it,
upon the state space of the automaton. -/
@[counterpart
  typescript
    r"The automaton that maps every input by a function before a deterministic automaton takes it,
    upon the state space of the automaton."]
def DeterministicAutomaton.mapInput {Input MappedInput Output : Type u}
    (automaton : DeterministicAutomaton Input Output) (f : (input : MappedInput) → Input) :
    DeterministicAutomaton MappedInput Output where
  V := automaton.V
  str := TypeCat.ofHom fun state ↦
    let step : Output × (Input ⟶ automaton.V) := automaton.str state
    (step.1, TypeCat.ofHom fun input ↦ step.2 (f input))

/-- The Mealy machine that a deterministic automaton runs as, which gives upon every input the
output of the state and the state that the input leads to, upon the state space of the automaton.
-/
@[counterpart
  typescript
    r"The Mealy machine that a deterministic automaton runs as, which gives upon every input the
    output of the state and the state that the input leads to, upon the state space of the
    automaton."]
def DeterministicAutomaton.toMealyMachine {Input Output : Type u}
    (automaton : DeterministicAutomaton Input Output) : MealyMachine Input Output where
  V := automaton.V
  str := TypeCat.ofHom fun state ↦
    let step : Output × (Input ⟶ automaton.V) := automaton.str state
    (TypeCat.ofHom fun input ↦ (step.1, step.2 input) : Input ⟶ Output × automaton.V)

namespace DeterministicAutomaton

/-- The behavior of a deterministic automaton at a state upon a stream of inputs opens with the
output of the state and goes on with the behavior at the state that the first input leads to upon
the rest of the inputs. -/
theorem behavior_eq {Input Output : Type u}
    (automaton : DeterministicAutomaton Input Output) (state : automaton.V)
    (inputs : Stream' Input) :
    let step : Output × (Input ⟶ automaton.V) := automaton.str state
    automaton.behavior state inputs =
      Stream'.cons step.1 (automaton.behavior (step.2 inputs.head) inputs.tail) :=
  Stream'.corec'_eq _ _

/-- The behavior of the automaton that maps every output of a deterministic automaton maps every
output of the behavior of the automaton. -/
theorem behavior_mapOutput {Input Output MappedOutput : Type u}
    (automaton : DeterministicAutomaton Input Output) (f : (output : Output) → MappedOutput)
    (state : automaton.V) (inputs : Stream' Input) :
    (automaton.mapOutput f).behavior state inputs = (automaton.behavior state inputs).map f := by
  refine Stream'.eq_of_bisim (fun first second ↦ ∃ current rest,
    first = (automaton.mapOutput f).behavior current rest ∧
      second = (automaton.behavior current rest).map f) ?_ ⟨state, inputs, rfl, rfl⟩
  rintro _ _ ⟨current, rest, rfl, rfl⟩
  refine ⟨rfl, _, rest.tail,
    congrArg Stream'.tail (DeterministicAutomaton.behavior_eq _ _ _), ?_⟩
  -- The state of the mapped automaton is one of the automaton, which a rewrite finds by unfolding.
  erw [DeterministicAutomaton.behavior_eq automaton current rest, Stream'.map_cons]
  rfl

/-- The behavior of the automaton that maps every input before a deterministic automaton takes it
is the behavior of the automaton upon the mapped inputs. -/
theorem behavior_mapInput {Input MappedInput Output : Type u}
    (automaton : DeterministicAutomaton Input Output) (f : (input : MappedInput) → Input)
    (state : automaton.V) (inputs : Stream' MappedInput) :
    (automaton.mapInput f).behavior state inputs = automaton.behavior state (inputs.map f) := by
  refine Stream'.eq_of_bisim (fun first second ↦ ∃ current rest,
    first = (automaton.mapInput f).behavior current rest ∧
      second = automaton.behavior current (rest.map f)) ?_ ⟨state, inputs, rfl, rfl⟩
  rintro _ _ ⟨current, rest, rfl, rfl⟩
  refine ⟨rfl, _, rest.tail,
    congrArg Stream'.tail (DeterministicAutomaton.behavior_eq _ _ _), ?_⟩
  -- The state of the mapped automaton is one of the automaton, which a rewrite finds by unfolding.
  erw [DeterministicAutomaton.behavior_eq automaton current (rest.map f)]
  rfl

/-- The Mealy machine of a deterministic automaton behaves upon every stream of inputs as the
automaton. -/
theorem behavior_toMealyMachine {Input Output : Type u}
    (automaton : DeterministicAutomaton Input Output) (state : automaton.V)
    (inputs : Stream' Input) :
    automaton.toMealyMachine.behavior state inputs = automaton.behavior state inputs := by
  refine Stream'.eq_of_bisim (fun first second ↦ ∃ current rest,
    first = automaton.toMealyMachine.behavior current rest ∧
      second = automaton.behavior current rest) ?_ ⟨state, inputs, rfl, rfl⟩
  rintro _ _ ⟨current, rest, rfl, rfl⟩
  refine ⟨rfl, _, rest.tail, congrArg Stream'.tail (MealyMachine.behavior_eq _ _ _), ?_⟩
  -- The state of the machine is one of the automaton, which a rewrite finds by unfolding.
  erw [DeterministicAutomaton.behavior_eq automaton current rest]
  rfl

end DeterministicAutomaton

end Falkara.Simulation
