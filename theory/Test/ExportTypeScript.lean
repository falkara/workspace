import ExportTypeScript

/-!
# Export TypeScript

The module defines the checks of the attribute `export_typescript`: the attribute marks the declaration that takes the attribute and leaves every other declaration unmarked.
-/

/-- The declaration that the checks mark. -/
def markedDeclaration : Nat := 0

attribute [export_typescript] markedDeclaration

/-- The declaration that the checks leave unmarked. -/
def unmarkedDeclaration : Nat := 0

/-- info: (true, false) -/
#guard_msgs in
#eval show Lean.CoreM (Bool × Bool) from do
  let environment ← Lean.getEnv
  return (ExportTypeScript.tagAttribute.hasTag environment ``markedDeclaration,
    ExportTypeScript.tagAttribute.hasTag environment ``unmarkedDeclaration)
