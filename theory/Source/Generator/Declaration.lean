import Generator.Type
import Lean.Structure

/-!
# Declaration

The module defines the declaration of TypeScript that a declaration of the theory marked `export_typescript` takes. A structure takes a type branded by its name, with a field for every field of the structure, as `Brand.Branded<{ readonly X: Rational.Rational; … }, 'Tristimulus'>`, and a function takes a type of its signature. Every other declaration has no declaration of TypeScript, and the generator refuses it.

## Implementation Notes

A structure takes the brand of Effect, as two structures with the same fields, such as a color and a change of a color, stay apart in TypeScript only by their brands.

A declaration takes the words of its name after the namespace of its module, each capitalized and joined, such as `ChromaticityOf` for `chromaticityOf` and `ChromaticityZ` for `Chromaticity.z`, as a type of TypeScript is named in Pascal case and the namespace has no counterpart in a module of TypeScript.
-/

namespace Generator

/-- Gives the declaration of TypeScript that a declaration of the theory marked `export_typescript` takes, named without the namespace of its module, or fails with the reason where the declaration has none. -/
def declarationOf (moduleNamespace name : Lean.Name) : Lean.MetaM String := do
  let environment ← Lean.getEnv
  unless ExportTypeScript.tagAttribute.hasTag environment name do
    Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory never marks it `export_typescript`."
  let typeName := String.join ((name.replacePrefix moduleNamespace .anonymous).components.map
    fun component => component.toString.capitalize)
  if Lean.isStructure environment name then
    let fields ← (Lean.getStructureFields environment name).toList.mapM fun field => do
      match (← Lean.getConstInfo (name ++ field)).type with
      | .forallE _ _ fieldType _ =>
        if fieldType.hasLooseBVars then
          Lean.throwError m!"`{name ++ field}` has no field in TypeScript, as its type depends on the structure."
        return s!"    readonly {field}: {← typeOf fieldType};\n"
      | _ => Lean.throwError m!"`{name}` has no declaration in TypeScript, as it takes parameters."
    return s!"export type {typeName} = Brand.Branded<\n  \{\n{String.join fields}  },\n  '{typeName}'\n>;\n"
  match (← Lean.getConstInfo name).type with
  | type@(.forallE ..) => return s!"export type {typeName} = {← typeOf type};\n"
  | _ => Lean.throwError m!"`{name}` has no declaration in TypeScript, as it is a value and the generator writes no values."

end Generator
