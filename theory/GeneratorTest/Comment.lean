module

public import Falkara.Citation

meta import Generator.Comment
import Falkara.Counterpart

/-!
# Comment

The module defines the checks of the documentation comments of TypeScript that the declarations of
the theory take: a declaration that cites an item of a work with a page for every item takes the
page of the item, a declaration that cites any other work takes the DOI of the work, a declaration
that cites no work takes the comment of its attribute alone, a declaration that the theory never
gives a counterpart in TypeScript takes none, and a text given to open the comment takes the place
of the first word. A field that cites an item of a work takes the DOI of the work in its comment.
The checks cite works of their own, so they hold for the works of every
theory, and take the DOI prefix 10.5555, which Crossref reserves for examples.

## Main Definitions

- `Checks.vocabulary`: the vocabulary that the checks cite, a work with a page for every
  entry.
- `Checks.table`: the table that the checks cite, a work with a DOI.
- `entryDeclaration`: the declaration that cites an entry of the vocabulary.
- `tableDeclaration`: the declaration that cites a data table.
- `uncitedDeclaration`: the declaration that cites no work.
- `unmarkedDeclaration`: the declaration that the theory never gives a counterpart in TypeScript.
- `Shelf`: the structure whose field cites the table.
-/

public section

namespace Falkara.References

/-- The vocabulary that the checks cite, a work with a page for every entry. -/
def Checks.vocabulary : Citation.Work where
  author := "Falkara"
  title := "The Vocabulary of the Checks"
  year := 2026
  itemAddress := some "https://example.com/term/"

/-- The table that the checks cite, a work with a DOI. -/
def Checks.table : Citation.Work where
  author := "Falkara"
  title := "The Table of the Checks"
  year := 2026
  doi := some "10.5555/checks"

end Falkara.References

/-- The declaration that cites an entry of the vocabulary. -/
def entryDeclaration : Nat := 0

attribute [counterpart Checks.vocabulary "17-23-053"
  typescript
    r"The declaration that cites an entry of the vocabulary."] entryDeclaration

/-- The declaration that cites a data table. -/
def tableDeclaration : Nat := 0

attribute [counterpart Checks.table "sumOfColumns"
  typescript
    r"The declaration that cites a data table."] tableDeclaration

/-- The declaration that cites no work. -/
def uncitedDeclaration : Nat := 0

attribute [counterpart
  typescript
    r"The declaration that cites no work."] uncitedDeclaration

/-- The declaration that the theory never gives a counterpart in TypeScript. -/
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

/-- error: `unmarkedDeclaration` has no documentation comment in TypeScript, as the theory never gives it a counterpart in TypeScript. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.commentOf ``unmarkedDeclaration)

/-- The structure whose field cites the table. -/
structure Shelf where
  /-- The book on the shelf. -/
  book : Nat

attribute [counterpart
  (book := Checks.table "sumOfColumns")
  typescript
    r"The structure whose field cites the table."
    (book
      r"The book that the shelf holds.")] Shelf

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
