module

meta import Translator.Main
import Falkara.Translation.Rules

import all TranslatorTest.Fixture.Bell
import all TranslatorTest.Fixture.Carillon
import all TranslatorTest.Fixture.Clock
import all TranslatorTest.Fixture.Coordinate
import all TranslatorTest.Fixture.Point
import all TranslatorTest.Fixture.Walker
import all Mathlib.CategoryTheory.Endofunctor.Algebra
import all Mathlib.CategoryTheory.Functor.Basic

/-!
# Main

The module defines the checks of the files that the translator writes for the modules of the theory.
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
takes a type parameter for the state space and a stream of Effect for a stream of Mathlib. A module
whose bundled structure takes a type constructor as a parameter with a default value writes the
parameter as a type lambda after the state space, with the type lambda of the identity functor for
the identity monad as its default, and a constructor at the default, and writes a type constructor
of an effect as the type lambda of an effect of Effect, whose instance the contract takes as that
of a functor. Its function of two bundled structures
names their state spaces after their parameters, gives its result the state space its definition
gives, and takes as well the signature without its first parameter, whose function takes the type
parameters that the first parameter alone names, and its stream of coproducts holds results of
Effect.
-/

/--
info: // Written by the translator from `TranslatorTest.Fixture.Point`, so every change by hand is lost when the translator runs.
import { Brand, type Option, Schema } from 'effect';

import * as Coordinate from '#src/Fixture/Coordinate.theory';
import type * as Module from '#src/Fixture/Point';

/** A schema of a point, which decodes its first coordinate. */
export const Point = Schema.Struct({
/** The first coordinate of the point. */
first: Coordinate.Coordinate,
}).pipe(Schema.brand('Point'));

/** A point by its first coordinate. */
export type Point = typeof Point.Type;

/** Brands a point from its first coordinate without a check. */
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
  IO.print (← Translator.fileOf `TranslatorTest `Geometry `TranslatorTest.Fixture.Point)

/--
info: // Written by the translator from `TranslatorTest.Fixture.Coordinate`, so every change by hand is lost when the translator runs.
import { Brand, Rational, Schema } from 'effect';

import type * as Module from '#src/Fixture/Coordinate';

/** A schema of a coordinate of a point, which decodes its value. */
export const Coordinate = Schema.Struct({
/** The value of the coordinate. */
value: Schema.Rational,
}).pipe(Schema.brand('Coordinate'));

/** A coordinate of a point. */
export type Coordinate = typeof Coordinate.Type;

/** Brands a coordinate from its value without a check. */
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
  IO.print (← Translator.fileOf `TranslatorTest `Geometry `TranslatorTest.Fixture.Coordinate)

/--
info: // Written by the translator from `TranslatorTest.Fixture.Walker`, so every change by hand is lost when the translator runs.
import type * as Coordinate from '#src/Fixture/Coordinate.theory';
import type * as Module from '#src/Fixture/Walker';

/** A step of a walk, the state it reaches and the trace it leaves. */
export interface Step<out State, out Trace> {
/** The state the step reaches. */
readonly state: State;
/** The trace the step leaves. */
readonly trace: Trace;
}

/** Creates a step from the state it reaches and the trace it leaves. */
export const step = <State, Trace>(fields: Step<State, Trace>) => fields;

/** A function that gives the step from a state upon an input. */
export type StepMove<in out State, in Input, out Trace> = (currentState: State, input: Input) => Step<State, Trace>;

/** A walker that takes a step upon every input. */
export interface Walker<in out State, in Input, out Trace> {
/** The function that gives the step of the walker from a state upon an input. */
readonly move: StepMove<State, Input, Trace>;
}

/** Creates a walker from the function that gives its step. */
export const make = <State, Input, Trace>(fields: Walker<State, Input, Trace>) => fields;

/** Gives the state a walker reaches from a state upon an input. */
export type Next = <State, Input, Trace>(walker: Walker<State, Input, Trace>, state: State, input: Input) => State;

/** A course that turns every coordinate into another. */
export interface Course {
/** The function that gives the coordinate the course turns a coordinate into. */
readonly turn: (coordinate: Coordinate.Coordinate) => Coordinate.Coordinate;
}

