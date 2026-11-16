import ExportTypeScript

/-!
# Coordinate

The module defines the structure that the checks of the generator name from another module of the theory, a coordinate of a point, and a value of the structure, the unit coordinate.
-/

namespace Geometry

/-- A coordinate of a point. -/
structure Coordinate where
  /-- The value of the coordinate. -/
  value : Rat

attribute [export_typescript] Coordinate

/-- The coordinate whose value is 1. -/
def unit : Coordinate :=
  ⟨1⟩

attribute [export_typescript] unit

end Geometry
