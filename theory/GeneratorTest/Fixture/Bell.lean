module

meta import Falkara.ExportTypeScript
public import GeneratorTest.Fixture.Clock

/-!
# Bell

The module defines a bundled structure that the checks of the generator write from the functor of
another module of the theory, a bell, which is a coalgebra of the curried functor of the chimes of
the module `Clock` at a type of chimes, and whose fields name the functor nowhere once they reduce.

## Main Definitions

- `Bell`: a bell that rings a chime and moves to its next state.
-/

@[expose] public section

namespace Geometry

/-- A bell that rings a chime and moves to its next state. -/
abbrev Bell (B : Type) :=
  CategoryTheory.Endofunctor.Coalgebra (chimesFunctor.obj B)

attribute [export_typescript] Bell

end Geometry
