module

import all GeneratorTest.Fixture.Coordinate
import all GeneratorTest.Fixture.Point
import all GeneratorTest.Fixture.Walker
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
declarations name no module of Effect.
-/

/--
info: // Written by the generator of the theory from `GeneratorTest.Fixture.Point`, so every change by hand is lost when the generator runs.

import { Brand, type Option, Schema } from 'effect';

import { Coordinate } from '#src/Fixture/Coordinate.theory';
import type * as Module from '#src/Fixture/Point';

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

/** The functions of the theory that the module `Fixture/Point` of the package implements. */
interface Contract {
  /** Gives the point at a coordinate. */
  readonly pointAt: PointAt;
}

/** The module `Fixture/Point` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.fileOf `GeneratorTest `Geometry `GeneratorTest.Fixture.Point)

/--
info: // Written by the generator of the theory from `GeneratorTest.Fixture.Coordinate`, so every change by hand is lost when the generator runs.

import { Brand, Rational, Schema } from 'effect';

/** A schema of a coordinate of a point. */
export const Coordinate = Schema.Struct({
  /** The value of the coordinate. */
  value: Schema.Rational,
}).pipe(Schema.brand('Coordinate'));

/** A coordinate of a point. */
export type Coordinate = typeof Coordinate.Type;

/** Brands without a check a coordinate of a point. */
export const coordinate = Brand.nominal<Coordinate>();

/** The coordinate whose value is 1. */
export const unit: Coordinate = coordinate({ value: Rational.fromBigInt(1n) });
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.fileOf `GeneratorTest `Geometry `GeneratorTest.Fixture.Coordinate)

/--
info: // Written by the generator of the theory from `GeneratorTest.Fixture.Walker`, so every change by hand is lost when the generator runs.

import type { Coordinate } from '#src/Fixture/Coordinate.theory';
import type * as Module from '#src/Fixture/Walker';

/** A step of a walk, the state it reaches and the trace it leaves. */
export interface Step<out State, out Trace> {
  /** The state the step reaches. */
  readonly state: State;
  /** The trace the step leaves. */
  readonly trace: Trace;
}

/** Creates a step of a walk, the state it reaches and the trace it leaves. */
export const step = <State, Trace>(fields: Step<State, Trace>): Step<State, Trace> => fields;

/** A function that gives the step from a state upon an input. */
export type StepMove<in out State, in Input, out Trace> = (
  currentState: State,
  input: Input,
) => Step<State, Trace>;

/** A walker that takes a step upon every input. */
export interface Walker<in out State, in Input, out Trace> {
  /** The function that gives the step of the walker from a state upon an input. */
  readonly move: StepMove<State, Input, Trace>;
}

/** Creates a walker that takes a step upon every input. */
export const walker = <State, Input, Trace>(
  fields: Walker<State, Input, Trace>,
): Walker<State, Input, Trace> => fields;

/** Gives the state a walker reaches from a state upon an input. */
export type WalkerNext = <State, Input, Trace>(
  walker: Walker<State, Input, Trace>,
  state: State,
  input: Input,
) => State;

/** A course that turns every coordinate into another. */
export interface Course {
  /** The function that gives the coordinate the course turns a coordinate into. */
  readonly turn: (coordinate: Coordinate) => Coordinate;
}

/** Creates a course that turns every coordinate into another. */
export const course = (fields: Course): Course => fields;

/** The functions of the theory that the module `Fixture/Walker` of the package implements. */
interface Contract {
  /** Gives the state a walker reaches from a state upon an input. */
  readonly walkerNext: WalkerNext;
}

/** The module `Fixture/Walker` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.fileOf `GeneratorTest `Geometry `GeneratorTest.Fixture.Walker)
