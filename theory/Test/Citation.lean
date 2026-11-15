import References

/-!
# Citation

The module defines the checks of the attribute `cite`: the attribute looks a work up in the module `References`, records the label of the item as the citation writes it, and refuses a name that names no declaration and a declaration that is no work.
-/

/-- The declaration that the checks cite an item of a work for. -/
def citedDeclaration : Nat := 0

attribute [cite "x_bar(lambda)" cie2019colorMatchingFunctions] citedDeclaration

/-- info: some { label := "x_bar(lambda)", work := `References.cie2019colorMatchingFunctions } -/
#guard_msgs in
#eval show Lean.CoreM (Option Citation.Item) from do
  return Citation.citeAttribute.getParam? (← Lean.getEnv) ``citedDeclaration

/-- The declaration that the checks cite a work for that the theory never declares. -/
def declarationCitingAnUnknownWork : Nat := 0

/-- error: Unknown constant `References.cie2019colorMatchingFunction` -/
#guard_msgs in
attribute [cite "x_bar(lambda)" cie2019colorMatchingFunction] declarationCitingAnUnknownWork

namespace References

/-- The declaration among the works that is no work. -/
def numberAmongWorks : Nat := 0

end References

/-- The declaration that the checks cite a declaration for that is no work. -/
def declarationCitingANumber : Nat := 0

/-- error: `References.numberAmongWorks` is no declaration of a work, as its type is `Nat` rather than `Citation.Work`. -/
#guard_msgs in
attribute [cite "x_bar(lambda)" numberAmongWorks] declarationCitingANumber
