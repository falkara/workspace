module

public import Falkara.Citation
meta import Falkara.Citation
meta import Generator.Comment

/-!
# Comment

The module defines the checks of the documentation comments of TypeScript that the declarations of
the theory take: a declaration that cites an item of a work with a page for every item takes the
page of the item, a declaration that cites any other work takes the DOI of the work, a declaration
that cites no work takes its documentation comment alone, and a text given to open the comment takes
the place of the first word. The checks cite works of their own, so they hold for the works of
every theory, and take the DOI prefix 10.5555, which Crossref reserves for examples.

## Main Definitions

- `vocabularyOfTheChecks`: the vocabulary that the checks cite, a work with a page for every
  entry.
- `tableOfTheChecks`: the table that the checks cite, a work with a DOI.
- `entryDeclaration`: the declaration that cites an entry of the vocabulary.
- `tableDeclaration`: the declaration that cites a data table.
- `uncitedDeclaration`: the declaration that cites no work.
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

/-- The declaration that cites a data table. -/
def tableDeclaration : Nat := 0

attribute [cite "sumOfColumns" tableOfTheChecks] tableDeclaration

/-- The declaration that cites no work. -/
def uncitedDeclaration : Nat := 0

/--
info:   /**
   * The declaration that cites an entry of the vocabulary.
   *
   * @see https://example.com/term/17-23-053
   */
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.commentOf ``entryDeclaration "  ")

/--
info: /**
 * The declaration that cites a data table.
 *
 * @see https://doi.org/10.5555/checks
 */
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.commentOf ``tableDeclaration "")

/-- info: /** A schema of the declaration that cites no work. */ -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.commentOf ``uncitedDeclaration "" (some "A schema of"))
