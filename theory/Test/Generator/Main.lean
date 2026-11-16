import Generator.Main
import Test.Generator.Fixture.Point

/-!
# Main

The module defines the checks of the files that the generator writes for the modules of the theory. A module whose structure names a structure of another module imports that structure as a value, as its schema names the schema of the other, imports from Effect only the modules its declarations name, and ends with the contract of its functions. A module with no function and no structure of another module imports nothing beyond Effect and ends with no contract.
-/

/--
info: // Written by the generator of Falkara Theory from `Test.Generator.Fixture.Point`, so every change by hand is lost when the generator runs.

import { Brand, type Option, Schema } from 'effect';

import { Coordinate } from '#src/Test/Generator/Fixture/Coordinate.theory';
import type * as Module from '#src/Test/Generator/Fixture/Point';

/** A schema of a point by its first coordinate. */
export const Point = Schema.Struct({
  /** The first coordinate of the point. */
  first: Coordinate,
}).pipe(Schema.brand('Point'));

/** A point by its first coordinate. */
export type Point = typeof Point.Type;

/** Brands without a check a point by its first coordinate. */
export const point = Brand.nominal<Point>();

/** Gives the point at a coordinate. */
export type PointAt = (coordinate: Coordinate) => Option.Option<Point>;

/** The functions of the theory that the module `Test/Generator/Fixture/Point` of the package implements. */
interface Contract {
  /** Gives the point at a coordinate. */
  readonly pointAt: PointAt;
}

/** The module `Test/Generator/Fixture/Point` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.fileOf `Geometry `Test.Generator.Fixture.Point)

/--
info: // Written by the generator of Falkara Theory from `Test.Generator.Fixture.Coordinate`, so every change by hand is lost when the generator runs.

import { Brand, Schema } from 'effect';

/** A schema of a coordinate of a point. */
export const Coordinate = Schema.Struct({
  /** The value of the coordinate. */
  value: Schema.Rational,
}).pipe(Schema.brand('Coordinate'));

/** A coordinate of a point. */
export type Coordinate = typeof Coordinate.Type;

/** Brands without a check a coordinate of a point. */
export const coordinate = Brand.nominal<Coordinate>();
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.fileOf `Geometry `Test.Generator.Fixture.Coordinate)
