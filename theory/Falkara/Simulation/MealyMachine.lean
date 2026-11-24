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
import Falkara.ExportTypeScript
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Mealy Machine

The module defines the Mealy machines as Jacobs [jacobs2017introductionCoalgebra] names them, the
coalgebras of the functions from a type of inputs into the binary products with a type of outputs.

## Main Definitions

- `MealyMachine`: a Mealy machine.

## Implementation Notes

The product takes the output before the state, as `StreamCoalgebra` does, whereas the exercise that
names the Mealy machines takes the state first. The two products are isomorphic.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- A Mealy machine, which gives from every state upon every input an output and the next state. -/
abbrev MealyMachine.{u} (Input Output : Type u) :=
  CategoryTheory.Endofunctor.Coalgebra
    (Functor.comp (binaryProductFunctor.obj Output) (coyoneda.obj (Opposite.op Input)))

attribute [cite "Exercise 2.3.2" jacobs2017introductionCoalgebra] MealyMachine

/-! ### Export -/

attribute [export_typescript] MealyMachine

end Falkara.Simulation
