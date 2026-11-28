module

public import Falkara.Citation

meta import Translator.Lean.Source
import Falkara.Counterpart
import all TranslatorTest.Fixture.Point

/-!
# Source

The module defines the checks of what the records of the theory give a module: the declarations
and the theorems of a module that the attribute `counterpart` gives a counterpart, each in the
order of their lines, the documentation of a declaration, of a field, and of a function that a
target derives from a declaration, a comment whose lines join into one paragraph with the DOI of
the work that the declaration cites, and a reason where the theory gives no counterpart.

## Implementation Notes

The checks compare the records with their expected values by `#guard_msgs` on `#eval`, as `#guard`
emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.

The checks import the module of the theory with its private records, as the records of the lines
of its declarations, which order them, and the kinds of its theorems stay private to the module
otherwise.

The checks cite a work of their own, so they hold for the works of every theory, and take the DOI
prefix 10.5555, which Crossref reserves for examples.
-/

public section

namespace Falkara.References

/-- The table that the checks of the records cite, a work with a DOI. -/
def Records.table : Citation.Work where
  author := "Falkara"
  title := "The Table of the Records"
  year := 2026
  doi := some "10.5555/records"

end Falkara.References

/-- The declaration that cites the table of the records over two lines. -/
def citedDeclaration : Nat := 0

attribute [counterpart Records.table "firstColumn"
  typescript
    r"The declaration that cites the table
    of the records over two lines."] citedDeclaration

/-- The declaration that the theory never gives a counterpart in TypeScript. -/
def unmarkedDeclaration : Nat := 0

/--
info: { module := `TranslatorTest.Fixture.Point,
  declarations := [`Geometry.Point, `Geometry.pointAt],
  theorems := [`Geometry.pointAt_first, `Geometry.pointAt_eq] }
-/
#guard_msgs in
#eval show Lean.MetaM Translator.Lean.Source.Module from do
  return Translator.Lean.Source.moduleOf (← Lean.getEnv) `TranslatorTest.Fixture.Point

/--
info: [{ text := "Gives the point at a coordinate.", addresses := [] },
 { text := "The first coordinate of the point.", addresses := [] },
 { text := "A schema of a point, which decodes its first coordinate.", addresses := [] },
 { text := "The declaration that cites the table of the records over two lines.",
   addresses := ["https://doi.org/10.5555/records firstColumn"] }]
-/
#guard_msgs in
#eval show Lean.MetaM (List Translator.Core.Documentation) from do
  let environment ← Lean.getEnv
  let readings := [Translator.Lean.Source.commentOf environment ``Geometry.pointAt,
    Translator.Lean.Source.fieldCommentOf environment ``Geometry.Point `first,
    Translator.Lean.Source.derivedCommentOf environment ``Geometry.Point .schema,
    Translator.Lean.Source.commentOf environment ``citedDeclaration]
  readings.mapM fun
    | .ok documentation => pure documentation
    | .error refusal => Lean.throwError refusal.render

/--
error: `unmarkedDeclaration` has no documentation comment in TypeScript, as the theory never gives it a counterpart in TypeScript.
-/
#guard_msgs in
#eval show Lean.MetaM Translator.Core.Documentation from do
  match Translator.Lean.Source.commentOf (← Lean.getEnv) ``unmarkedDeclaration with
  | .ok documentation => pure documentation
  | .error refusal => Lean.throwError refusal.render
