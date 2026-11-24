/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Citation
import Lean.Structure

/-!
# Export TypeScript

The module defines the attribute `export_typescript`, which marks a declaration of the theory that
the generator writes as TypeScript. A declaration takes the attribute as
`attribute [export_typescript] <name>`, and every declaration without the attribute stays in the
theory alone. The attribute may give as well the documentation comment that the declaration takes
in TypeScript in place of its documentation comment in the theory, with the item of the work that
its terms come from, and a clause for every binder or field of the declaration, or of the structure
that the declaration labels, with the name and the documentation comment that it takes in
TypeScript, such as

```
attribute [export_typescript
  "A coalgebra, a state space together with a coalgebra structure on it."
    cite "Definition 1.4.5" jacobs2017introductionCoalgebra
  (F := "Endofunctor")
  (V := "State")
  (str := "structure"
    "The coalgebra structure on the state space."
      cite "Definition 1.4.5" jacobs2017introductionCoalgebra)] Coalgebra
```

## Main Definitions

- `Comment`: a documentation comment that a declaration or a field of it takes in TypeScript, with
  the item of the work that its terms come from, where it cites one.
- `Clause`: a binder or a field of a declaration with the name and the documentation comment that
  it takes in TypeScript.
- `Export`: a declaration that the generator writes as TypeScript, with its comment and its
  clauses.
- `exportExtension`: the record of the declarations that the generator writes as TypeScript.
- `labels`: tells whether a declaration labels a structure.
- `bindersOf`: gives the names that a declaration binds, the binders of its type, its fields and
  those of the structure that it labels, and the object that its definition names where its type
  is a functor.
- `exportComment`, `exportClause`, `exportTypeScript`: the syntax of a comment, of a clause, and of
  the attribute `export_typescript`.
- `commentOfSyntax`: gives the documentation comment that a syntax of a comment states.
- `exportsOf`: gives every declaration that the generator writes as TypeScript.
- `isExported`: tells whether the generator writes a declaration as TypeScript.
- `commentOf?`: gives the documentation comment that a declaration takes in TypeScript, where the
  theory gives one.
- `nameOf?`: gives the name that a binder of a declaration takes in TypeScript, where the theory
  names one.
- `fieldClauseOf?`: gives the clause of a field of a structure, given by the declaration that labels
  the structure, where the theory gives one.

## Implementation Notes

The attribute marks each declaration by hand rather than every declaration of a library, so a
declaration that the theory alone needs, such as a data table licensed otherwise than the packages,
stays out of the packages.

A type parameter or a field takes in TypeScript the term that names what it is, such as `State` for
the carrier of a coalgebra, `Endofunctor` for its functor, or `structure` for its structure, rather
than the letter or the abbreviation that the mathematics gives it, such as `V`, `F`, or `str`, as
the packages lie a layer above Effect, whose own modules name a type lambda `F`.

A field of a structure of Mathlib takes in TypeScript a documentation comment that the theory
gives, as the comments of the packages follow the rules of their copyediting, which the comments
of Mathlib, such as `structure morphism of the coalgebra`, do not. A declaration takes one where
TypeScript writes it as another kind of thing than the theory states it, such as a functor that
TypeScript writes as a type, whose comment opens with an article that a type takes. A comment
cites the work its terms come from where that work is another than the one the declaration cites,
such as Jacobs for the state space of a coalgebra that Mathlib states, so that every term of the
comment comes from a work that the comment cites.

The clauses of a structure of Mathlib lie on the declaration of the theory that labels it, such as
`Coalgebra` for `CategoryTheory.Endofunctor.Coalgebra`, as the label is what the theory writes as
TypeScript, so every setting of the export of a declaration stands in one attribute, and the
generator finds the clauses of a field by the label of its structure.

A clause names its binder or field as `(V := "State")` and takes no keyword of its own, as a
keyword of Lean is a token of every module that imports the attribute, so that a keyword such as
`name` would end the use of `name` as an identifier there.

A module that marks a declaration imports this module twice, as `meta import`, for the attribute
that runs while the module compiles, and as `import`, for the record of the export that the module
holds.

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

