module

meta import Falkara.ExportTypeScript
public import GeneratorTest.Fixture.Walker
import all GeneratorTest.Fixture.Clock
import all GeneratorTest.Fixture.Coordinate
import all GeneratorTest.Fixture.Walker
meta import Generator.Export

/-!
# Export

The module defines the checks of what a module of TypeScript exports of the theory: a structure is
re-exported as its schema and type and its constructor, a structure that takes an interface and a
bundled structure as their types and constructors, a type, a functor, and a curried functor as
their types, a class of functors as its type, its factory, and the predicates of its axioms, and a
value as itself, while a functor and a curried functor implement their instances and a function is
implemented under its name, each with the comment of the theory. The check gives no reason for a
module that re-exports every name, even in a statement that breaks over lines, and implements every
function with the comment of the theory, even beside a name that merely opens with the name of a
function, and a reason for a name that the module re-exports from another module alone, an
implementation whose comment differs, one with no comment, and one that is missing.

## Main Definitions

- `Point`: the structure that the checks re-export.
- `pointOf`: the function that the checks implement.
- `origin`: the value that the checks re-export.
-/

@[expose] public section

namespace Geometry

/-- The structure that the checks re-export. -/
structure Point where
  /-- The first coordinate of the point. -/
  x : Rat

attribute [export_typescript] Point

/-- The function that the checks implement. -/
def pointOf (coordinate : Rat) : Point :=
  ⟨coordinate⟩

attribute [export_typescript] pointOf

/-- The value that the checks re-export. -/
def origin : Point :=
  ⟨0⟩

attribute [export_typescript] origin

end Geometry

/-- info: (["Point", "point", "origin"], [("export const pointOf", "/** The function that the checks implement. */\n")]) -/
#guard_msgs in
#eval show Lean.MetaM (List String × List (String × String)) from do
  return ((← Generator.reexportsOf `Geometry ``Geometry.Point) ++
      (← Generator.reexportsOf `Geometry ``Geometry.pointOf) ++
      (← Generator.reexportsOf `Geometry ``Geometry.origin),
    (← Generator.implementationsOf `Geometry ``Geometry.Point) ++
      (← Generator.implementationsOf `Geometry ``Geometry.pointOf) ++
      (← Generator.implementationsOf `Geometry ``Geometry.origin))

/-- info: [] -/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  return Generator.mismatchesOf "Geometry.ts" "#src/Geometry.theory"
    ("export {\n  Point,\n  point,\n  origin,\n} from '#src/Geometry.theory';\n\n" ++
      "/** The function that the checks implement. */\n\
        export const pointOf = (coordinate: number) => point({ x: coordinate });\n\n" ++
      "export const pointOfOrigin = pointOf(0);\n")
    ["Point", "point", "origin"] (← Generator.implementationsOf `Geometry ``Geometry.pointOf)

/--
info: ["Geometry.ts: `point` is missing, which the module re-exports from `#src/Geometry.theory`.",
  "Geometry.ts:4: `export const pointOf: Theory.PointOf = (coordinate) => point({ x: coordinate });` takes the comment of the theory right above it:\n/** The function that the checks implement. */\n"]
-/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  return Generator.mismatchesOf "Geometry.ts" "#src/Geometry.theory"
    ("export { Point } from '#src/Geometry.theory';\n" ++
      "export { point } from '#src/Geometry.check';\n" ++
      "/** A point. */\n" ++
      "export const pointOf: Theory.PointOf = (coordinate) => point({ x: coordinate });\n")
    ["Point", "point"] (← Generator.implementationsOf `Geometry ``Geometry.pointOf)

/--
info: ["Geometry.ts:2: `export const pointOf: Theory.PointOf = (coordinate) => point({ x: coordinate });` takes the comment of the theory right above it:\n/** The function that the checks implement. */\n"]
-/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  return Generator.mismatchesOf "Geometry.ts" "#src/Geometry.theory"
    ("export { type Point, point } from '#src/Geometry.theory';\n" ++
      "export const pointOf: Theory.PointOf = (coordinate) => point({ x: coordinate });\n")
    ["Point", "point"] (← Generator.implementationsOf `Geometry ``Geometry.pointOf)

/--
info: ["Geometry.ts: `export const pointOf` is missing, which the module takes with the comment of the theory right above it:\n/** The function that the checks implement. */\n"]
-/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  return Generator.mismatchesOf "Geometry.ts" "#src/Geometry.theory"
    "export type { Point } from '#src/Geometry.theory';\n"
    ["Point"] (← Generator.implementationsOf `Geometry ``Geometry.pointOf)

/-- info: ["Walker", "walker", "StepMove"] -/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  return (← Generator.reexportsOf `Geometry ``Geometry.Walker) ++
    (← Generator.reexportsOf `Geometry ``Geometry.Step.Move)

/--
info: ["Clockwork", "clockwork", "ChimeFunctor", "ChimesFunctor", "DialsFunctor", "Gear", "gear", "gearAxioms", "GearTrain"]
-/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  return (← Generator.reexportsOf `Geometry ``Geometry.Clockwork) ++
    (← Generator.reexportsOf `Geometry ``Geometry.ChimeFunctor) ++
    (← Generator.reexportsOf `Geometry ``Geometry.chimesFunctor) ++
    (← Generator.reexportsOf `Geometry ``Geometry.dialsFunctor) ++
    (← Generator.reexportsOf `Geometry ``Geometry.Gear) ++
    (← Generator.reexportsOf `Geometry ``Geometry.GearTrain)

/--
info: [("export const chimeFunctor", "/** Gives the functor of the chimes, which gives a chime and the next state. */\n"),
  ("export const chimesFunctor",
    "/** Gives the curried functor of the chimes, which maps every type of chimes to the functor of the chimes. */\n"),
  ("export const dialsFunctor",
    "/** Gives the curried functor of the dials, which maps every type of settings to the functor that turns a setting into the next state. */\n"),
  ("export const gearTrain", "/** Gives a gear train, which moves every state by one gear and then by another. */\n")]
-/
#guard_msgs in
#eval show Lean.MetaM (List (String × String)) from do
  return (← Generator.implementationsOf `Geometry ``Geometry.Clockwork) ++
    (← Generator.implementationsOf `Geometry ``Geometry.ChimeFunctor) ++
    (← Generator.implementationsOf `Geometry ``Geometry.chimesFunctor) ++
    (← Generator.implementationsOf `Geometry ``Geometry.dialsFunctor) ++
    (← Generator.implementationsOf `Geometry ``Geometry.Gear) ++
    (← Generator.implementationsOf `Geometry ``Geometry.GearTrain)
