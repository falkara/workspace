/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Lean.EnvExtension

/-!
# Export TypeScript

The module defines a declaration that the translator writes as TypeScript, the documentation
comment and the clauses that it takes there, the documentation comments of the functions that the
translator derives from it, each by its role, and the record of every such declaration, which the
attribute `counterpart` of `Falkara.Counterpart` fills while a module compiles and the translator
reads when it runs.

## Implementation Notes

The record lies apart from the attribute, as the translator reads it when it runs and the attribute
fills it while a module compiles, so the record is ordinary code and the attribute a metaprogram,
which imports this module at both phases.

The exports lie in an extension of the environment rather than in a parametric attribute, as a
parametric attribute takes a single value of a fixed form. An export is looked up in the entries of
every module rather than in a state of the extension, as the translator imports the theory without
the states of the extensions, as `TagAttribute.hasTag` of Lean looks a tag up.
-/

public section

namespace Falkara.ExportTypeScript

/-- A binder or a field of a declaration with the name and the documentation comment that it takes
in TypeScript. -/
structure Clause where
  /-- The binder or the field as the theory names it. -/
  binder : Lean.Name
  /-- The name that the binder or the field takes in TypeScript. -/
  name : String
  /-- The documentation comment that the field takes in TypeScript, where the theory gives one. -/
  comment : Option String

/-- The role of a function that the translator derives from a declaration, such as the constructor
of a structure, which takes a documentation comment of its own in TypeScript. -/
inductive Derived where
  /-- The schema of a structure of data or of a refinement. -/
  | schema
  /-- The constructor of a structure or of a class of functors. -/
  | constructor
  /-- The predicates of the axioms of a class of functors. -/
  | axioms
  /-- The instance of the class of functors that a functor or a type constructor takes. -/
  | «instance»
  deriving BEq

/-- The roles in the order that the translator writes their functions in, which their comments
take. -/
def Derived.order : List Derived :=
  [.schema, .constructor, .axioms, .instance]

/-- Gives the word that names a role in the attribute `counterpart`. -/
def Derived.word : Derived → String
  | .schema => "schema"
  | .constructor => "constructor"
  | .axioms => "axioms"
  | .instance => "instance"

/-- A declaration that the translator writes as TypeScript, with the documentation comment that it
takes in TypeScript, the clauses of its binders and fields, and the documentation comments of the
functions that the translator derives from it. -/
structure Export where
  /-- The declaration that the translator writes. -/
  declaration : Lean.Name
  /-- The documentation comment that the declaration takes in TypeScript. -/
  comment : String
  /-- The clauses of the binders and the fields of the declaration. -/
  clauses : List Clause
  /-- The documentation comment that every function the translator derives from the declaration
  takes in TypeScript, by the role of the function. -/
  derived : List (Derived × String)

/-- The record of the declarations that the translator writes as TypeScript. -/
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

/-- Gives every declaration that the translator writes as TypeScript, those of the imported modules
and those of the current one. -/
def exportsOf (environment : Lean.Environment) : List Export :=
  (List.range environment.header.moduleNames.size).flatMap (fun index ↦
    (exportExtension.getModuleEntries environment index).toList) ++
    exportExtension.getEntries environment

/-- Tells whether the translator writes a declaration as TypeScript. -/
def isExported (environment : Lean.Environment) (declaration : Lean.Name) : Bool :=
  (exportsOf environment).any (·.declaration == declaration)

/-- Gives the documentation comment that a declaration takes in TypeScript, where the translator
writes the declaration. -/
def commentOf? (environment : Lean.Environment) (declaration : Lean.Name) : Option String :=
  (exportsOf environment).findSome? fun declared ↦
    if declared.declaration == declaration then some declared.comment else none

/-- Gives the documentation comment in TypeScript of the function of a role that the translator
derives from a declaration, where the theory gives one. -/
def derivedCommentOf? (environment : Lean.Environment) (declaration : Lean.Name) (role : Derived) :
    Option String :=
  (exportsOf environment).findSome? fun declared ↦
    if declared.declaration == declaration then
      (declared.derived.find? (·.1 == role)).map (·.2)
    else none

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
