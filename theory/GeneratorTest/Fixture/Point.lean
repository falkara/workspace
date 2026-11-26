module

public import GeneratorTest.Fixture.Coordinate

import Falkara.Counterpart

/-!
# Point

The module defines the structure and the function that the checks of the generator write, a point
by its first coordinate and the point at a coordinate, both of which name the coordinate of another
module of the theory, and the theorems that the checks write as tests, one with a constructor and
an option and one with a hypothesis.
-/

@[expose] public section

namespace Geometry

/-- A point by its first coordinate. -/
structure Point where
  /-- The first coordinate of the point. -/
  first : Coordinate

attribute [counterpart
  typescript
    r"A point by its first coordinate."
    (first
      r"The first coordinate of the point.")] Point

/-- Gives the point at a coordinate. -/
def pointAt (coordinate : Coordinate) : Option Point :=
  some ⟨coordinate⟩

attribute [counterpart
  typescript
    r"Gives the point at a coordinate."] pointAt

/-- The point at a coordinate is the point whose first coordinate it is. -/
theorem pointAt_first (coordinate : Coordinate) : pointAt coordinate = some ⟨coordinate⟩ :=
  rfl

attribute [counterpart
  typescript
    r"The point at a coordinate is the point whose first coordinate it is."] pointAt_first

/-- The points at two equal coordinates are equal. -/
theorem pointAt_eq (first second : Coordinate) (same : first = second) :
    pointAt first = pointAt second := by
  rw [same]

attribute [counterpart
  typescript
    r"The points at two equal coordinates are equal."] pointAt_eq

end Geometry
