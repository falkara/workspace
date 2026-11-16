import Generator.Theorem
import Test.Generator.Fixture.Point

/-!
# Theorem

The module defines the checks of the tests of TypeScript that the theorems of the theory take. The layout of an expression is checked against the layout oxfmt gives it: a call too long for its line takes every argument on a line of its own, a call whose only argument is an object takes the fields on lines of their own, and an object too long for its line takes every field on a line of its own. The file of tests of a module is checked whole: a theorem with a constructor and an option takes a property test on the line of its call, and a theorem with a hypothesis takes a property test that skips the values breaking the hypothesis, with its arguments on lines of their own.
-/

open Generator

/--
info: Tristimulus.tristimulusScale(
        Tristimulus.tristimulusAdd(first, second),
        factor,
      )
-/
#guard_msgs in
#eval IO.println (Script.render (.call "Tristimulus.tristimulusScale"
  [.call "Tristimulus.tristimulusAdd" [.atom "first", .atom "second"], .atom "factor"]) 6 21 1)

/--
info: Tristimulus.tristimulus({
      X: Rational.sum(a, a),
      Y: Rational.multiply(a, Rational.fromBigInt(2n)),
      Z: Rational.subtract(a, a),
    })
-/
#guard_msgs in
#eval IO.println (Script.render (.call "Tristimulus.tristimulus" [.object [
  ("X", .call "Rational.sum" [.atom "a", .atom "a"]),
  ("Y", .call "Rational.multiply" [.atom "a", .call "Rational.fromBigInt" [.atom "2n"]]),
  ("Z", .call "Rational.subtract" [.atom "a", .atom "a"])]]) 4 19 1)

/--
info: {
      first: Tristimulus.Tristimulus,
      second: Tristimulus.Tristimulus,
      third: Tristimulus.Tristimulus,
    }
-/
#guard_msgs in
#eval IO.println (Script.render (.object [("first", .atom "Tristimulus.Tristimulus"),
  ("second", .atom "Tristimulus.Tristimulus"), ("third", .atom "Tristimulus.Tristimulus")]) 4 4 1)

/--
info: // Written by the generator of Falkara Theory from `Test.Generator.Fixture.Point`, so every change by hand is lost when the generator runs.

import { describe, expect, it } from '@effect/vitest';
import { Equal, Option } from 'effect';

import * as Coordinate from '#src/Test/Generator/Fixture/Coordinate';
import * as Point from '#src/Test/Generator/Fixture/Point';

describe('Test/Generator/Fixture/Point', () => {
  /** The point at a coordinate is the point whose first coordinate it is. */
  it.prop('pointAt_first', { coordinate: Coordinate.Coordinate }, ({ coordinate }) => {
    const actual = Point.pointAt(coordinate);
    const expected = Option.some(Point.point({ first: coordinate }));
    expect(actual).toEqual(expected);
  });

  /** The points at two equal coordinates are equal. */
  it.prop(
    'pointAt_eq',
    { first: Coordinate.Coordinate, second: Coordinate.Coordinate },
    ({ first, second }) => {
      if (!Equal.equals(first, second)) {
        return;
      }
      const actual = Point.pointAt(first);
      const expected = Point.pointAt(second);
      expect(actual).toEqual(expected);
    },
  );
});
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← testFileOf `Test.Generator.Fixture.Point `Geometry [``Geometry.pointAt_first, ``Geometry.pointAt_eq])
