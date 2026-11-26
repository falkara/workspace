module

public import Mathlib.CategoryTheory.Endofunctor.Algebra
public import Mathlib.CategoryTheory.Limits.Types.Products

import Falkara.Counterpart

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
which the checks write as a type lambda with a type parameter for the type of settings, named
`Setting` by a clause of the attribute `counterpart`, a gear, the
functor of Mathlib as it stands, which the checks write as a type class of Effect with its action on
types named `Motion` by a clause of the attribute, and a gear train, the composite of
Mathlib as it stands, which the checks write as a type lambda with a type parameter for each of its
functors, named `Driver` and `Follower` by the attribute.
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

attribute [counterpart
  typescript
    r"A clock that ticks from every state to its next state."] Clock

attribute [counterpart
  typescript
    r"A clock that chimes and ticks from every state to its next state."] ChimingClock

attribute [counterpart
  typescript
    r"A clockwork that moves every state by a functor."
    (str
      r"structure morphism of the coalgebra")] Clockwork

attribute [counterpart
  typescript
    r"The functor of the chimes, which gives a chime and the next state."] ChimeFunctor

attribute [counterpart
  typescript
    r"The curried functor of the chimes, which maps every type of chimes to the functor of the
    chimes."] chimesFunctor

attribute [counterpart
  typescript
    r"The curried functor of the dials, which maps every type of settings to the functor that turns
    a setting into the next state."
    (k → "Setting")] dialsFunctor

attribute [counterpart
  typescript
    r"A gear, a functor that a clockwork moves its states by."
    (obj → "Motion")
    (map
      r"The action of a functor on morphisms.")
    (map_id
      r"A functor preserves identity morphisms.")
    (map_comp
      r"A functor preserves composition.")] Gear

attribute [counterpart
  typescript
    r"A gear train, which moves every state by one gear and then by another."
    (F → "Driver")
    (G → "Follower")] GearTrain

end Geometry
