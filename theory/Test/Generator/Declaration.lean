import Generator.Declaration

/-!
# Declaration

The module defines the checks of the declarations of TypeScript that the declarations of the theory take: a structure takes a branded schema with its fields and the type the schema decodes, and a function takes a type of its signature, on one line or, where the line is longer than 100 columns, with every parameter on a line of its own, both named without the namespace of their module and with their documentation comments, while a value and a declaration without the mark `export_typescript` take none.
-/

namespace Geometry

/-- The structure that the checks write. -/
structure Point where
  /-- The first coordinate of the point. -/
  x : Rat
  /-- The second coordinate of the point. -/
  y : Rat

attribute [export_typescript] Point

/-- The function that the checks write, a function of a structure. -/
def Point.sum (point : Point) : Rat :=
  point.x + point.y

attribute [export_typescript] Point.sum

/-- The function that the checks write. -/
def pointOf (coordinate : Rat) : Option Point :=
  some ⟨coordinate, coordinate⟩

attribute [export_typescript] pointOf

/-- The function that the checks write with every parameter on a line of its own, as its type is longer than a line. -/
def pointBetween (firstCoordinateOfThePoint secondCoordinateOfThePoint : Rat) : Option Point :=
  some ⟨firstCoordinateOfThePoint, secondCoordinateOfThePoint⟩

attribute [export_typescript] pointBetween

/-- The value that the checks refuse. -/
def origin : Rat :=
  0

attribute [export_typescript] origin

/-- The function that the checks leave unmarked. -/
def unmarkedFunction (coordinate : Rat) : Rat :=
  coordinate

end Geometry

/--
info: /** A schema of the structure that the checks write. */
export const Point = Schema.Struct({
  /** The first coordinate of the point. */
  x: Schema.Rational,
  /** The second coordinate of the point. */
  y: Schema.Rational,
}).pipe(Schema.brand('Point'));

/** The structure that the checks write. */
export type Point = typeof Point.Type;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.declarationOf `Geometry ``Geometry.Point)

/--
info: /** The function that the checks write, a function of a structure. */
export type PointSum = (point: Point) => Rational.Rational;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.declarationOf `Geometry ``Geometry.Point.sum)

/--
info: /** The function that the checks write. */
export type PointOf = (coordinate: Rational.Rational) => Option.Option<Point>;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.declarationOf `Geometry ``Geometry.pointOf)

/--
info: /** The function that the checks write with every parameter on a line of its own, as its type is longer than a line. */
export type PointBetween = (
  firstCoordinateOfThePoint: Rational.Rational,
  secondCoordinateOfThePoint: Rational.Rational,
) => Option.Option<Point>;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.declarationOf `Geometry ``Geometry.pointBetween)

/-- error: `Geometry.origin` has no declaration in TypeScript, as it is a value and the generator writes no values. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.declarationOf `Geometry ``Geometry.origin)

/-- error: `Geometry.unmarkedFunction` has no declaration in TypeScript, as the theory never marks it `export_typescript`. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.declarationOf `Geometry ``Geometry.unmarkedFunction)
