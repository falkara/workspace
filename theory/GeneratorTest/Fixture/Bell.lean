module

meta import Falkara.ExportTypeScript
public import GeneratorTest.Fixture.Clock
public import Mathlib.Data.Stream.Defs

/-!
# Bell

The module defines a bundled structure that the checks of the generator write from the functor of
another module of the theory, a bell, which is a coalgebra of the curried functor of the chimes of
the module `Clock` at a type of chimes, and which extends the clockwork of that module at the
functor, and a function of a bell and one of its states, whose type names the state space of the
bell and a stream.

## Main Definitions

- `Bell`: a bell that rings a chime and moves to its next state.
- `Bell.peal`: the peal of a bell, the stream of the chimes that it rings from a state on.
-/

@[expose] public section

namespace Geometry

/-- A bell that rings a chime and moves to its next state. -/
abbrev Bell (B : Type) :=
  CategoryTheory.Endofunctor.Coalgebra (chimesFunctor.obj B)

/-- The peal of a bell, the stream of the chimes that it rings from a state on. -/
def Bell.peal {B : Type} (bell : Bell B) (state : bell.V) : Stream' B :=
  Stream'.corec' bell.str state

attribute [export_typescript] Bell Bell.peal

end Geometry
