import Generator.Redeclaration

/-!
# Redeclaration

The module defines the checks of the redeclarations in a module of TypeScript: a structure is redeclared as its schema, its type, and its constructor, a value is redeclared from the generated module, and a function is implemented under its name, each with the comment of the theory. The check gives no reason for a module that holds every redeclaration with the comment of the theory, even beside a name that merely opens with the name of a function, and a reason for a redeclaration that is missing, a comment that differs, and a redeclaration with no comment.
-/

namespace Geometry

/-- The structure that the checks redeclare. -/
structure Point where
  /-- The first coordinate of the point. -/
  x : Rat

attribute [export_typescript] Point

/-- The function that the checks implement. -/
def pointOf (coordinate : Rat) : Point :=
  ⟨coordinate⟩

attribute [export_typescript] pointOf

/-- The value that the checks redeclare. -/
def origin : Point :=
  ⟨0⟩

attribute [export_typescript] origin

end Geometry

/-- info: [("export const origin = Theory.origin;", "/** The value that the checks redeclare. */\n")] -/
#guard_msgs in
#eval show Lean.MetaM (List (String × String)) from do
  Generator.redeclarationsOf `Geometry ``Geometry.origin

/--
info: [("export const Point = Theory.Point;", "/** A schema of the structure that the checks redeclare. */\n"),
  ("export type Point = Theory.Point;", "/** The structure that the checks redeclare. */\n"),
  ("export const point = Theory.point;", "/** Brands without a check the structure that the checks redeclare. */\n"),
  ("export const pointOf", "/** The function that the checks implement. */\n")]
-/
#guard_msgs in
#eval show Lean.MetaM (List (String × String)) from do
  return (← Generator.redeclarationsOf `Geometry ``Geometry.Point) ++
    (← Generator.redeclarationsOf `Geometry ``Geometry.pointOf)

/-- info: [] -/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  let redeclarations := (← Generator.redeclarationsOf `Geometry ``Geometry.Point) ++
    (← Generator.redeclarationsOf `Geometry ``Geometry.pointOf)
  return Generator.mismatchesOf "Geometry.ts"
    ("/** A schema of the structure that the checks redeclare. */\nexport const Point = Theory.Point;\n\n" ++
      "/** The structure that the checks redeclare. */\nexport type Point = Theory.Point;\n\n" ++
      "/** Brands without a check the structure that the checks redeclare. */\nexport const point = Theory.point;\n\n" ++
      "/** The function that the checks implement. */\nexport const pointOf = (coordinate: number) => point({ x: coordinate });\n\n" ++
      "export const pointOfOrigin = pointOf(0);\n")
    redeclarations

/--
info: ["Geometry.ts: `export const Point = Theory.Point;` is missing, which the module takes with the comment of the theory right above it:\n/** A schema of the structure that the checks redeclare. */\n",
  "Geometry.ts:2: `export type Point = Theory.Point;` takes the comment of the theory right above it:\n/** The structure that the checks redeclare. */\n",
  "Geometry.ts: `export const point = Theory.point;` is missing, which the module takes with the comment of the theory right above it:\n/** Brands without a check the structure that the checks redeclare. */\n",
  "Geometry.ts:4: `export const pointOf: Theory.PointOf = (coordinate) => point({ x: coordinate });` takes the comment of the theory right above it:\n/** The function that the checks implement. */\n"]
-/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  let redeclarations := (← Generator.redeclarationsOf `Geometry ``Geometry.Point) ++
    (← Generator.redeclarationsOf `Geometry ``Geometry.pointOf)
  return Generator.mismatchesOf "Geometry.ts"
    ("/** A point. */\nexport type Point = Theory.Point;\n\n" ++
      "export const pointOf: Theory.PointOf = (coordinate) => point({ x: coordinate });\n")
    redeclarations
