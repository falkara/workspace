import Generator.Comment
import References

/-!
# Comment

The module defines the checks of the documentation comments of TypeScript that the declarations of the theory take: a declaration that cites an item of a work with a page for every item takes the page of the item, a declaration that cites any other work takes the DOI of the work, a declaration that cites no work takes its documentation comment alone, and a text given to open the comment takes the place of the first word.
-/

/-- The declaration that cites an entry of the vocabulary. -/
def entryDeclaration : Nat := 0

attribute [cite "17-23-053" cie2020internationalLightingVocabulary] entryDeclaration

/-- The declaration that cites a data table. -/
def tableDeclaration : Nat := 0

attribute [cite "sumOfColumns" cie2019colorMatchingFunctions] tableDeclaration

/-- The declaration that cites no work. -/
def uncitedDeclaration : Nat := 0

/--
info:   /**
   * The declaration that cites an entry of the vocabulary.
   *
   * @see https://cie.co.at/eilvterm/17-23-053
   */
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.commentOf ``entryDeclaration "  ")

/--
info: /**
 * The declaration that cites a data table.
 *
 * @see https://doi.org/10.25039/CIE.DS.xvudnb9b
 */
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.commentOf ``tableDeclaration "")

/-- info: /** A schema of the declaration that cites no work. */ -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← Generator.commentOf ``uncitedDeclaration "" (some "A schema of"))
