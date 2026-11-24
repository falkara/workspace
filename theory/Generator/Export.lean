/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Lean.Meta.Basic
import Generator.Comment
import Generator.Declaration
import Generator.Type

/-!
# Export

The module defines the check of what a module of a package exports of the declarations the
generator writes. A module re-exports from the generated module the schema and the type of every
structure, refinement, and type, such as `Tristimulus`, the constructor of every structure and
bundled structure, such as `coalgebra`, the factory and the predicates of the axioms of every class
of functors, such as `functorAxioms`, and every value, such as `whiteTristimulus`, in a statement
such as `export { type Coalgebra, coalgebra } from '#src/Coalgebra.theory';`, which carries the
documentation comment of the theory. It implements the instance of the class of functors that every
functor and every curried functor takes, such as `export const binaryProductFunctor`, and every
function under the name its contract gives it, such as `export const chromaticityOf`, each with the
documentation comment that the generator writes for the declaration, right above it. The check
gives a reason for every name that the module leaves out of its re-exports and for every
implementation that is missing or takes another comment.

## Main Definitions

- `reexportsOf`: gives the names that a module of a package re-exports of a declaration of the
  theory from the generated module.
- `implementationsOf`: gives the text that opens the line of every implementation of a declaration
  of the theory, with the documentation comment it takes.
- `mismatchesOf`: gives a reason for every name that a module of TypeScript leaves out of its
  re-exports and for every implementation that it leaves out or whose documentation comment differs
  from the one it takes.

## Implementation Notes

The check finds the re-exported names between the `{` and the `} from` of every statement that
re-exports from the generated module, as the module of TypeScript is read as text and has no syntax
tree in Lean, so a statement that oxfmt breaks over lines is found as well. A name is found with or
without the modifier `type`, as TypeScript requires the modifier of a type and the check leaves it
to TypeScript.

The check finds an implementation by the text its line opens with. A line that opens with the text
and goes on with a character of a name, such as `export const chromaticityOfWhite`, declares another
name and marks no implementation.

A value is re-exported from the generated module, so the module of the package holds the value of
the theory and never a value of its own.

A missing name or implementation is a reason of its own, so one that the check fails to find fails
the check rather than passing it unchecked.
-/

public section

namespace Generator

/-- Gives the names that a module of a package re-exports of a declaration of the theory from the
generated module. -/
def reexportsOf (moduleNamespace name : Lean.Name) : Lean.MetaM (List String) := do
  let typeName := pascalCaseOf (wordsOf moduleNamespace name)
  let valueName := camelCaseOf (wordsOf moduleNamespace name)
  match ← kindOf name with
  | .dataStructure | .structure | .bundled => return [typeName, valueName]
  | .refinement .. | .type | .functor | .curriedFunctor => return [typeName]
  | .functorClass => return [typeName, valueName, s!"{valueName}Axioms"]
  | .value => return [valueName]
  | .function => return []

/-- Gives the text that opens the line of every implementation of a declaration of the theory, with
the documentation comment it takes. -/
def implementationsOf (moduleNamespace name : Lean.Name) :
    Lean.MetaM (List (String × String)) := do
  let valueName := camelCaseOf (wordsOf moduleNamespace name)
  match ← kindOf name with
  | .functor | .curriedFunctor =>
    return [(s!"export const {valueName}", ← instanceCommentOf moduleNamespace name)]
  | .function => return [(s!"export const {valueName}", ← commentOf name)]
  | _ => return []

/-- Gives a reason for every name that a module of TypeScript leaves out of its re-exports from the
generated module of the specifier and for every implementation that it leaves out or whose
documentation comment differs from the one it takes. -/
def mismatchesOf (path specifier source : String) (reexports : List String)
    (implementations : List (String × String)) : List String :=
  -- Every part but the last ends where a statement re-exports from the generated module, and its
  -- names follow the last `{` of the part.
  let reexported := (source.splitOn s!"} from '{specifier}';").dropLast.flatMap fun part ↦
    let opening := part.splitOn "{"
    let statement := ("{".intercalate opening.dropLast).trimAscii.copy
    if statement.endsWith "export" || statement.endsWith "export type" then
      (opening.getLast!.splitOn ",").filterMap fun entry ↦
        let entry := entry.trimAscii.copy
        let name := if entry.startsWith "type " then
          (String.ofList (entry.toList.drop "type ".length)).trimAscii.copy
        else entry
        if name.isEmpty then none else some name
    else []
  let missing := (reexports.filter fun name ↦ !reexported.contains name).map fun name ↦
    s!"{path}: `{name}` is missing, which the module re-exports from `{specifier}`."
  let lines := (source.splitOn "\n").toArray
  missing ++ implementations.flatMap fun (mark, comment) ↦
    let found := (List.range lines.size).filter fun index ↦
      let line := lines[index]!.trimAscii.copy
      line.startsWith mark && !((line.toList.drop mark.length).head?.any fun character ↦
        character.isAlphanum || character == '_' || character == '$')
    if found.isEmpty then
      [s!"{path}: `{mark}` is missing, which the module takes with the comment of the theory \
        right above it:\n{comment}"]
    else found.filterMap fun index ↦
      -- The comment ends on the line above the implementation and opens on the nearest line above
      -- it that opens a comment.
      let opening := ((List.range index).reverse.find? fun line ↦
        lines[line]!.trimAscii.copy.startsWith "/**").getD index
      let above := String.join ((List.range (index - opening)).map fun offset ↦
        s!"{lines[opening + offset]!}\n")
      if index > 0 && lines[index - 1]!.trimAscii.copy.endsWith "*/" && above == comment then none
      else some s!"{path}:{index + 1}: `{lines[index]!.trimAscii.copy}` takes the comment of the \
        theory right above it:\n{comment}"

end Generator
