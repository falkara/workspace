/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Citation.Defs

/-!
# Export TypeScript Definitions

The module defines a declaration that the generator writes as TypeScript, the documentation
comment and the clauses that it takes there, and the record of every such declaration, which the
attribute `export_typescript` of `Falkara.ExportTypeScript` fills while a module compiles and the
generator reads when it runs.

## Main Definitions

- `Comment`: a documentation comment that a declaration or a field of it takes in TypeScript, with
  the item of the work that its terms come from, where it cites one.
- `Clause`: a binder or a field of a declaration with the name and the documentation comment that
  it takes in TypeScript.
- `Export`: a declaration that the generator writes as TypeScript, with its comment and its
  clauses.
- `exportExtension`: the record of the declarations that the generator writes as TypeScript.
- `labels`: tells whether a declaration labels a structure.
- `exportsOf`: gives every declaration that the generator writes as TypeScript.
- `isExported`: tells whether the generator writes a declaration as TypeScript.
- `commentOf?`: gives the documentation comment that a declaration takes in TypeScript, where the
  theory gives one.
- `clauseOf?`: gives the clause of a binder of a declaration, where the theory gives one.
- `nameOf?`: gives the name that a binder of a declaration takes in TypeScript, where the theory
  names one.
- `fieldClauseOf?`: gives the clause of a field of a structure, given by the declaration that labels
  the structure, where the theory gives one.

## Implementation Notes

The record lies apart from the attribute, as the generator reads it when it runs and the attribute
fills it while a module compiles, so the record is ordinary code and the attribute a metaprogram,
which imports this module at both phases.

The exports lie in an extension of the environment rather than in a parametric attribute, as a
parametric attribute takes a single value of a fixed form. An export is looked up in the entries of
every module rather than in a state of the extension, as the generator imports the theory without
the states of the extensions, as `TagAttribute.hasTag` of Lean looks a tag up.
-/

public section

namespace Falkara.ExportTypeScript

/-- A documentation comment that a declaration or a field of it takes in TypeScript, with the item
of the work that its terms come from, where it cites one. -/
structure Comment where
  /-- The text of the comment as TypeScript writes it. -/
  text : String
  /-- The item of the work that the terms of the comment come from, where the comment cites one. -/
  item : Option Citation.Item

/-- A binder or a field of a declaration with the name and the documentation comment that it takes
in TypeScript. -/
structure Clause where
  /-- The binder or the field as the theory names it. -/
  binder : Lean.Name
  /-- The name that the binder or the field takes in TypeScript. -/
  name : String
  /-- The documentation comment that the field takes in TypeScript, where the theory gives one. -/
  comment : Option Comment

/-- A declaration that the generator writes as TypeScript, with the documentation comment that it
takes in TypeScript, where the theory gives one, and the clauses of its binders and fields. -/
structure Export where
  /-- The declaration that the generator writes. -/
  declaration : Lean.Name
  /-- The documentation comment that the declaration takes in TypeScript, where the theory gives
  one. -/
  comment : Option Comment
  /-- The clauses of the binders and the fields of the declaration. -/
  clauses : List Clause

/-- The record of the declarations that the generator writes as TypeScript. -/
initialize exportExtension : Lean.SimplePersistentEnvExtension Export Unit ←
  Lean.registerSimplePersistentEnvExtension {
    addEntryFn := fun _ _ ↦ ()
    addImportedFn := fun _ ↦ ()
  }

/-- Tells whether a declaration labels a structure: whether it is the structure or a declaration
whose value is the structure, such as `abbrev Coalgebra := @CategoryTheory.Endofunctor.Coalgebra`.
-/
def labels (environment : Lean.Environment) (declaration structureName : Lean.Name) : Bool :=
  declaration == structureName ||
    match (environment.find? declaration).bind (·.value?) with
    | some (.const name _) => name == structureName
    | _ => false

/-- Gives every declaration that the generator writes as TypeScript, those of the imported modules
and those of the current one. -/
def exportsOf (environment : Lean.Environment) : List Export :=
  (List.range environment.header.moduleNames.size).flatMap (fun index ↦
    (exportExtension.getModuleEntries environment index).toList) ++
    exportExtension.getEntries environment

/-- Tells whether the generator writes a declaration as TypeScript. -/
def isExported (environment : Lean.Environment) (declaration : Lean.Name) : Bool :=
  (exportsOf environment).any (·.declaration == declaration)

/-- Gives the documentation comment that a declaration takes in TypeScript, where the theory gives
one. -/
def commentOf? (environment : Lean.Environment) (declaration : Lean.Name) : Option Comment :=
  (exportsOf environment).findSome? fun declared ↦
    if declared.declaration == declaration then declared.comment else none

/-- Gives the clause of a binder of a declaration, where the theory gives one. -/
def clauseOf? (environment : Lean.Environment) (declaration binder : Lean.Name) : Option Clause :=
  (exportsOf environment).findSome? fun declared ↦
    if declared.declaration == declaration then declared.clauses.find? (·.binder == binder)
    else none

/-- Gives the name that a binder of a declaration takes in TypeScript, where the theory names one.
-/
def nameOf? (environment : Lean.Environment) (declaration binder : Lean.Name) : Option String :=
  (clauseOf? environment declaration binder).map (·.name)

/-- Gives the clause of a field of a structure, given by the declaration that labels the structure,
where the theory gives one. -/
def fieldClauseOf? (environment : Lean.Environment) (structureName field : Lean.Name) :
    Option Clause :=
  (exportsOf environment).findSome? fun declared ↦
    if labels environment declared.declaration structureName then
      declared.clauses.find? (·.binder == field)
    else none

end Falkara.ExportTypeScript
