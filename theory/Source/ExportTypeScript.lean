import Lean.Attributes

/-!
# Export TypeScript

The module defines the attribute `export_typescript`, which marks a declaration of the theory that the generator writes as TypeScript. A declaration takes the attribute as `attribute [export_typescript] <name>`, and every declaration without the attribute stays in the theory alone.

## Implementation Notes

The attribute marks each declaration by hand rather than every declaration of the library `Presentation`, as the data tables of the CIE are licensed under CC BY-SA 4.0 and the packages of the repository under the MIT License, so the data tables stay out of the packages.
-/

namespace ExportTypeScript

/-- The attribute that marks a declaration the generator writes as TypeScript. -/
initialize tagAttribute : Lean.TagAttribute ←
  Lean.registerTagAttribute `export_typescript "mark a declaration that the generator writes as TypeScript"

end ExportTypeScript
