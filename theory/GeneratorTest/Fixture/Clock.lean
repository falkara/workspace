module

meta import Falkara.ExportTypeScript
public import Mathlib.CategoryTheory.Endofunctor.Algebra

/-!
# Clock

The module defines the bundled structure that the checks of the generator write, a clock, which is
a coalgebra of the identity functor on types of Mathlib: a field whose value is a type, its state
space, and a field whose value is a morphism of the category of types into the object of a functor,
its transition.

## Main Definitions

- `Clock`: a clock that ticks from every state to its next state.
-/

@[expose] public section

namespace Geometry

open CategoryTheory

universe u

/-- A clock that ticks from every state to its next state. -/
abbrev Clock : Type (u + 1) :=
  Endofunctor.Coalgebra (𝟭 (Type u))

attribute [export_typescript] Clock

end Geometry
