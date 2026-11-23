module

meta import Falkara.ExportTypeScript
public import Mathlib.CategoryTheory.Endofunctor.Algebra
public import Mathlib.CategoryTheory.Limits.Types.Products
public import Mathlib.CategoryTheory.Yoneda

/-!
# Clock

The module defines the bundled structures that the checks of the generator write, a clock, which is
a coalgebra of the identity functor on types of Mathlib: a field whose value is a type, its state
space, and a field whose value is a morphism of the category of types into the object of a functor,
its transition, and a chiming clock, which is a coalgebra of the functor $X \mapsto B \times X$, a
transition into a pair, with a type parameter of its own, its chimes. The module defines as well a
clockwork, the coalgebra of Mathlib as it stands, with its category and its functor as parameters,
the functor of the chimes, a functor on types that the checks write as a type lambda of Effect, and
the curried functor of the chimes, the product functor of Mathlib as it stands, which the checks
write as a type lambda with a type parameter for the type of chimes, the curried functor of the
dials, the coyoneda embedding of Mathlib as it stands, which maps the opposite of the types and
which the checks write as a type lambda with a type parameter for the type of settings, a gear, the
functor of Mathlib as it stands, which the checks write as a type class of Effect, and a gear train,
the composite of Mathlib as it stands, which the checks write as a type lambda with a type parameter
for each of its functors.

## Main Definitions

- `Clock`: a clock that ticks from every state to its next state.
- `ChimingClock`: a clock that chimes and ticks from every state to its next state.
- `Clockwork`: a clockwork that moves every state by a functor.
- `ChimeFunctor`: the functor of the chimes, which gives a chime and the next state.
- `chimesFunctor`: the curried functor of the chimes, which maps every type of chimes to the
  functor of the chimes.
- `dialsFunctor`: the curried functor of the dials, which maps every type of settings to the
  functor that turns a setting into the next state.
- `Gear`: a gear, a functor that a clockwork moves its states by.
- `GearTrain`: a gear train, which moves every state by one gear and then by another.
-/

@[expose] public section

namespace Geometry

open CategoryTheory

universe u

/-- A clock that ticks from every state to its next state. -/
abbrev Clock : Type (u + 1) :=
  Endofunctor.Coalgebra (𝟭 (Type u))

/-- A clock that chimes and ticks from every state to its next state. -/
abbrev ChimingClock (B : Type u) : Type (u + 1) :=
  Endofunctor.Coalgebra (Limits.Types.binaryProductFunctor.obj B)

/-- A clockwork that moves every state by a functor. -/
abbrev Clockwork := @Endofunctor.Coalgebra

/-- The functor of the chimes, which gives a chime and the next state. -/
abbrev ChimeFunctor (B : Type u) : Type u ⥤ Type u :=
  Limits.Types.binaryProductFunctor.obj B

/-- The curried functor of the chimes, which maps every type of chimes to the functor of the
chimes. -/
abbrev chimesFunctor := Limits.Types.binaryProductFunctor

/-- The curried functor of the dials, which maps every type of settings to the functor that turns a
setting into the next state. -/
abbrev dialsFunctor := @coyoneda

/-- A gear, a functor that a clockwork moves its states by. -/
abbrev Gear := @CategoryTheory.Functor

/-- A gear train, which moves every state by one gear and then by another. -/
abbrev GearTrain := @Functor.comp

attribute [export_typescript] Clock ChimingClock Clockwork ChimeFunctor chimesFunctor dialsFunctor
  Gear GearTrain

end Geometry
