module

meta import Falkara.ExportTypeScript

/-!
# Coordinate

The module defines the structure that the checks of the generator name from another module of the
theory, a coordinate of a point, a value of the structure, the unit coordinate, and an operation
on coordinates.

## Main Definitions

- `Coordinate`: a coordinate of a point.
- `unit`: the coordinate whose value is 1.
- `Coordinate.shift`: the coordinate shifted by an offset.
-/

@[expose] public section

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

/-- The coordinate shifted by an offset. -/
def Coordinate.shift (coordinate : Coordinate) (offset : Rat) : Coordinate :=
  ⟨coordinate.value + offset⟩

attribute [export_typescript] Coordinate.shift

end Geometry
