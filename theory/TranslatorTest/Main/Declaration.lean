module

public import TranslatorTest.Fixture.Coordinate

meta import Translator.Main
import Falkara.Counterpart
import Falkara.Translation.Rules

import all TranslatorTest.Fixture.Clock
import all TranslatorTest.Fixture.Lamp
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
constrained to a type lambda of Effect, which `HKT.Kind` applies to the state space and which the
first of the two calls of its constructor takes, and the functor
of the chimes takes an interface that extends the type lambda, with the pair of a chime and the
object of the lambda, `this['Target']`, as its type. The curried functor of the dials, which maps
the opposite of the types, takes a type parameter for a type of settings, which TypeScript reads as
contravariant, and the gear train, a composite of two functors, takes a type parameter for each of
them, which `HKT.Kind` applies one inside the other. The lantern of the fixture `Lamp` takes its
type of lights as the type parameter and its light as the field, with its comment, that the clauses
of the attribute `counterpart` on the lantern give in another module. A function value takes the
name of its type where its type is a type parameter, such as `state` for `State`, and `value`
otherwise. A value of a type with no value in TypeScript, a value of a structure of another module,
and a declaration that the theory never gives a counterpart in TypeScript take none.
-/

public section

namespace Geometry

/-- The structure that the checks write. -/
structure Point where
  /-- The first coordinate of the point. -/
  x : Rat
  /-- The second coordinate of the point. -/
  y : Rat

attribute [counterpart
  typescript
    r"The structure that the checks write."
    (x
      r"The first coordinate of the point.")
    (y
      r"The second coordinate of the point.")
    schema
      r"A schema of the structure that the checks write, which decodes its two coordinates."
    constructor
      r"Brands the structure that the checks write from its two coordinates without a check."]
  Point

/-- The function that the checks write, a function of a structure. -/
def Point.sum (point : Point) : Rat :=
  point.x + point.y

attribute [counterpart
  typescript
    r"The function that the checks write, a function of a structure."] Point.sum

/-- The function that the checks write. -/
def pointOf (coordinate : Rat) : Option Point :=
  some ⟨coordinate, coordinate⟩

attribute [counterpart
  typescript
    r"The function that the checks write."] pointOf

/-- The rational value that the checks write. -/
def origin : Rat :=
  0

attribute [counterpart
  typescript
    r"The rational value that the checks write."] origin

/-- The value of a structure that the checks write. -/
def corner : Point :=
  ⟨1 / 2, -3⟩

attribute [counterpart
  typescript
    r"The value of a structure that the checks write."] corner

/-- The value that the checks refuse, as an option has no value in TypeScript. -/
def missingCoordinate : Option Rat :=
  none

attribute [counterpart
  typescript
    r"The value that the checks refuse, as an option has no value in TypeScript."]
  missingCoordinate

/-- The value that the checks refuse, as its structure lies in another module. -/
def unitCoordinate : Coordinate :=
  ⟨1⟩

attribute [counterpart
  typescript
    r"The value that the checks refuse, as its structure lies in another module."]
  unitCoordinate

/-- The function that the checks leave unmarked. -/
def unmarkedFunction (coordinate : Rat) : Rat :=
  coordinate

end Geometry

/--
info: /** A schema of the structure that the checks write, which decodes its two coordinates. */
export const Point = Schema.Struct({
/** The first coordinate of the point. */
x: Schema.Rational,
/** The second coordinate of the point. */
y: Schema.Rational,
}).pipe(Schema.brand('Point'));

/** The structure that the checks write. */
export type Point = typeof Point.Type;

/** Brands the structure that the checks write from its two coordinates without a check. */
export const point = Brand.nominal<Point>();
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.Point)

/--
info: /** The function that the checks write, a function of a structure. */
export type PointSum = (point: Point) => Rational.Rational;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.Point.sum)

/--
info: /** The function that the checks write. */
export type PointOf = (coordinate: Rational.Rational) => Option.Option<Point>;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.pointOf)

/--
info: /** The rational value that the checks write. */
export const origin: Rational.Rational = Rational.fromBigInt(0n);
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.origin)

/--
info: /** The value of a structure that the checks write. */
export const corner: Point = point({ x: Rational.makeUnsafe(1n, 2n), y: Rational.fromBigInt(-3n) });
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.corner)

/-- error: `Geometry.missingCoordinate` has no value in TypeScript, as `Option Rat` has none. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.missingCoordinate)

