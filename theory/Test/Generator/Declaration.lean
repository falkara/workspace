import Generator.Declaration
import Test.Generator.Fixture.Coordinate

/-!
# Declaration

The module defines the checks of the declarations of TypeScript that the declarations of the theory take: a structure takes a branded schema with its fields, the type the schema decodes, and a constructor that brands a value, a function takes a type of its signature, on one line or, where the line is longer than 100 columns, with every parameter on a line of its own, and a value takes a constant that holds the value, a rational number as an integer or a quotient and a structure as its constructor, on one line or with every field on a line of its own, all named without the namespace of their module and with their documentation comments. A value of a type with no value in TypeScript, a value of a structure of another module, and a declaration without the mark `export_typescript` take none.
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

/-- The rational value that the checks write. -/
def origin : Rat :=
  0

attribute [export_typescript] origin

/-- The value of a structure that the checks write. -/
def corner : Point :=
  ⟨1 / 2, -3⟩

attribute [export_typescript] corner

/-- The value of a structure that the checks write with every field on a line of its own, as the value is longer than a line. -/
def farthestCornerOfTheSquare : Point :=
  ⟨123456789 / 1000, -987654321 / 1000⟩

attribute [export_typescript] farthestCornerOfTheSquare

/-- The value that the checks refuse, as an option has no value in TypeScript. -/
def missingCoordinate : Option Rat :=
  none

attribute [export_typescript] missingCoordinate

/-- The value that the checks refuse, as its structure lies in another module. -/
def unitCoordinate : Coordinate :=
  ⟨1⟩

attribute [export_typescript] unitCoordinate

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

/** Brands without a check the structure that the checks write. */
export const point = Brand.nominal<Point>();
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

/--
info: /** The rational value that the checks write. */
export const origin: Rational.Rational = Rational.fromBigInt(0n);
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.declarationOf `Geometry ``Geometry.origin)

/--
info: /** The value of a structure that the checks write. */
export const corner: Point = point({ x: Rational.makeUnsafe(1n, 2n), y: Rational.fromBigInt(-3n) });
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.declarationOf `Geometry ``Geometry.corner)

/--
info: /** The value of a structure that the checks write with every field on a line of its own, as the value is longer than a line. */
export const farthestCornerOfTheSquare: Point = point({
  x: Rational.makeUnsafe(123456789n, 1000n),
  y: Rational.makeUnsafe(-987654321n, 1000n),
});
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.declarationOf `Geometry ``Geometry.farthestCornerOfTheSquare)

/-- error: `Geometry.missingCoordinate` has no value in TypeScript, as `Option Rat` has none. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.declarationOf `Geometry ``Geometry.missingCoordinate)

/-- error: `Geometry.unitCoordinate` has no value in TypeScript, as `Geometry.Coordinate` lies in another module, whose constructor the file never imports. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.declarationOf `Geometry ``Geometry.unitCoordinate)

/-- error: `Geometry.unmarkedFunction` has no declaration in TypeScript, as the theory never marks it `export_typescript`. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.declarationOf `Geometry ``Geometry.unmarkedFunction)
