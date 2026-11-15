import Generator.Redeclaration

/-!
# Redeclaration

The module defines the checks of the redeclarations in a module of TypeScript: a structure is redeclared as its schema, its type, and its constructor and a function is implemented by its type, each with the comment of the theory, and the check gives no reason for a module whose comments are the comments of the theory and a reason for a comment that differs and for a redeclaration with no comment.
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

end Geometry

/--
info: [("export const Point = Theory.Point;", "/** A schema of the structure that the checks redeclare. */\n"),
  ("export type Point = Theory.Point;", "/** The structure that the checks redeclare. */\n"),
  ("export const point = Theory.point;", "/** Brands without a check the structure that the checks redeclare. */\n"),
  (": Theory.PointOf = ", "/** The function that the checks implement. */\n")]
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
    ("/** The structure that the checks redeclare. */\nexport type Point = Theory.Point;\n\n" ++
      "/** The function that the checks implement. */\nexport const pointOf: Theory.PointOf = (coordinate) => point({ x: coordinate });\n")
    redeclarations

/--
info: ["Geometry.ts:2: `export type Point = Theory.Point;` takes the comment of the theory right above it:\n/** The structure that the checks redeclare. */\n",
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
