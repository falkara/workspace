import Generator.Comment
import Generator.Type
import Lean.Structure

/-!
# Declaration

The module defines the declaration of TypeScript that a declaration of the theory marked `export_typescript` takes. A structure takes a schema of Effect branded by its name, with a field for every field of the structure, as `Schema.Struct({ X: Schema.Rational, … }).pipe(Schema.brand('Tristimulus'))`, and a type of the same name for what the schema decodes, and a constructor named in camel case, such as `tristimulus`, which brands a value as a caller writes it. A function takes a type of its signature. Every declaration and every field takes the documentation comment that the module `Comment` gives it, the schema of a structure opening with "A schema of" and its constructor with "Brands without a check". Every other declaration has no declaration of TypeScript, and the generator refuses it.

## Implementation Notes

A structure takes a schema in place of a type alone, so a value from outside the package takes the brand of the structure only by decoding, which checks every field.

The constructor of a structure brands a value by `Brand.nominal` of Effect, which checks nothing, as the schemas the generator writes hold no checks, and constructing a value with a schema of Effect either fails by throwing or gives an option. A structure whose schema holds a check takes a constructor that checks the value.

A structure takes the brand of Effect, as two structures with the same fields, such as a color and a change of a color, stay apart in TypeScript only by their brands.

A declaration takes the words of its name after the namespace of its module, each capitalized and joined, such as `ChromaticityOf` for `chromaticityOf` and `ChromaticityZ` for `Chromaticity.z`, as a type of TypeScript is named in Pascal case and the namespace has no counterpart in a module of TypeScript.

A declaration takes the form that oxfmt gives it, so the generated file passes the check of formatting of the repository unchanged. A function type longer than 100 columns, the width that oxfmt breaks at, takes every parameter on a line of its own.
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
        return s!"{← commentOf (name ++ field) "  "}  {field}: {← schemaOf fieldType},\n"
      | _ => Lean.throwError m!"`{name}` has no declaration in TypeScript, as it takes parameters."
    return s!"{← commentOf name "" (some "A schema of")}export const {typeName} = Schema.Struct(\{\n{String.join fields}}).pipe(Schema.brand('{typeName}'));\n\n" ++
      s!"{← commentOf name ""}export type {typeName} = typeof {typeName}.Type;\n\n" ++
      s!"{← commentOf name "" (some "Brands without a check")}export const {typeName.decapitalize} = Brand.nominal<{typeName}>();\n"
  match (← Lean.getConstInfo name).type with
  | type@(.forallE ..) =>
    let (parameters, result) ← signatureOf [] type
    let line := s!"export type {typeName} = ({", ".intercalate parameters}) => {result};"
    -- Oxfmt breaks a line longer than 100 columns.
    if line.length ≤ 100 then return s!"{← commentOf name ""}{line}\n"
    return s!"{← commentOf name ""}export type {typeName} = (\n{String.join (parameters.map (s!"  {·},\n"))}) => {result};\n"
  | _ => Lean.throwError m!"`{name}` has no declaration in TypeScript, as it is a value and the generator writes no values."

end Generator
