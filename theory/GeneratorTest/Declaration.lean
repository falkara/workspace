module

meta import Falkara.ExportTypeScript
public import GeneratorTest.Fixture.Clock
public import GeneratorTest.Fixture.Coordinate
meta import Generator.Declaration
import all GeneratorTest.Fixture.Clock
import all Mathlib.CategoryTheory.Endofunctor.Algebra
import all Mathlib.CategoryTheory.Functor.Basic

/-!
# Declaration

The module defines the checks of the declarations of TypeScript that the declarations of the theory
take: a structure takes a branded schema with its fields, the type the schema decodes, and a
constructor that brands a value, a function takes a type of its signature, and a value takes a
constant that holds the value, a rational number as an integer or a quotient and a structure as its
constructor, all named without the namespace of their module and with their documentation
comments. A bundled structure of Mathlib, the clock of the fixture `Clock`, takes an interface with
a type parameter in place of its state space and a function in place of its transition, and the
chiming clock of the fixture takes its chimes as a type parameter before the state space, which
TypeScript reads as covariant, and a pair as a tuple that TypeScript keeps read-only. The clockwork
of the fixture, the coalgebra of Mathlib with its category and its functor as parameters, takes its
category as the category of types and its functor as a type parameter
constrained to a type lambda of Effect, which `HKT.Kind` applies to the state space, and the functor
of the chimes takes an interface that extends the type lambda, with the pair of a chime and the
object of the lambda, `this['Target']`, as its type. A value of
a type with no value in TypeScript, a value of a structure of another module, and a declaration
without the mark `export_typescript` take none.

## Main Definitions

- `Point`: the structure that the checks write.
- `Point.sum`: the function that the checks write, a function of a structure.
- `pointOf`: the function that the checks write.
- `origin`: the rational value that the checks write.
- `corner`: the value of a structure that the checks write.
- `missingCoordinate`: the value that the checks refuse, as an option has no value in TypeScript.
- `unitCoordinate`: the value that the checks refuse, as its structure lies in another module.
- `unmarkedFunction`: the function that the checks leave unmarked.
-/

@[expose] public section

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

/-- The rational value that the checks write. -/
def origin : Rat :=
  0

attribute [export_typescript] origin

/-- The value of a structure that the checks write. -/
def corner : Point :=
  ⟨1 / 2, -3⟩

attribute [export_typescript] corner

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
  IO.print (← (Generator.declarationOf `Geometry ``Geometry.Point).run' [])

/--
info: /** The function that the checks write, a function of a structure. */
export type PointSum = (point: Point) => Rational.Rational;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← (Generator.declarationOf `Geometry ``Geometry.Point.sum).run' [])

/--
info: /** The function that the checks write. */
export type PointOf = (coordinate: Rational.Rational) => Option.Option<Point>;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← (Generator.declarationOf `Geometry ``Geometry.pointOf).run' [])

/--
info: /** The rational value that the checks write. */
export const origin: Rational.Rational = Rational.fromBigInt(0n);
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← (Generator.declarationOf `Geometry ``Geometry.origin).run' [])

/--
info: /** The value of a structure that the checks write. */
export const corner: Point = point({ x: Rational.makeUnsafe(1n, 2n), y: Rational.fromBigInt(-3n) });
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← (Generator.declarationOf `Geometry ``Geometry.corner).run' [])

/-- error: `Geometry.missingCoordinate` has no value in TypeScript, as `Option Rat` has none. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← (Generator.declarationOf `Geometry ``Geometry.missingCoordinate).run' [])

/-- error: `Geometry.unitCoordinate` has no value in TypeScript, as `Geometry.Coordinate` lies in another module, whose constructor the file never imports. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← (Generator.declarationOf `Geometry ``Geometry.unitCoordinate).run' [])

/-- error: `Geometry.unmarkedFunction` has no declaration in TypeScript, as the theory never marks it `export_typescript`. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← (Generator.declarationOf `Geometry ``Geometry.unmarkedFunction).run' [])

/--
info: /** A clock that ticks from every state to its next state. */
export interface Clock<in out V> {
/** structure morphism of the coalgebra */
readonly str: (value: V) => V;
}

/** Creates a clock that ticks from every state to its next state. */
export const clock = <V>(fields: Clock<V>): Clock<V> => fields;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← (Generator.declarationOf `Geometry ``Geometry.Clock).run' [])

/--
info: /** A clock that chimes and ticks from every state to its next state. */
export interface ChimingClock<out B, in out V> {
/** structure morphism of the coalgebra */
readonly str: (value: V) => readonly [B, V];
}

/** Creates a clock that chimes and ticks from every state to its next state. */
export const chimingClock = <B, V>(fields: ChimingClock<B, V>): ChimingClock<B, V> => fields;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← (Generator.declarationOf `Geometry ``Geometry.ChimingClock).run' [])

/--
info: /** A clockwork that moves every state by a functor. */
export interface Clockwork<in out F extends HKT.TypeLambda, in out V> {
/** structure morphism of the coalgebra */
readonly str: (value: V) => HKT.Kind<F, never, never, never, V>;
}

/** Creates a clockwork that moves every state by a functor. */
export const clockwork = <F extends HKT.TypeLambda, V>(fields: Clockwork<F, V>): Clockwork<F, V> => fields;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← (Generator.declarationOf `Geometry ``Geometry.Clockwork).run' [])

/--
info: /** The functor of the chimes, which gives a chime and the next state. */
export interface ChimeFunctor<out B> extends HKT.TypeLambda {
readonly type: readonly [B, this['Target']];
}
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← (Generator.declarationOf `Geometry ``Geometry.ChimeFunctor).run' [])

/--
info: /** The curried functor of the chimes, which maps every type of chimes to the functor of the chimes. */
export interface ChimesFunctor<out X> extends HKT.TypeLambda {
readonly type: readonly [X, this['Target']];
}
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← (Generator.declarationOf `Geometry ``Geometry.chimesFunctor).run' [])

/--
info: /** A gear, a functor that a clockwork moves its states by. */
export interface Gear<in out F extends HKT.TypeLambda> extends HKT.TypeClass<F> {
/** The action of a functor on morphisms. */
readonly map: <X, Y>(a: (value: X) => Y, value: HKT.Kind<F, never, never, never, X>) => HKT.Kind<F, never, never, never, Y>;
}

/** Creates a gear, a functor that a clockwork moves its states by. */
export const gear = <F extends HKT.TypeLambda>(fields: Gear<F>): Gear<F> => fields;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← (Generator.declarationOf `Geometry ``Geometry.Gear).run' [])
