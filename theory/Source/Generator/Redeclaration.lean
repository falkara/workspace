import Generator.Comment
import Generator.Type
import Lean.Structure

/-!
# Redeclaration

The module defines the check of the redeclarations that a module of Falkara Presentation makes of the declarations the generator writes. A module imports the generated module as `Theory` and redeclares what its public interface holds, such as `export const Tristimulus = Theory.Tristimulus;`, and implements a function by the type of the theory, such as `export const chromaticityOf: Theory.ChromaticityOf = …`. Every redeclaration and every implementation takes the documentation comment that the generator writes for the declaration, right above it, and the check gives a reason for every one that takes another.

## Implementation Notes

The check finds a redeclaration by the text that marks it on its line, as the module of TypeScript is read as text and has no syntax tree in Lean.
-/

namespace Generator

/-- Gives the text that marks every redeclaration or implementation of a declaration of the theory on its line, with the documentation comment it takes. -/
def redeclarationsOf (moduleNamespace name : Lean.Name) : Lean.MetaM (List (String × String)) := do
  let typeName := String.join ((name.replacePrefix moduleNamespace .anonymous).components.map
    fun component => component.toString.capitalize)
  if Lean.isStructure (← Lean.getEnv) name then
    return [
      (s!"export const {typeName} = Theory.{typeName};", ← commentOf name "" (some "A schema of")),
      (s!"export type {typeName} = Theory.{typeName};", ← commentOf name ""),
      (s!"export const {typeName.decapitalize} = Theory.{typeName.decapitalize};",
        ← commentOf name "" (some "Brands without a check"))]
  return [(s!": Theory.{typeName} = ", ← commentOf name "")]

/-- Gives a reason for every redeclaration or implementation in a module of TypeScript whose documentation comment differs from the one it takes. -/
def mismatchesOf (path source : String) (redeclarations : List (String × String)) : List String :=
  let lines := (source.splitOn "\n").toArray
  redeclarations.flatMap fun (mark, comment) =>
    (List.range lines.size).filterMap fun index =>
      if (lines[index]!.splitOn mark).length > 1 then
        -- The comment ends on the line above the redeclaration and opens on the nearest line above it that opens a comment.
        let opening := ((List.range index).reverse.find? fun line => lines[line]!.trimAscii.copy.startsWith "/**").getD index
        let above := String.join ((List.range (index - opening)).map fun offset => s!"{lines[opening + offset]!}\n")
        if index > 0 && lines[index - 1]!.trimAscii.copy.endsWith "*/" && above == comment then none
        else some s!"{path}:{index + 1}: `{lines[index]!.trimAscii.copy}` takes the comment of the theory right above it:\n{comment}"
      else none

end Generator
