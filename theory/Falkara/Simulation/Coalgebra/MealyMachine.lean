/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Simulation.Functor
public import Falkara.Simulation.Functor.BinaryProductFunctor
public import Falkara.Simulation.Functor.ExponentFunctor
public import Mathlib.CategoryTheory.Endofunctor.Algebra
public import Mathlib.Data.Stream.Defs

import Falkara.ExportTypeScript
import Falkara.References
import Mathlib.Data.Stream.Init

/-!
# Mealy Machine

The module defines the Mealy machines as Jacobs [jacobs2017introductionCoalgebra] names them, the
coalgebras of the functions from a type of inputs into the binary products with a type of outputs,
their behavior, which maps a stream of inputs to the stream of the outputs, their steps, which
keep the next state beside every output, and the machines that a machine maps into or that two
machines compose into.

## Main Definitions

- `MealyMachine`: a Mealy machine.
- `MealyMachine.behavior`: the behavior of a Mealy machine.
- `MealyMachine.steps`: the steps of a Mealy machine.
- `MealyMachine.mapOutput`: the machine that maps every output of a machine.
- `MealyMachine.mapInput`: the machine that maps every input before a machine takes it.
- `MealyMachine.series`: the machine that feeds every output of a machine into another.
- `MealyMachine.parallel`: the machine that runs two machines side by side.

## Main Statements

- `MealyMachine.behavior_eq`: the behavior at a state upon a stream of inputs opens with the output
  of the state upon the first input and goes on with the behavior at the next state upon the rest.
- `MealyMachine.behavior_eq_map_steps`: the behavior at a state upon a stream of inputs is the
  stream of the outputs of the steps.
- `MealyMachine.behavior_mapOutput`, `MealyMachine.behavior_mapInput`: the behavior of a mapped
  machine maps the outputs or the inputs of the behavior.
- `MealyMachine.behavior_series`: the behavior of two machines in series is the behavior of the
  second upon the behavior of the first.
- `MealyMachine.behavior_parallel`: the behavior of two machines side by side pairs their
  behaviors upon the parts of the inputs.

## Implementation Notes

The product takes the output before the state, as `StreamCoalgebra` does, whereas the exercise that
names the Mealy machines takes the state first. The two products are isomorphic.

The behavior takes its name from the behavior map of Jacobs, as that of a stream coalgebra does,
and gives a function from the streams of inputs to the streams of outputs, which is causal, as the
exercise describes the final Mealy machine: the output at every position depends on the inputs up
to that position alone. TypeScript writes both streams as streams of Effect, and the module of the
package takes a stream of inputs that may fail or need services and passes both on to the outputs,
as the contract admits a function more general than the theory states.

The machine gives its step upon an input in a lawful monad, the identity monad `Id` unless a monad
is given, as `StreamCoalgebra` does, so that a step may take an effect, such as one of
`EffectFunctor`, and the machines in the identity monad are those of the exercise.

The machines that a machine maps into and that two machines compose into keep the state spaces of
their machines, a pair of them where two machines compose, so that a step of a composed machine is
taken on demand as one of any other. The names of the two compositions are those of circuits, which
a machine in series feeds and a machine in parallel runs beside another. TypeScript takes every one
of them as well with its machine last, so that a machine pipes into it, and the module of the
package gives the machines in the monad of `EffectFunctor` the same compositions, whose effects run
in the order of the machines.
-/

@[expose] public section

namespace Falkara.Simulation

universe u

/-! ### Definitions -/

/-- A Mealy machine, which gives from every state upon every input an output and the next state in a
monad. -/
@[export_typescript /-- A Mealy machine, which gives from every state upon every input an output
    and the next state in a monad. -/
  (m := "Monad")]
abbrev MealyMachine (Input Output : Type u) (m : Type u → Type u := Id) [Monad m]
    [LawfulMonad m] :=
  CategoryTheory.Endofunctor.Coalgebra
    (Functor.comp (Functor.comp (binaryProductFunctor.obj Output)
      (CategoryTheory.ofTypeFunctor m)) (exponentFunctor.obj (Opposite.op Input)))

