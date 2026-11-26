module

import Falkara.Counterpart

/-!
# Coordinate

The module defines the structure that the checks of the generator name from another module of the
theory, a coordinate of a point, a value of the structure, the unit coordinate, and an operation
on coordinates.
-/

@[expose] public section

namespace Geometry

/-- A coordinate of a point. -/
structure Coordinate where
  /-- The value of the coordinate. -/
  value : Rat

attribute [counterpart
  typescript
    r"A coordinate of a point."
    (value
      r"The value of the coordinate.")
    schema
      r"A schema of a coordinate of a point, which decodes its value."
    constructor
      r"Brands a coordinate from its value without a check."] Coordinate

/-- The coordinate whose value is 1. -/
def unit : Coordinate :=
  ⟨1⟩

attribute [counterpart
  typescript
    r"The coordinate whose value is 1."] unit

/-- The coordinate shifted by an offset. -/
def Coordinate.shift (coordinate : Coordinate) (offset : Rat) : Coordinate :=
  ⟨coordinate.value + offset⟩

attribute [counterpart
  typescript
    r"The coordinate shifted by an offset."] Coordinate.shift

end Geometry
