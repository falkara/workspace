import Citation

/-!
# Citation

The module defines the checks of the attribute `cite`: the attribute looks a work up in the namespace `References`, records the label of the item as the citation writes it, and refuses a name that names no declaration and a declaration that is no work. The checks cite a work of their own, so they hold for the works of every theory.
-/

namespace References

/-- The work that the checks cite. -/
def workOfTheChecks : Citation.Work where
  author := "Falkara"
  title := "The Work of the Checks"
  year := 2026

end References

/-- The declaration that the checks cite an item of a work for. -/
def citedDeclaration : Nat := 0

attribute [cite "Section 1" workOfTheChecks] citedDeclaration

/-- info: some { label := "Section 1", work := `References.workOfTheChecks } -/
#guard_msgs in
#eval show Lean.CoreM (Option Citation.Item) from do
  return Citation.citeAttribute.getParam? (← Lean.getEnv) ``citedDeclaration

/-- The declaration that the checks cite a work for that the theory never declares. -/
def declarationCitingAnUnknownWork : Nat := 0

/-- error: Unknown constant `References.workOfTheCheck` -/
#guard_msgs in
attribute [cite "Section 1" workOfTheCheck] declarationCitingAnUnknownWork

namespace References

/-- The declaration among the works that is no work. -/
def numberAmongWorks : Nat := 0

end References

/-- The declaration that the checks cite a declaration for that is no work. -/
def declarationCitingANumber : Nat := 0

/-- error: `References.numberAmongWorks` is no declaration of a work, as its type is `Nat` rather than `Citation.Work`. -/
#guard_msgs in
attribute [cite "Section 1" numberAmongWorks] declarationCitingANumber