attribute [cite "Exercise 2.3.2" jacobs2017introductionCoalgebra] MealyMachine

/-- The behavior of a Mealy machine, which gives from every state upon a stream of inputs the stream
of the outputs that the machine gives upon the inputs one after another. -/
@[export_typescript /-- The behavior of a Mealy machine, which gives from every state upon a
    stream of inputs the stream of the outputs that the machine gives upon the inputs one after
    another. -/]
def MealyMachine.behavior {Input Output : Type u} (machine : MealyMachine Input Output)
    (state : machine.V) (inputs : Stream' Input) : Stream' Output :=
  Stream'.corec'
    (fun (current, rest) ↦
      let step : Input ⟶ Output × machine.V := machine.str current
      ((step rest.head).1, (step rest.head).2, rest.tail))
    (state, inputs)

attribute [cite "Definition 2.3.1" jacobs2017introductionCoalgebra] MealyMachine.behavior

/-- The steps of a Mealy machine, which gives from every state upon a stream of inputs the stream of
the steps that the machine takes upon the inputs one after another, each an output with the next
state, the behavior of the machine whose output is the whole step. -/
@[export_typescript /-- The steps of a Mealy machine, which gives from every state upon a stream
    of inputs the stream of the steps that the machine takes upon the inputs one after another,
    each an output with the next state, the behavior of the machine whose output is the whole
    step. -/]
def MealyMachine.steps {Input Output : Type u} (machine : MealyMachine Input Output)
    (state : machine.V) (inputs : Stream' Input) :
    Stream' ((binaryProductFunctor.obj Output).obj machine.V) :=
  Stream'.corec'
    (fun (current, rest) ↦
      let step : Input ⟶ Output × machine.V := machine.str current
      (step rest.head, (step rest.head).2, rest.tail))
    (state, inputs)

attribute [cite "Definition 2.3.1" jacobs2017introductionCoalgebra] MealyMachine.steps

/-- The machine that maps every output of a Mealy machine by a function, upon the state space of
the machine. -/
@[export_typescript /-- The machine that maps every output of a Mealy machine by a function, upon
    the state space of the machine. -/]
def MealyMachine.mapOutput {Input Output MappedOutput : Type u}
    (machine : MealyMachine Input Output) (f : (output : Output) → MappedOutput) :
    MealyMachine Input MappedOutput where
  V := machine.V
  str := TypeCat.ofHom fun state ↦
    let step : Input ⟶ Output × machine.V := machine.str state
    (TypeCat.ofHom fun input ↦ (f (step input).1, (step input).2) :
      Input ⟶ MappedOutput × machine.V)

/-- The machine that maps every input by a function before a Mealy machine takes it, upon the state
space of the machine. -/
@[export_typescript /-- The machine that maps every input by a function before a Mealy machine
    takes it, upon the state space of the machine. -/]
def MealyMachine.mapInput {Input MappedInput Output : Type u}
    (machine : MealyMachine Input Output) (f : (input : MappedInput) → Input) :
    MealyMachine MappedInput Output where
  V := machine.V
  str := TypeCat.ofHom fun state ↦
    let step : Input ⟶ Output × machine.V := machine.str state
    (TypeCat.ofHom fun input ↦ step (f input) : MappedInput ⟶ Output × machine.V)

/-- The machine that feeds every output of a Mealy machine into another as its input, upon the pairs
of the states of the two machines. -/
@[export_typescript /-- The machine that feeds every output of a Mealy machine into another as its
    input, upon the pairs of the states of the two machines. -/]
def MealyMachine.series {Input Middle Output : Type u}
    (first : MealyMachine Input Middle) (second : MealyMachine Middle Output) :
    MealyMachine Input Output where
  V := first.V × second.V
  str := TypeCat.ofHom fun (firstState, secondState) ↦
    let firstStep : Input ⟶ Middle × first.V := first.str firstState
    let secondStep : Middle ⟶ Output × second.V := second.str secondState
    (TypeCat.ofHom fun input ↦
      ((secondStep (firstStep input).1).1, (firstStep input).2,
        (secondStep (firstStep input).1).2) :
      Input ⟶ Output × first.V × second.V)

/-- The machine that runs two Mealy machines side by side, each upon its part of every input, upon
the pairs of the states of the two machines. -/
@[export_typescript /-- The machine that runs two Mealy machines side by side, each upon its part
    of every input, upon the pairs of the states of the two machines. -/]
def MealyMachine.parallel {FirstInput FirstOutput SecondInput SecondOutput : Type u}
    (first : MealyMachine FirstInput FirstOutput) (second : MealyMachine SecondInput SecondOutput) :
    MealyMachine (FirstInput × SecondInput) (FirstOutput × SecondOutput) where
  V := first.V × second.V
  str := TypeCat.ofHom fun (firstState, secondState) ↦
    let firstStep : FirstInput ⟶ FirstOutput × first.V := first.str firstState
    let secondStep : SecondInput ⟶ SecondOutput × second.V := second.str secondState
    (TypeCat.ofHom fun (firstInput, secondInput) ↦
      (((firstStep firstInput).1, (secondStep secondInput).1), (firstStep firstInput).2,
        (secondStep secondInput).2) :
      FirstInput × SecondInput ⟶ (FirstOutput × SecondOutput) × first.V × second.V)

/-! ### Theorems -/

namespace MealyMachine

/-- The behavior of a Mealy machine at a state upon a stream of inputs opens with the output that
the machine gives upon the first input and goes on with the behavior at the next state upon the rest
of the inputs. -/
theorem behavior_eq {Input Output : Type u} (machine : MealyMachine Input Output)
    (state : machine.V) (inputs : Stream' Input) :
    let step : Input ⟶ Output × machine.V := machine.str state
    machine.behavior state inputs =
      Stream'.cons (step inputs.head).1 (machine.behavior (step inputs.head).2 inputs.tail) :=
  Stream'.corec'_eq _ _

/-- The behavior of a Mealy machine at a state upon a stream of inputs is the stream of the outputs
of its steps. -/
theorem behavior_eq_map_steps {Input Output : Type u}
    (machine : MealyMachine Input Output) (state : machine.V) (inputs : Stream' Input) :
    machine.behavior state inputs = (machine.steps state inputs).map Prod.fst := by
  simp only [MealyMachine.behavior, MealyMachine.steps, Stream'.corec', Stream'.corec_def]
  rfl

/-- The behavior of the machine that maps every output of a Mealy machine maps every output of the
behavior of the machine. -/
theorem behavior_mapOutput {Input Output MappedOutput : Type u}
    (machine : MealyMachine Input Output) (f : (output : Output) → MappedOutput)
    (state : machine.V) (inputs : Stream' Input) :
    (machine.mapOutput f).behavior state inputs = (machine.behavior state inputs).map f := by
  refine Stream'.eq_of_bisim (fun first second ↦ ∃ current rest,
    first = (machine.mapOutput f).behavior current rest ∧
      second = (machine.behavior current rest).map f) ?_ ⟨state, inputs, rfl, rfl⟩
  rintro _ _ ⟨current, rest, rfl, rfl⟩
  refine ⟨rfl, _, rest.tail, congrArg Stream'.tail (MealyMachine.behavior_eq _ _ _), ?_⟩
  -- The state of the mapped machine is one of the machine, which a rewrite finds by unfolding.
  erw [MealyMachine.behavior_eq machine current rest, Stream'.map_cons]
  rfl

/-- The behavior of the machine that maps every input before a Mealy machine takes it is the
behavior of the machine upon the mapped inputs. -/
theorem behavior_mapInput {Input MappedInput Output : Type u}
    (machine : MealyMachine Input Output) (f : (input : MappedInput) → Input)
    (state : machine.V) (inputs : Stream' MappedInput) :
    (machine.mapInput f).behavior state inputs = machine.behavior state (inputs.map f) := by
  refine Stream'.eq_of_bisim (fun first second ↦ ∃ current rest,
    first = (machine.mapInput f).behavior current rest ∧
      second = machine.behavior current (rest.map f)) ?_ ⟨state, inputs, rfl, rfl⟩
  rintro _ _ ⟨current, rest, rfl, rfl⟩
  refine ⟨rfl, _, rest.tail, congrArg Stream'.tail (MealyMachine.behavior_eq _ _ _), ?_⟩
  -- The state of the mapped machine is one of the machine, which a rewrite finds by unfolding.
  erw [MealyMachine.behavior_eq machine current (rest.map f)]
  rfl

/-- The behavior of two Mealy machines in series is the behavior of the second upon the behavior of
the first. -/
theorem behavior_series {Input Middle Output : Type u}
    (first : MealyMachine Input Middle) (second : MealyMachine Middle Output)
    (firstState : first.V) (secondState : second.V) (inputs : Stream' Input) :
    (first.series second).behavior (firstState, secondState) inputs =
      second.behavior secondState (first.behavior firstState inputs) := by
  refine Stream'.eq_of_bisim (fun left right ↦ ∃ firstCurrent secondCurrent rest,
    left = (first.series second).behavior (firstCurrent, secondCurrent) rest ∧
      right = second.behavior secondCurrent (first.behavior firstCurrent rest)) ?_
    ⟨firstState, secondState, inputs, rfl, rfl⟩
  rintro _ _ ⟨firstCurrent, secondCurrent, rest, rfl, rfl⟩
  refine ⟨rfl, _, _, rest.tail, congrArg Stream'.tail (MealyMachine.behavior_eq _ _ _), ?_⟩
  -- The state of the composed machine is a pair of states of the machines, which a rewrite finds
  -- by unfolding.
  erw [MealyMachine.behavior_eq first firstCurrent rest,
    MealyMachine.behavior_eq second secondCurrent _]
  rfl

/-- The behavior of two Mealy machines side by side pairs the behavior of the first upon the first
parts of the inputs with the behavior of the second upon the second parts. -/
theorem behavior_parallel {FirstInput FirstOutput SecondInput SecondOutput : Type u}
    (first : MealyMachine FirstInput FirstOutput) (second : MealyMachine SecondInput SecondOutput)
    (firstState : first.V) (secondState : second.V)
    (inputs : Stream' (FirstInput × SecondInput)) :
    (first.parallel second).behavior (firstState, secondState) inputs =
      Stream'.zip Prod.mk (first.behavior firstState (inputs.map Prod.fst))
        (second.behavior secondState (inputs.map Prod.snd)) := by
  refine Stream'.eq_of_bisim (fun left right ↦ ∃ firstCurrent secondCurrent rest,
    left = (first.parallel second).behavior (firstCurrent, secondCurrent) rest ∧
      right = Stream'.zip Prod.mk (first.behavior firstCurrent (rest.map Prod.fst))
        (second.behavior secondCurrent (rest.map Prod.snd))) ?_
    ⟨firstState, secondState, inputs, rfl, rfl⟩
  rintro _ _ ⟨firstCurrent, secondCurrent, rest, rfl, rfl⟩
  refine ⟨rfl, _, _, rest.tail, congrArg Stream'.tail (MealyMachine.behavior_eq _ _ _), ?_⟩
  -- The state of the composed machine is a pair of states of the machines, which a rewrite finds
  -- by unfolding.
  erw [MealyMachine.behavior_eq first firstCurrent _,
    MealyMachine.behavior_eq second secondCurrent _, Stream'.tail_zip]
  rfl

end MealyMachine

end Falkara.Simulation
