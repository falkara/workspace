module

import all GeneratorTest.Fixture.Bell
import all GeneratorTest.Fixture.Clock
import all GeneratorTest.Fixture.Coordinate
import all GeneratorTest.Fixture.Point
import all GeneratorTest.Fixture.Walker
import all Mathlib.CategoryTheory.Endofunctor.Algebra
import all Mathlib.CategoryTheory.Functor.Basic
meta import Generator.Main

/-!
# Main

The module defines the checks of the files that the generator writes for the modules of the theory.
A module whose structure names a structure of another module imports that structure as a value, as
its schema names the schema of the other, imports from Effect only the modules its declarations
name, and ends with the contract of its functions. A module with no function and no structure of
another module imports nothing beyond Effect and ends with no contract, and a module with a value
imports from Effect the module whose function writes the value as a value. A module whose
structures take type parameters or a function writes them as interfaces, imports the structure of
another module that an interface names as a type, and imports nothing from Effect where its
declarations name no module of Effect. A module with functors ends with a contract that takes an
instance of its class of functors for every functor, a function of the type parameters of the
functor and of an instance of every functor among them. A module whose bundled structure applies a
functor of another module to a structure that the theory labels extends the label at the functor
and imports both as types from their module, and its function of a bundled structure and a state
takes a type parameter for the state space and a stream of Effect for a stream of Mathlib.
-/

/--
info: // Written by the generator of the theory from `GeneratorTest.Fixture.Point`, so every change by hand is lost when the generator runs.
import { Brand, type Option, Schema } from 'effect';

import * as Coordinate from '#src/Fixture/Coordinate.theory';
import type * as Module from '#src/Fixture/Point';

/** A schema of a point by its first coordinate. */
export const Point = Schema.Struct({
/** The first coordinate of the point. */
first: Coordinate.Coordinate,
}).pipe(Schema.brand('Point'));

/** A point by its first coordinate. */
export type Point = typeof Point.Type;

/** Brands a `Point` from its field `first` without a check. */
export const make = Brand.nominal<Point>();

/** Gives the point at a coordinate. */
export type PointAt = (coordinate: Coordinate.Coordinate) => Option.Option<Point>;

/** A contract of the functions of the theory that the module `Fixture/Point` of the package implements. */
interface Contract {
/** Gives the point at a coordinate. */
readonly pointAt: PointAt;
}

/** A check of the module `Fixture/Point` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.fileOf `GeneratorTest `Geometry `GeneratorTest.Fixture.Point)

/--
info: // Written by the generator of the theory from `GeneratorTest.Fixture.Coordinate`, so every change by hand is lost when the generator runs.
import { Brand, Rational, Schema } from 'effect';

import type * as Module from '#src/Fixture/Coordinate';

/** A schema of a coordinate of a point. */
export const Coordinate = Schema.Struct({
/** The value of the coordinate. */
value: Schema.Rational,
}).pipe(Schema.brand('Coordinate'));

/** A coordinate of a point. */
export type Coordinate = typeof Coordinate.Type;

/** Brands a `Coordinate` from its field `value` without a check. */
export const make = Brand.nominal<Coordinate>();

/** The coordinate whose value is 1. */
export const unit: Coordinate = make({ value: Rational.fromBigInt(1n) });

/** The coordinate shifted by an offset. */
export interface Shift {
(coordinate: Coordinate, offset: Rational.Rational): Coordinate;
(offset: Rational.Rational): (coordinate: Coordinate) => Coordinate;
}

/** A contract of the functions of the theory that the module `Fixture/Coordinate` of the package implements. */
interface Contract {
/** The coordinate shifted by an offset. */
readonly shift: Shift;
}

/** A check of the module `Fixture/Coordinate` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.fileOf `GeneratorTest `Geometry `GeneratorTest.Fixture.Coordinate)

/--
info: // Written by the generator of the theory from `GeneratorTest.Fixture.Walker`, so every change by hand is lost when the generator runs.
import type * as Coordinate from '#src/Fixture/Coordinate.theory';
import type * as Module from '#src/Fixture/Walker';

/** A step of a walk, the state it reaches and the trace it leaves. */
export interface Step<out State, out Trace> {
/** The state the step reaches. */
readonly state: State;
/** The trace the step leaves. */
readonly trace: Trace;
}