/-- Gives the names that a declaration binds: the binders of its type, its fields and those of the
structure that it labels, and the object that its definition names where its type is a functor,
such as `X` of `CategoryTheory.Limits.Types.binaryProductFunctor`, which maps every type `X` to a
functor. -/
def bindersOf (declaration : Lean.Name) : Lean.MetaM (List Lean.Name) := do
  let information ← Lean.getConstInfo declaration
  let environment ← Lean.getEnv
  let labelled := match information.value? with
    | some (.const name _) => [declaration, name]
    | _ => [declaration]
  let fields := labelled.flatMap fun structureName ↦
    if Lean.isStructure environment structureName then
      (Lean.getStructureFieldsFlattened environment structureName).toList
    else []
  -- The definition gives the object of a functor as a function, whose binder names the object.
  let objects ← Lean.Meta.forallTelescope information.type fun arguments body ↦ do
    let body ← Lean.Meta.whnfR body
    let .const `CategoryTheory.Functor levels := body.getAppFn | return []
    let functor := Lean.mkAppN (.const declaration (information.levelParams.map .param)) arguments
    let .lam name .. ← Lean.Meta.whnfD (Lean.mkAppN (.const `CategoryTheory.Functor.obj levels)
        (body.getAppArgs.push functor)) | return []
    return [name]
  return information.type.getForallBinderNames ++ fields ++ objects

/-- The syntax of a documentation comment in TypeScript with the item of the work that its terms
come from, where it cites one. -/
syntax exportComment := str (" cite " str ident)?

/-- The syntax of a clause of a binder or a field, with the name and the documentation comment that
it takes in TypeScript. -/
syntax exportClause := "(" ident " := " str (ppSpace exportComment)? ")"

/-- The syntax of the attribute that marks a declaration that the generator writes as TypeScript,
with the documentation comment that it takes and the clauses of its binders and fields. -/
syntax (name := exportTypeScript)
  "export_typescript" (ppSpace exportComment)? (ppSpace exportClause)* : attr

/-- Gives the documentation comment that a syntax of a comment states, refusing a name that is no
declaration of a work. -/
def commentOfSyntax : Lean.TSyntax ``exportComment → Lean.AttrM Comment
  | `(exportComment| $text:str $[cite $label? $work?]?) => do
    let item ← match label?, work? with
      | some label, some work => some <$> Citation.itemOf label work
      | _, _ => pure none
    return { text := text.getString, item }
  | _ => Lean.throwError "A comment takes its text as a string and the item of the work that its \
      terms come from, where it cites one."

/-- The attribute that marks a declaration that the generator writes as TypeScript, with the
documentation comment that it takes and the clauses of its binders and fields, refusing a name that
the declaration does not bind and a name that is no declaration of a work. -/
initialize Lean.registerBuiltinAttribute {
  name := `exportTypeScript
  descr := "mark a declaration that the generator writes as TypeScript"
  add := fun declaration attributeSyntax _ ↦ do
    let `(attr| export_typescript $[$comment?]? $clauses*) := attributeSyntax
      | Lean.throwError "The attribute takes the comment of the declaration, where it gives one, \
          and a clause for every binder or field that it names."
    let binders ← (bindersOf declaration).run' {} {}
    let clauses : List Clause ← clauses.toList.mapM fun (clause : Lean.TSyntax ``exportClause) ↦ do
      let `(exportClause| ($binder:ident := $name:str $[$fieldComment?]?)) := clause
        | Lean.throwError "A clause takes a binder or a field, the name that it takes in \
            TypeScript, and its comment, where it gives one."
      unless binders.contains binder.getId do
        Lean.throwError m!"`{binder.getId}` is neither a binder nor a field of `{declaration}`."
      let comment ← fieldComment?.mapM commentOfSyntax
      return { binder := binder.getId, name := name.getString, comment }
    let comment ← comment?.mapM commentOfSyntax
    Lean.modifyEnv (exportExtension.addEntry · { declaration, comment, clauses })
}

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

/-- Gives the name that a binder of a declaration takes in TypeScript, where the theory names one.
-/
def nameOf? (environment : Lean.Environment) (declaration binder : Lean.Name) : Option String :=
  (exportsOf environment).findSome? fun declared ↦
    if declared.declaration == declaration then
      (declared.clauses.find? (·.binder == binder)).map (·.name)
    else none

/-- Gives the clause of a field of a structure, given by the declaration that labels the structure,
where the theory gives one. -/
def fieldClauseOf? (environment : Lean.Environment) (structureName field : Lean.Name) :
    Option Clause :=
  (exportsOf environment).findSome? fun declared ↦
    if labels environment declared.declaration structureName then
      declared.clauses.find? (·.binder == field)
    else none

end Falkara.ExportTypeScript
