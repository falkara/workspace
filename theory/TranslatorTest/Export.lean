module

public meta import Lean.Meta.Basic
public meta import Translator.Export
public meta import Translator.Main
import Falkara.Counterpart
import Falkara.Translation.Rules

import all TranslatorTest.Fixture.Clock
import all TranslatorTest.Fixture.Coordinate
import all TranslatorTest.Fixture.Walker

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
-/

public section

namespace Geometry

/-- The structure that the checks re-export. -/
structure Point where
  /-- The first coordinate of the point. -/
  x : Rat

attribute [counterpart
  typescript
    r"The structure that the checks re-export."
    (x
      r"The first coordinate of the point.")
    schema
      r"A schema of the structure that the checks re-export."
    constructor
      r"Brands the structure that the checks re-export without a check."] Point

/-- The function that the checks implement. -/
def pointOf (coordinate : Rat) : Point :=
  ⟨coordinate⟩

attribute [counterpart
  typescript
    r"The function that the checks implement."] pointOf

/-- The value that the checks re-export. -/
def origin : Point :=
  ⟨0⟩

attribute [counterpart
  typescript
    r"The value that the checks re-export."] origin

end Geometry

/-- Gives the names that a module re-exports of the declarations of the core that a declaration of
the theory takes. -/
meta def reexportsOf (name : Lean.Name) : Lean.MetaM (List String) := do
  return (← Translator.declarationsOf `Geometry name).flatMap Translator.reexportsOf

/-- Gives the implementations of the declarations of the core that a declaration of the theory
takes, with the class of functors of the theory. -/
meta def implementationsOf (name : Lean.Name) : Lean.MetaM (List (String × String)) := do
  let functorClass ← (← Translator.Lean.functorClassOf).mapM
    (Translator.Lean.declarationReferenceOf `Geometry)
  return (← Translator.declarationsOf `Geometry name).flatMap
    (Translator.implementationsOf functorClass)

/-- info: (["Point", "point", "origin"], [("pointOf", "/** The function that the checks implement. */\n")]) -/
#guard_msgs in
#eval show Lean.MetaM (List String × List (String × String)) from do
  return ((← reexportsOf ``Geometry.Point) ++
      (← reexportsOf ``Geometry.pointOf) ++
      (← reexportsOf ``Geometry.origin),
    (← implementationsOf ``Geometry.Point) ++
      (← implementationsOf ``Geometry.pointOf) ++
      (← implementationsOf ``Geometry.origin))

/-- info: [] -/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  let refusals := Translator.mismatchesOf "Geometry.ts" "#src/Geometry.theory"
    ("export {\n  Point,\n  point,\n  origin,\n} from '#src/Geometry.theory';\n\n" ++
      "/** The function that the checks implement. */\n\
        export const pointOf = (coordinate: number) => point({ x: coordinate });\n\n" ++
      "export const pointOfOrigin = pointOf(0);\n")
    ["Point", "point", "origin"] (← implementationsOf ``Geometry.pointOf)
  refusals.mapM (·.render.toString)

/--
info: ["Geometry.ts: `point` is missing, which the module re-exports from `#src/Geometry.theory`.",
  "Geometry.ts:4: `export const pointOf: Theory.PointOf = (coordinate) => point({ x: coordinate });` takes the comment of the theory right above it:\n/** The function that the checks implement. */\n"]
-/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  let refusals := Translator.mismatchesOf "Geometry.ts" "#src/Geometry.theory"
    ("export { Point } from '#src/Geometry.theory';\n" ++
      "export { point } from '#src/Geometry.check';\n" ++
      "/** A point. */\n" ++
      "export const pointOf: Theory.PointOf = (coordinate) => point({ x: coordinate });\n")
    ["Point", "point"] (← implementationsOf ``Geometry.pointOf)
  refusals.mapM (·.render.toString)

/--
info: ["Geometry.ts:2: `export const pointOf: Theory.PointOf = (coordinate) => point({ x: coordinate });` takes the comment of the theory right above it:\n/** The function that the checks implement. */\n"]
-/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  let refusals := Translator.mismatchesOf "Geometry.ts" "#src/Geometry.theory"
    ("export { type Point, point } from '#src/Geometry.theory';\n" ++
      "export const pointOf: Theory.PointOf = (coordinate) => point({ x: coordinate });\n")
    ["Point", "point"] (← implementationsOf ``Geometry.pointOf)
  refusals.mapM (·.render.toString)

/--
info: ["Geometry.ts: `export const pointOf` is missing, which the module takes with the comment of the theory right above it:\n/** The function that the checks implement. */\n"]
-/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  let refusals := Translator.mismatchesOf "Geometry.ts" "#src/Geometry.theory"
    "export type { Point } from '#src/Geometry.theory';\n"
    ["Point"] (← implementationsOf ``Geometry.pointOf)
  refusals.mapM (·.render.toString)

/-- info: [] -/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  let refusals := Translator.mismatchesOf "Geometry.ts" "#src/Geometry.theory"
    ("/** The function that the checks implement. */\n" ++
      "export function pointOf(coordinate: number): Point;\n" ++
      "export function pointOf(coordinate: number): Point {\n" ++
      "  return point({ x: coordinate });\n}\n")
    [] (← implementationsOf ``Geometry.pointOf)
  refusals.mapM (·.render.toString)

/-- info: [] -/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  let refusals := Translator.mismatchesOf "Functor.ts" "#src/Functor.theory"
    ("/** Gives the `Functor` instance of a `Functor.Const`. */\n" ++
      "const const_ = () => make({ map: () => Function.identity });\n\n" ++
      "export { const_ as const };\n")
    [] [("const_", "/** Gives the `Functor` instance of a `Functor.Const`. */\n")]
  refusals.mapM (·.render.toString)

/-- info: ["Walker", "make", "StepMove"] -/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  return (← reexportsOf ``Geometry.Walker) ++
    (← reexportsOf ``Geometry.Step.Move)

/--
info: ["Clockwork", "clockwork", "ChimeFunctor", "ChimesFunctor", "DialsFunctor", "Gear", "gear", "gearAxioms", "GearTrain"]
-/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  return (← reexportsOf ``Geometry.Clockwork) ++
    (← reexportsOf ``Geometry.ChimeFunctor) ++
    (← reexportsOf ``Geometry.chimesFunctor) ++
    (← reexportsOf ``Geometry.dialsFunctor) ++
    (← reexportsOf ``Geometry.Gear) ++
    (← reexportsOf ``Geometry.GearTrain)

/--
info: [("chimeFunctor",
    "/** Gives the gear of the functor of the chimes, which maps the next state and keeps the chime. */\n"),
  ("chimesFunctor", "/** Gives the gear of the functor of the chimes at a type of chimes. */\n"),
  ("dialsFunctor", "/** Gives the gear of the functor of the dials at a type of settings. */\n"),
  ("gearTrain", "/** Gives the gear of a gear train from the gears of its driver and its follower. */\n")]
-/
#guard_msgs in
#eval show Lean.MetaM (List (String × String)) from do
  return (← implementationsOf ``Geometry.Clockwork) ++
    (← implementationsOf ``Geometry.ChimeFunctor) ++
    (← implementationsOf ``Geometry.chimesFunctor) ++
    (← implementationsOf ``Geometry.dialsFunctor) ++
    (← implementationsOf ``Geometry.Gear) ++
    (← implementationsOf ``Geometry.GearTrain)
