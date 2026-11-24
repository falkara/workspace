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
# Mealy Machine

The module defines the Mealy machines as Jacobs [jacobs2017introductionCoalgebra] names them, the
coalgebras of the functions from a type of inputs into the binary products with a type of outputs,
and their behavior, which maps a stream of inputs to the stream of the outputs.

## Main Definitions

- `MealyMachine`: a Mealy machine.
- `MealyMachine.behavior`: the behavior of a Mealy machine.

## Main Statements

- `MealyMachine.behavior_eq`: the behavior at a state upon a stream of inputs opens with the output
  of the state upon the first input and goes on with the behavior at the next state upon the rest.

## Implementation Notes

The product takes the output before the state, as `StreamCoalgebra` does, whereas the exercise that
names the Mealy machines takes the state first. The two products are isomorphic.

The behavior takes its name from the behavior map of Jacobs, as that of a stream coalgebra does,
and gives a function from the streams of inputs to the streams of outputs, which is causal, as the
exercise describes the final Mealy machine: the output at every position depends on the inputs up
to that position alone. TypeScript writes both streams as streams of Effect, and the module of the
package takes a stream of inputs that may fail or need services and passes both on to the outputs,
as the contract admits a function more general than the theory states.
-/

@[expose] public section

namespace Falkara.Simulation

universe u

/-! ### Definitions -/

/-- A Mealy machine, which gives from every state upon every input an output and the next state. -/
abbrev MealyMachine (Input Output : Type u) :=
  CategoryTheory.Endofunctor.Coalgebra
    (Functor.comp (binaryProductFunctor.obj Output) (coyoneda.obj (Opposite.op Input)))

attribute [cite "Exercise 2.3.2" jacobs2017introductionCoalgebra] MealyMachine

/-- The behavior of a Mealy machine, which gives from every state upon a stream of inputs the stream
of the outputs that the machine gives upon the inputs one after another. -/
def MealyMachine.behavior {Input Output : Type u} (machine : MealyMachine Input Output)
    (state : machine.V) (inputs : Stream' Input) : Stream' Output :=
  Stream'.corec'
    (fun (current, rest) ↦
      let step : Input ⟶ Output × machine.V := machine.str current
      ((step rest.head).1, (step rest.head).2, rest.tail))
    (state, inputs)

attribute [cite "Definition 2.3.1" jacobs2017introductionCoalgebra] MealyMachine.behavior

/-! ### Theorems -/

/-- The behavior of a Mealy machine at a state upon a stream of inputs opens with the output that
the machine gives upon the first input and goes on with the behavior at the next state upon the rest
of the inputs. -/
theorem MealyMachine.behavior_eq {Input Output : Type u} (machine : MealyMachine Input Output)
    (state : machine.V) (inputs : Stream' Input) :
    let step : Input ⟶ Output × machine.V := machine.str state
    machine.behavior state inputs =
      Stream'.cons (step inputs.head).1 (machine.behavior (step inputs.head).2 inputs.tail) :=
  Stream'.corec'_eq _ _

/-! ### Export -/

attribute [export_typescript] MealyMachine MealyMachine.behavior

end Falkara.Simulation