/-- error: `Geometry.unitCoordinate` has no value in TypeScript, as `Geometry.Coordinate` lies in another module, whose constructor the file never imports. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.unitCoordinate)

/-- error: `Geometry.unmarkedFunction` has no declaration in TypeScript, as the theory never gives it a counterpart in TypeScript. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.unmarkedFunction)

/--
info: /** A clock that ticks from every state to its next state. */
export interface Clock<in out V> {
/** structure morphism of the coalgebra */
readonly str: (v: V) => V;
}

/** Creates a clock from the function that gives its next state. */
export const make = <V>(fields: Clock<V>) => fields;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.Clock)

/--
info: /** A clock that chimes and ticks from every state to its next state. */
export interface ChimingClock<out B, in out V> {
/** structure morphism of the coalgebra */
readonly str: (v: V) => readonly [B, V];
}

/** Creates a chiming clock from the function that gives its chime and its next state. */
export const chimingClock = <B, V>(fields: ChimingClock<B, V>) => fields;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.ChimingClock)

/--
info: /** A clockwork that moves every state by a functor. */
export interface Clockwork<out F extends HKT.TypeLambda, in out V> {
/** structure morphism of the coalgebra */
readonly str: (v: V) => HKT.Kind<F, never, never, never, V>;
}

/** Creates a clockwork from the function that moves a state by its functor. */
export const clockwork = <F extends HKT.TypeLambda>(_f: Clock.Gear<F>) => <V>(fields: Clockwork<F, V>) => fields;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.Clockwork)

/--
info: /** The functor of the chimes, which gives a chime and the next state. */
export interface ChimeFunctor<out B> extends HKT.TypeLambda {
readonly type: readonly [B, this['Target']];
}
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.ChimeFunctor)

/--
info: /** The curried functor of the chimes, which maps every type of chimes to the functor of the chimes. */
export interface ChimesFunctor<out X> extends HKT.TypeLambda {
readonly type: readonly [X, this['Target']];
}
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.chimesFunctor)

/--
info: /** The curried functor of the dials, which maps every type of settings to the functor that turns a setting into the next state. */
export interface DialsFunctor<in Setting> extends HKT.TypeLambda {
readonly type: (setting: Setting) => this['Target'];
}
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.dialsFunctor)

/--
info: /** A gear, a functor that a clockwork moves its states by. */
export interface Gear<in out Motion extends HKT.TypeLambda> extends HKT.TypeClass<Motion> {
/** The action of a functor on morphisms. */
readonly map: <X, Y>(f: (x: X) => Y) => (value: HKT.Kind<Motion, never, never, never, X>) => HKT.Kind<Motion, never, never, never, Y>;
}

/** Creates a gear from its action on morphisms. */
export const gear = <Motion extends HKT.TypeLambda>(fields: Gear<Motion>) => fields;

/** Gives the axioms of a gear as predicates that tell whether a gear keeps them. */
export const gearAxioms = <Motion extends HKT.TypeLambda>(
instance: Gear<Motion>,
equivalence: <X>(self: HKT.Kind<Motion, never, never, never, X>, that: HKT.Kind<Motion, never, never, never, X>) => boolean,
) => ({
/** A functor preserves identity morphisms. */
map_id: <X>(value: HKT.Kind<Motion, never, never, never, X>): boolean => equivalence<X>((instance.map<X, X>(Function.identity<X>))(value), (Function.identity<HKT.Kind<Motion, never, never, never, X>>)(value)),
/** A functor preserves composition. */
map_comp: <X, Y, Z>(f: (x: X) => Y, g: (y: Y) => Z, value: HKT.Kind<Motion, never, never, never, X>): boolean => equivalence<Z>((instance.map<X, Z>(Function.flow(f, g)))(value), (Function.flow(instance.map<X, Y>(f), instance.map<Y, Z>(g)))(value)),
});
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.Gear)

/--
info: /** A gear train, which moves every state by one gear and then by another. */
export interface GearTrain<in out Driver extends HKT.TypeLambda, out Follower extends HKT.TypeLambda> extends HKT.TypeLambda {
readonly type: HKT.Kind<Follower, never, never, never, HKT.Kind<Driver, never, never, never, this['Target']>>;
}
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.GearTrain)

/--
info: /** A lantern, a lamp that shows a light. */
export interface Lantern<out Shade> {
/** The beam that the lamp casts. */
readonly beam: Shade;
}

/** Creates a lantern from the beam that it casts. */
export const lantern = <Shade>(fields: Lantern<Shade>) => fields;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.declarationOf `Geometry ``Geometry.Lantern)
