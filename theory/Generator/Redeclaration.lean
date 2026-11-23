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
constructor of every structure that takes an interface, of every type of the functors, with the
predicates of its axioms, and of
every bundled structure, with a
functor that is a parameter constrained as the interface constrains it, such as
`export type Coalgebra<F extends HKT.TypeLambda, V> =`, redeclares the type of every type, every
functor, with a functor that is a parameter constrained in the same way, and every curried functor,
the last with the type parameter of the type it maps, such as
`export type MachineOutcome<State, Output> =`, implements the instance of the class of functors
that every functor and every curried functor takes, such as `export const binaryProductFunctor`,
redeclares every value, such as
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
  let names ← parametersOf information fun parameters _ _ ↦
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
  | .bundled =>
    -- The redeclaration declares the parameters with their constraints, as the interface does.
    let bundledNames ← parametersOf information fun parameters _ value? ↦ do
      let some value := value?
        | Lean.throwError m!"`{name}` has no redeclaration, as the theory gives the type no value."
      bundledFieldsOf value fun bundledParameters _ ↦
        (parameters.toList ++ bundledParameters).mapM fun parameter ↦ do
          (genericOf parameter (← parameter.fvarId!.getUserName).toString).run' []
    let allArguments := if bundledNames.isEmpty then "" else
      s!"<{", ".intercalate bundledNames}>"
    return [
      (s!"export type {typeName}{allArguments} =", ← commentOf name),
      (s!"export const {valueName} = Theory.{valueName};",
        ← commentOf name (some "Creates"))]
  | .type => return [(s!"export type {typeName}{arguments} =", ← commentOf name)]
  | .functor =>
    -- The redeclaration declares a functor that is a parameter with its constraint, as the
    -- interface does.
    let constrained ← parametersOf information fun parameters _ _ ↦
      parameters.toList.mapM fun parameter ↦ do
        (genericOf parameter (← parameter.fvarId!.getUserName).toString).run' []
    let constrainedArguments := if constrained.isEmpty then "" else
      s!"<{", ".intercalate constrained}>"
    return [(s!"export type {typeName}{constrainedArguments} =", ← commentOf name),
      (s!"export const {valueName}", ← commentOf name (some "Gives"))]
  | .functorClass =>
    -- The redeclaration declares the type lambda with its constraint, as the interface does.
    let generic ← parametersOf information fun _ _ value? ↦ do
      let some value := value?
        | Lean.throwError m!"`{name}` has no redeclaration, as the theory gives the type no value."
      functorFieldsOf value fun functor _ _ ↦ (genericOf functor "F").run' []
    return [
      (s!"export type {typeName}<{generic}> =", ← commentOf name),
      (s!"export const {valueName} = Theory.{valueName};", ← commentOf name (some "Creates")),
      (s!"export const {valueName}Axioms = Theory.{valueName}Axioms;",
        ← commentOf name (some "Gives the axioms of"))]
  | .curriedFunctor =>
    -- The object of the curried functor takes a type parameter after those of the declaration.
    let allNames ← parametersOf information fun parameters rest value? ↦ do
      let some value := value?
        | Lean.throwError m!"`{name}` has no redeclaration, as the theory gives the functor no \
            value."
      curriedObjectOf value rest fun parameter _ ↦
        (parameters.toList ++ [parameter]).mapM fun parameter ↦
          return (← parameter.fvarId!.getUserName).toString
    return [(s!"export type {typeName}<{", ".intercalate allNames}> =", ← commentOf name),
      (s!"export const {valueName}", ← commentOf name (some "Gives"))]
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
