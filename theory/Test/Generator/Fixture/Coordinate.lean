import ExportTypeScript

/-!
# Coordinate

The module defines the structure that the checks of the generator name from another module of the theory, a coordinate of a point.
-/

namespace Geometry

/-- A coordinate of a point. -/
structure Coordinate where
  /-- The value of the coordinate. -/
  value : Rat

attribute [export_typescript] Coordinate

end Geometry