/** Creates a `Step` from its fields `state` and `trace`. */
export const step = <State, Trace>(fields: Step<State, Trace>) => fields;

/** A function that gives the step from a state upon an input. */
export type StepMove<in out State, in Input, out Trace> = (currentState: State, input: Input) => Step<State, Trace>;

/** A walker that takes a step upon every input. */
export interface Walker<in out State, in Input, out Trace> {
/** The function that gives the step of the walker from a state upon an input. */
readonly move: StepMove<State, Input, Trace>;
}

/** Creates a `Walker` from its field `move`. */
export const make = <State, Input, Trace>(fields: Walker<State, Input, Trace>) => fields;

/** Gives the state a walker reaches from a state upon an input. */
export type Next = <State, Input, Trace>(walker: Walker<State, Input, Trace>, state: State, input: Input) => State;

/** A course that turns every coordinate into another. */
export interface Course {
/** The function that gives the coordinate the course turns a coordinate into. */
readonly turn: (coordinate: Coordinate.Coordinate) => Coordinate.Coordinate;
}

/** Creates a `Course` from its field `turn`. */
export const course = (fields: Course) => fields;

/** A contract of the functions of the theory that the module `Fixture/Walker` of the package implements. */
interface Contract {
/** Gives the state a walker reaches from a state upon an input. */
readonly next: Next;
}

/** A check of the module `Fixture/Walker` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.fileOf `GeneratorTest `Geometry `GeneratorTest.Fixture.Walker)

/--
info: // Written by the generator of the theory from `GeneratorTest.Fixture.Clock`, so every change by hand is lost when the generator runs.
import { Function, type HKT } from 'effect';

import type * as Module from '#src/Fixture/Clock';

/** A clock that ticks from every state to its next state. */
export interface Clock<in out V> {
/** structure morphism of the coalgebra */
readonly str: (v: V) => V;
}

/** Creates a `Clock` from its field `str`. */
export const make = <V>(fields: Clock<V>) => fields;

/** A clock that chimes and ticks from every state to its next state. */
export interface ChimingClock<out B, in out V> {
/** structure morphism of the coalgebra */
readonly str: (v: V) => readonly [B, V];
}

/** Creates a `ChimingClock` from its field `str`. */
export const chimingClock = <B, V>(fields: ChimingClock<B, V>) => fields;

/** A clockwork that moves every state by a functor. */
export interface Clockwork<out F extends HKT.TypeLambda, in out V> {
/** structure morphism of the coalgebra */
readonly str: (v: V) => HKT.Kind<F, never, never, never, V>;
}

/** Creates a `Clockwork` from its field `str`. */
export const clockwork = <F extends HKT.TypeLambda, V>(fields: Clockwork<F, V>) => fields;

/** The functor of the chimes, which gives a chime and the next state. */
export interface ChimeFunctor<out B> extends HKT.TypeLambda {
readonly type: readonly [B, this['Target']];
}

/** The curried functor of the chimes, which maps every type of chimes to the functor of the chimes. */
export interface ChimesFunctor<out X> extends HKT.TypeLambda {
readonly type: readonly [X, this['Target']];
}

/** The curried functor of the dials, which maps every type of settings to the functor that turns a setting into the next state. */
export interface DialsFunctor<in Setting> extends HKT.TypeLambda {
readonly type: (setting: Setting) => this['Target'];
}

/** A gear, a functor that a clockwork moves its states by. */
export interface Gear<in out Motion extends HKT.TypeLambda> extends HKT.TypeClass<Motion> {
/** The action of a functor on morphisms. */
readonly map: <X, Y>(f: (x: X) => Y) => (value: HKT.Kind<Motion, never, never, never, X>) => HKT.Kind<Motion, never, never, never, Y>;
}

/** Creates a `Gear` from its field `map`. */
export const gear = <Motion extends HKT.TypeLambda>(fields: Gear<Motion>) => fields;

