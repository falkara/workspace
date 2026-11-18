module

import all GeneratorTest.Fixture.Coordinate
import all GeneratorTest.Fixture.Point
meta import Generator.Theorem

/-!
# Theorem

The module defines the checks of the tests of TypeScript that the theorems of the theory take. The
file of tests of a module is checked whole: a theorem with a constructor and an option takes a
property test, and a theorem with a hypothesis takes a property test that skips the values breaking
the hypothesis.
-/

open Generator

/--
info: // Written by the generator of the theory from `GeneratorTest.Fixture.Point`, so every change by hand is lost when the generator runs.

import { describe, expect, it } from '@effect/vitest';
import { Equal, Option } from 'effect';

import * as Coordinate from '#src/Fixture/Coordinate';
import * as Point from '#src/Fixture/Point';

describe('Fixture/Point', () => {
/** The point at a coordinate is the point whose first coordinate it is. */
it.prop('pointAt_first', { coordinate: Coordinate.Coordinate }, ({ coordinate }) => {
const actual = Point.pointAt(coordinate);
const expected = Option.some(Point.point({ first: coordinate }));
expect(actual).toEqual(expected);
});

/** The points at two equal coordinates are equal. */
it.prop('pointAt_eq', { first: Coordinate.Coordinate, second: Coordinate.Coordinate }, ({ first, second }) => {
if (!Equal.equals(first, second)) {
return;
}
const actual = Point.pointAt(first);
const expected = Point.pointAt(second);
expect(actual).toEqual(expected);
});
});
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← testFileOf `GeneratorTest `GeneratorTest.Fixture.Point `Geometry
    [``Geometry.pointAt_first, ``Geometry.pointAt_eq])
