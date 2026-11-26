module

public import GeneratorTest.Fixture.Clock
public import Mathlib.Data.Stream.Defs

import Falkara.Counterpart

/-!
# Bell

The module defines a bundled structure that the checks of the generator write from the functor of
another module of the theory, a bell, which is a coalgebra of the curried functor of the chimes of
the module `Clock` at a type of chimes, and which extends the clockwork of that module at the
functor, a function of a bell and one of its states, whose type names the state space of the
bell and a stream, and a function that takes a stream as its last parameter.

## Main Definitions

- `Bell`: a bell that rings a chime and moves to its next state.
- `Bell.peal`: the peal of a bell, the stream of the chimes that it rings from a state on.
- `Bell.answer`: the answer of a bell to the chimes it hears, every chime it hears with the chime
  it rings.
-/

@[expose] public section

namespace Geometry

/-- A bell that rings a chime and moves to its next state. -/
abbrev Bell (B : Type) :=
  CategoryTheory.Endofunctor.Coalgebra (chimesFunctor.obj B)

/-- The peal of a bell, the stream of the chimes that it rings from a state on. -/
def Bell.peal {B : Type} (bell : Bell B) (state : bell.V) : Stream' B :=
  Stream'.corec' bell.str state

/-- The answer of a bell to the chimes it hears, every chime it hears with the chime it rings. -/
def Bell.answer {B : Type} (bell : Bell B) (state : bell.V) (heard : Stream' B) : Stream' (B × B) :=
  Stream'.zip Prod.mk heard (bell.peal state)

attribute [counterpart
  typescript
    r"A bell that rings a chime and moves to its next state."] Bell

attribute [counterpart
  typescript
    r"The peal of a bell, the stream of the chimes that it rings from a state on."] Bell.peal

attribute [counterpart
  typescript
    r"The answer of a bell to the chimes it hears, every chime it hears with the chime it
    rings."] Bell.answer

end Geometry
