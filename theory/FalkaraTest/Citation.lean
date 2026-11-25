module

public import Falkara.Citation.Defs

meta import Falkara.Citation.Defs
import Falkara.Citation

/-!
# Citation

The module defines the checks of the attribute `cite`: the attribute looks a work up in the
namespace `Falkara.References`, records the label of the item as the citation writes it, and
refuses a name that names no declaration, a declaration that is no work, a second citation of one
declaration, and a declaration of another module. The checks cite a work of their own, so they hold
for the works of every theory.

## Main Definitions

- `workOfTheChecks`: the work that the checks cite.
- `citedDeclaration`: the declaration that the checks cite an item of a work for.
- `declarationCitingAnUnknownWork`: the declaration that the checks cite a work for that the theory
  never declares.
- `numberAmongWorks`: the declaration among the works that is no work.
- `declarationCitingANumber`: the declaration that the checks cite a declaration for that is no
  work.
-/

public section

open Falkara

namespace Falkara.References

/-- The work that the checks cite. -/
def workOfTheChecks : Citation.Work where
  author := "Falkara"
  title := "The Work of the Checks"
  year := 2026

end Falkara.References

/-- The declaration that the checks cite an item of a work for. -/
def citedDeclaration : ℕ := 0

attribute [cite "Section 1" workOfTheChecks] citedDeclaration

/-- info: some { label := "Section 1", work := `Falkara.References.workOfTheChecks } -/
#guard_msgs in
#eval show Lean.CoreM (Option Citation.Item) from do
  return Citation.citationOf? (← Lean.getEnv) ``citedDeclaration

/-- error: `citedDeclaration` cites an item already. -/
#guard_msgs in
attribute [cite "Section 2" workOfTheChecks] citedDeclaration

/-- error: `Nat.succ` lies in another module, which alone cites it. -/
#guard_msgs in
attribute [cite "Section 1" workOfTheChecks] Nat.succ

/-- The declaration that the checks cite a work for that the theory never declares. -/
def declarationCitingAnUnknownWork : ℕ := 0

/-- error: Unknown constant `Falkara.References.workOfTheCheck` -/
#guard_msgs in
attribute [cite "Section 1" workOfTheCheck] declarationCitingAnUnknownWork

namespace Falkara.References

/-- The declaration among the works that is no work. -/
def numberAmongWorks : ℕ := 0

end Falkara.References

/-- The declaration that the checks cite a declaration for that is no work. -/
def declarationCitingANumber : ℕ := 0

/-- error: `Falkara.References.numberAmongWorks` is no declaration of a work, as its type is `ℕ` rather than `Citation.Work`. -/
#guard_msgs in
attribute [cite "Section 1" numberAmongWorks] declarationCitingANumber
