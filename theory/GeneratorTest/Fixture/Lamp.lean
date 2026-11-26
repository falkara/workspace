module

import Falkara.Counterpart

/-!
# Lamp

The module defines a bundled structure, a lamp, and the lantern, which labels the lamp and which the
checks of the generator write from another module, with the clauses of the attribute `counterpart`
that give the type of lights of the lamp the type parameter `Shade` and its light the field `beam`
with a comment of its own.

## Main Definitions

- `Lamp`: a lamp that shows a light of its type of lights.
- `Lantern`: a lantern, a lamp that shows a light.
-/

@[expose] public section

namespace Geometry

/-- A lamp that shows a light of its type of lights. -/
structure Lamp where
  /-- The type of the lights of the lamp. -/
  Light : Type
  /-- The light that the lamp shows. -/
  light : Light

/-- A lantern, a lamp that shows a light. -/
abbrev Lantern := Lamp

attribute [counterpart
  typescript
    r"A lantern, a lamp that shows a light."
    (Light → "Shade")
    (light → "beam"
      r"The beam that the lamp casts.")] Lantern

end Geometry