/** Gives the axioms of a `Gear` as predicates of an instance. */
export const gearAxioms = <Motion extends HKT.TypeLambda>(
instance: Gear<Motion>,
equivalence: <X>(self: HKT.Kind<Motion, never, never, never, X>, that: HKT.Kind<Motion, never, never, never, X>) => boolean,
) => ({
/** A functor preserves identity morphisms. */
map_id: <X>(value: HKT.Kind<Motion, never, never, never, X>): boolean => equivalence<X>((instance.map<X, X>(Function.identity<X>))(value), (Function.identity<HKT.Kind<Motion, never, never, never, X>>)(value)),
/** A functor preserves composition. */
map_comp: <X, Y, Z>(f: (x: X) => Y, g: (y: Y) => Z, value: HKT.Kind<Motion, never, never, never, X>): boolean => equivalence<Z>((instance.map<X, Z>(Function.flow(f, g)))(value), (Function.flow(instance.map<X, Y>(f), instance.map<Y, Z>(g)))(value)),
});

/** A gear train, which moves every state by one gear and then by another. */
export interface GearTrain<in out Driver extends HKT.TypeLambda, out Follower extends HKT.TypeLambda> extends HKT.TypeLambda {
readonly type: HKT.Kind<Follower, never, never, never, HKT.Kind<Driver, never, never, never, this['Target']>>;
}

/** A contract of the functions of the theory that the module `Fixture/Clock` of the package implements. */
interface Contract {
/** Gives the `Gear` instance of a `ChimeFunctor`. */
readonly chimeFunctor: <B>() => Gear<ChimeFunctor<B>>;
/** Gives the `Gear` instance of a `ChimesFunctor`. */
readonly chimesFunctor: <X>() => Gear<ChimesFunctor<X>>;
/** Gives the `Gear` instance of a `DialsFunctor`. */
readonly dialsFunctor: <Setting>() => Gear<DialsFunctor<Setting>>;
/** Gives the `Gear` instance of a `GearTrain`. */
readonly gearTrain: <Driver extends HKT.TypeLambda, Follower extends HKT.TypeLambda>(driver: Gear<Driver>, follower: Gear<Follower>) => Gear<GearTrain<Driver, Follower>>;
}

/** A check of the module `Fixture/Clock` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.fileOf `GeneratorTest `Geometry `GeneratorTest.Fixture.Clock)

/--
info: // Written by the generator of the theory from `GeneratorTest.Fixture.Bell`, so every change by hand is lost when the generator runs.
import type { Stream } from 'effect';

import type * as Module from '#src/Fixture/Bell';
import type * as Clock from '#src/Fixture/Clock.theory';

/** A bell that rings a chime and moves to its next state. */
export interface Bell<out B, in out V> extends Clock.Clockwork<Clock.ChimesFunctor<B>, V> {}

/** Creates a `Bell` from its field `str`. */
export const make = <B, V>(fields: Bell<B, V>) => fields;

/** The peal of a bell, the stream of the chimes that it rings from a state on. */
export type Peal = <B, V>(bell: Bell<B, V>, state: V) => Stream.Stream<B>;

/** The answer of a bell to the chimes it hears, every chime it hears with the chime it rings. */
export interface Answer {
<B, V, E = never, R = never>(bell: Bell<B, V>, state: V, heard: Stream.Stream<B, E, R>): Stream.Stream<readonly [B, B], E, R>;
<B, V>(bell: Bell<B, V>, state: V): <E = never, R = never>(heard: Stream.Stream<B, E, R>) => Stream.Stream<readonly [B, B], E, R>;
}

/** A contract of the functions of the theory that the module `Fixture/Bell` of the package implements. */
interface Contract {
/** The peal of a bell, the stream of the chimes that it rings from a state on. */
readonly peal: Peal;
/** The answer of a bell to the chimes it hears, every chime it hears with the chime it rings. */
readonly answer: Answer;
}

/** A check of the module `Fixture/Bell` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.fileOf `GeneratorTest `Geometry `GeneratorTest.Fixture.Bell)
