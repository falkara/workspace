module

public import Falkara.Citation.Defs

meta import Generator.Comment
import Falkara.ExportTypeScript

/-!
# Comment

The module defines the checks of the documentation comments of TypeScript that the declarations of
the theory take: a declaration that cites an item of a work with a page for every item takes the
page of the item, a declaration that cites any other work takes the DOI of the work, a declaration
that cites no work takes the comment of its attribute alone, a declaration that the attribute never
marks takes none, and a text given to open the comment takes the place of the first word. A
declaration whose comment in TypeScript cites a work of its own takes the page of its item and the
DOI of the work of its comment, and a field whose comment cites a work takes the DOI of the work.
The checks cite works of their own, so they hold for the works of every theory, and take the DOI
prefix 10.5555, which Crossref reserves for examples.

## Main Definitions

- `vocabularyOfTheChecks`: the vocabulary that the checks cite, a work with a page for every
  entry.
- `tableOfTheChecks`: the table that the checks cite, a work with a DOI.
- `entryDeclaration`: the declaration that cites an entry of the vocabulary.
- `tableDeclaration`: the declaration that cites a data table.
- `uncitedDeclaration`: the declaration that cites no work.
- `unmarkedDeclaration`: the declaration that the attribute never marks.
- `commentedDeclaration`: the declaration whose comment in TypeScript cites the table.
- `Shelf`: the structure whose field takes a comment that cites the table.
-/

public section

namespace Falkara.References

/-- The vocabulary that the checks cite, a work with a page for every entry. -/
def vocabularyOfTheChecks : Citation.Work where
  author := "Falkara"
  title := "The Vocabulary of the Checks"
  year := 2026
  itemAddress := some "https://example.com/term/"

/-- The table that the checks cite, a work with a DOI. -/
def tableOfTheChecks : Citation.Work where
  author := "Falkara"
  title := "The Table of the Checks"
  year := 2026
  doi := some "10.5555/checks"

end Falkara.References

/-- The declaration that cites an entry of the vocabulary. -/
def entryDeclaration : Nat := 0

attribute [cite "17-23-053" vocabularyOfTheChecks] entryDeclaration

attribute [export_typescript "The declaration that cites an entry of the vocabulary."]
  entryDeclaration

/-- The declaration that cites a data table. -/
def tableDeclaration : Nat := 0

attribute [cite "sumOfColumns" tableOfTheChecks] tableDeclaration

attribute [export_typescript "The declaration that cites a data table."] tableDeclaration

/-- The declaration that cites no work. -/
def uncitedDeclaration : Nat := 0

attribute [export_typescript "The declaration that cites no work."] uncitedDeclaration

/-- The declaration that the attribute never marks. -/
def unmarkedDeclaration : Nat := 0

/--
info: /**
 * The declaration that cites an entry of the vocabulary.
 *
 * @see https://example.com/term/17-23-053
 */
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.commentOf ``entryDeclaration)

/--
info: /**
 * The declaration that cites a data table.
 *
 * @see https://doi.org/10.5555/checks sumOfColumns
 */
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.commentOf ``tableDeclaration)

/-- info: /** A schema of the declaration that cites no work. */ -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.commentOf ``uncitedDeclaration (some "A schema of"))

/-- error: `unmarkedDeclaration` has no documentation comment in TypeScript, as the attribute `export_typescript` marks it nowhere. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.commentOf ``unmarkedDeclaration)

/-- The declaration whose comment in TypeScript cites the table. -/
def commentedDeclaration : Nat := 0

attribute [cite "17-23-053" vocabularyOfTheChecks] commentedDeclaration

attribute [export_typescript
  "A declaration in the terms of the table." cite "sumOfColumns" tableOfTheChecks]
  commentedDeclaration

/--
info: /**
 * A declaration in the terms of the table.
 *
 * @see https://example.com/term/17-23-053
 * @see https://doi.org/10.5555/checks sumOfColumns
 */
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.commentOf ``commentedDeclaration)

/-- The structure whose field takes a comment that cites the table. -/
structure Shelf where
  /-- The book on the shelf. -/
  book : Nat

attribute [export_typescript "The structure whose field takes a comment that cites the table."
  (book := "book" "The book that the shelf holds." cite "sumOfColumns" tableOfTheChecks)] Shelf

/--
info: /**
 * The book that the shelf holds.
 *
 * @see https://doi.org/10.5555/checks sumOfColumns
 */
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.fieldCommentOf ``Shelf `book)