/** Creates a course from the function that turns a coordinate. */
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
  IO.print (← Translator.fileOf `TranslatorTest `Geometry `TranslatorTest.Fixture.Walker)

/--
info: // Written by the translator from `TranslatorTest.Fixture.Clock`, so every change by hand is lost when the translator runs.
import { Function, type HKT } from 'effect';

import type * as Module from '#src/Fixture/Clock';

/** A clock that ticks from every state to its next state. */
export interface Clock<in out V> {
/** structure morphism of the coalgebra */
readonly str: (v: V) => V;
}

/** Creates a clock from the function that gives its next state. */
export const make = <V>(fields: Clock<V>) => fields;

/** A clock that chimes and ticks from every state to its next state. */
export interface ChimingClock<out B, in out V> {
/** structure morphism of the coalgebra */
readonly str: (v: V) => readonly [B, V];
}

/** Creates a chiming clock from the function that gives its chime and its next state. */
export const chimingClock = <B, V>(fields: ChimingClock<B, V>) => fields;

/** A clockwork that moves every state by a functor. */
export interface Clockwork<out F extends HKT.TypeLambda, in out V> {
/** structure morphism of the coalgebra */
readonly str: (v: V) => HKT.Kind<F, never, never, never, V>;
}

/** Creates a clockwork from the function that moves a state by its functor. */
export const clockwork = <F extends HKT.TypeLambda>(_f: Gear<F>) => <V>(fields: Clockwork<F, V>) => fields;

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

/** A gear train, which moves every state by one gear and then by another. */
export interface GearTrain<in out Driver extends HKT.TypeLambda, out Follower extends HKT.TypeLambda> extends HKT.TypeLambda {
readonly type: HKT.Kind<Follower, never, never, never, HKT.Kind<Driver, never, never, never, this['Target']>>;
}

/** A contract of the functions of the theory that the module `Fixture/Clock` of the package implements. */
interface Contract {
/** Gives the gear of the functor of the chimes, which maps the next state and keeps the chime. */
readonly chimeFunctor: <B>() => Gear<ChimeFunctor<B>>;
/** Gives the gear of the functor of the chimes at a type of chimes. */
readonly chimesFunctor: <X>() => Gear<ChimesFunctor<X>>;
/** Gives the gear of the functor of the dials at a type of settings. */
readonly dialsFunctor: <Setting>() => Gear<DialsFunctor<Setting>>;
/** Gives the gear of a gear train from the gears of its driver and its follower. */
readonly gearTrain: <Driver extends HKT.TypeLambda, Follower extends HKT.TypeLambda>(driver: Gear<Driver>, follower: Gear<Follower>) => Gear<GearTrain<Driver, Follower>>;
}

/** A check of the module `Fixture/Clock` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.fileOf `TranslatorTest `Geometry `TranslatorTest.Fixture.Clock)

/--
info: // Written by the translator from `TranslatorTest.Fixture.Bell`, so every change by hand is lost when the translator runs.
import type { Stream } from 'effect';

import type * as Module from '#src/Fixture/Bell';
import type * as Clock from '#src/Fixture/Clock.theory';

/** A bell that rings a chime and moves to its next state. */
export interface Bell<out B, in out V> extends Clock.Clockwork<Clock.ChimesFunctor<B>, V> {
/** structure morphism of the coalgebra */
readonly str: (v: V) => readonly [B, V];
}

/** Creates a bell from the function that gives its chime and its next state. */
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
  IO.print (← Translator.fileOf `TranslatorTest `Geometry `TranslatorTest.Fixture.Bell)

/--
info: // Written by the translator from `TranslatorTest.Fixture.Carillon`, so every change by hand is lost when the translator runs.
import type { Effect, HKT, Result, Stream } from 'effect';

import type * as Module from '#src/Fixture/Carillon';
import type * as Clock from '#src/Fixture/Clock.theory';

/** The resting functor, which moves no state. */
export interface RestingFunctor extends HKT.TypeLambda {
readonly type: this['Target'];
}

/** A belfry, the monad of the peals that read a rope of type `R` and either fail with a crack of type `E` or ring. */
export interface Belfry<out E, out R> extends HKT.TypeLambda {
readonly type: Effect.Effect<this['Target'], E, R>;
}

/** A carillon that rings a chime and moves to its next state in a monad. */
export interface Carillon<in out B, in out V, out m extends HKT.TypeLambda = RestingFunctor> extends Clock.Clockwork<Clock.GearTrain<Clock.ChimesFunctor<B>, m>, V> {
/** structure morphism of the coalgebra */
readonly str: (v: V) => HKT.Kind<m, never, never, never, readonly [B, V]>;
}

/** Creates a carillon that rings at once from the function that gives its chime and its next state. */
export const make = <B, V>(fields: Carillon<B, V>) => fields;

/** The rounds of a carillon, every chime that it rings with the next state. */
export type Rounds = <B, V>(carillon: Carillon<B, V>, state: V) => Stream.Stream<readonly [B, V]>;

/** The carillon that rings two carillons side by side and keeps the chime of the first after a choice, upon the pairs of their states. */
export interface Pair {
<B, FirstV, SecondV>(first: Carillon<B, FirstV>, second: Carillon<B, SecondV>, choice: (chime: B) => B): Carillon<B, readonly [FirstV, SecondV]>;
<B, SecondV>(second: Carillon<B, SecondV>, choice: (chime: B) => B): <FirstV>(first: Carillon<B, FirstV>) => Carillon<B, readonly [FirstV, SecondV]>;
}

/** The tolls of a carillon, a pause before every chime that it rings. */
export type Tolls = <B, V>(carillon: Carillon<B, V>, state: V) => Stream.Stream<Result.Result<B, void>>;

/** A contract of the functions of the theory that the module `Fixture/Carillon` of the package implements. */
interface Contract {
/** The rounds of a carillon, every chime that it rings with the next state. */
readonly rounds: Rounds;
/** The carillon that rings two carillons side by side and keeps the chime of the first after a choice, upon the pairs of their states. */
readonly pair: Pair;
/** The tolls of a carillon, a pause before every chime that it rings. */
readonly tolls: Tolls;
/** Gives the gear of the resting functor, which maps every state as it is. */
readonly restingFunctor: () => Clock.Gear<RestingFunctor>;
/** Gives the gear of a belfry, which maps the chime that a peal rings. */
readonly belfry: <E, R>() => Clock.Gear<Belfry<E, R>>;
}

/** A check of the module `Fixture/Carillon` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Translator.fileOf `TranslatorTest `Geometry `TranslatorTest.Fixture.Carillon)
