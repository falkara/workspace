import Test.Generator.Fixture.Coordinate

/-!
# Point

The module defines the structure and the function that the checks of the generator write, a point by its first coordinate and the point at a coordinate, both of which name the coordinate of another module of the theory.
-/

namespace Geometry

/-- A point by its first coordinate. -/
structure Point where
  /-- The first coordinate of the point. -/
  first : Coordinate

attribute [export_typescript] Point

/-- Gives the point at a coordinate. -/
def pointAt (coordinate : Coordinate) : Option Point :=
  some ⟨coordinate⟩

attribute [export_typescript] pointAt

end Geometry
