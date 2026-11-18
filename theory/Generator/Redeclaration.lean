/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Lean.Meta.Basic
import Generator.Comment
import Generator.Type

/-!
# Redeclaration

The module defines the check of the redeclarations that a module of a package makes of the
declarations the generator writes. A module imports the generated module as `Theory`, redeclares
the schema, the type, and the constructor of every structure, such as
`export const Tristimulus = Theory.Tristimulus;`, redeclares the schema and the type of every
refinement, such as `export const Segment = Theory.Segment;`, redeclares the type and the
constructor of every structure that takes an interface and every type, such as
`export type MachineOutcome<State, Output> =`, redeclares every value, such as
`export const whiteTristimulus = Theory.whiteTristimulus;`, and implements every function under
the name its contract gives it, such as `export const chromaticityOf`. Every redeclaration and every
implementation takes the documentation comment that the generator writes for the declaration,
right above it, and the check gives a reason for every one that is missing or takes another
comment.

## Main Definitions

- `redeclarationsOf`: gives the text that opens the line of every redeclaration or implementation
  of a declaration of the theory, with the documentation comment it takes.
- `mismatchesOf`: gives a reason for every redeclaration or implementation that a module of
  TypeScript leaves out or whose documentation comment differs from the one it takes.

## Implementation Notes

The check finds a redeclaration by the text its line opens with, as the module of TypeScript is
read as text and has no syntax tree in Lean. A line that opens with the text and goes on with a
character of a name, such as `export const chromaticityOfWhite`, declares another name and marks no
redeclaration.

A type is found by the text up to its `=`, as oxfmt breaks a redeclaration longer than 100
columns, such as one of a type with three type parameters, after the `=` and between the arguments.

A value is redeclared from the generated module alone, so the module of the package holds the value
of the theory and never a value of its own.

A missing redeclaration is a reason of its own, so a redeclaration the check fails to find, such as
one that a formatter breaks over two lines, fails the check rather than passing it unchecked.
-/

public section

namespace Generator

/-- Gives the text that opens the line of every redeclaration or implementation of a declaration of
the theory, with the documentation comment it takes. -/
def redeclarationsOf (moduleNamespace name : Lean.Name) :
    Lean.MetaM (List (String × String)) := do
  let typeName := pascalCaseOf (wordsOf moduleNamespace name)
  let valueName := camelCaseOf (wordsOf moduleNamespace name)
  let information ← Lean.getConstInfo name
  let names ← Lean.Meta.forallBoundedTelescope information.type
    (some (typeParameterCount information.type)) fun parameters _ ↦
      parameters.toList.mapM fun parameter ↦ return (← parameter.fvarId!.getUserName).toString
  let arguments := if names.isEmpty then "" else s!"<{", ".intercalate names}>"
  match ← kindOf name with
  | .dataStructure =>
    return [
      (s!"export const {typeName} = Theory.{typeName};",
        ← commentOf name (some "A schema of")),
      (s!"export type {typeName} = Theory.{typeName};", ← commentOf name),
      (s!"export const {valueName} = Theory.{valueName};",
        ← commentOf name (some "Brands without a check"))]
  | .structure =>
    return [
      (s!"export type {typeName}{arguments} =", ← commentOf name),
      (s!"export const {valueName} = Theory.{valueName};",
        ← commentOf name (some "Creates"))]
  | .refinement .. =>
    return [
      (s!"export const {typeName} = Theory.{typeName};",
        ← commentOf name (some "A schema of")),
      (s!"export type {typeName} = Theory.{typeName};", ← commentOf name)]
  | .type => return [(s!"export type {typeName}{arguments} =", ← commentOf name)]
  | .value =>
    return [(s!"export const {valueName} = Theory.{valueName};",
      ← commentOf name)]
  | .function => return [(s!"export const {valueName}", ← commentOf name)]

/-- Gives a reason for every redeclaration or implementation that a module of TypeScript leaves out
or whose documentation comment differs from the one it takes. -/
def mismatchesOf (path source : String) (redeclarations : List (String × String)) : List String :=
  let lines := (source.splitOn "\n").toArray
  redeclarations.flatMap fun (mark, comment) ↦
    let found := (List.range lines.size).filter fun index ↦
      let line := lines[index]!.trimAscii.copy
      line.startsWith mark && !((line.toList.drop mark.length).head?.any fun character ↦
        character.isAlphanum || character == '_' || character == '$')
    if found.isEmpty then
      [s!"{path}: `{mark}` is missing, which the module takes with the comment of the theory \
        right above it:\n{comment}"]
    else found.filterMap fun index ↦
      -- The comment ends on the line above the redeclaration and opens on the nearest line above
      -- it that opens a comment.
      let opening := ((List.range index).reverse.find? fun line ↦
        lines[line]!.trimAscii.copy.startsWith "/**").getD index
      let above := String.join ((List.range (index - opening)).map fun offset ↦
        s!"{lines[opening + offset]!}\n")
      if index > 0 && lines[index - 1]!.trimAscii.copy.endsWith "*/" && above == comment then none
      else some s!"{path}:{index + 1}: `{lines[index]!.trimAscii.copy}` takes the comment of the \
        theory right above it:\n{comment}"

end Generator
