/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public meta import Falkara.ExportTypeScript.Defs
public import Falkara.Citation
public import Falkara.ExportTypeScript.Defs
public import Lean.Meta.Basic

import Lean.Structure

/-!
# Export TypeScript

The module defines the attribute `export_typescript`, which marks a declaration of the theory that
the generator writes as TypeScript. A declaration takes the attribute as
`attribute [export_typescript "<comment>"] <name>`, and every declaration without the attribute
stays in the theory alone. The attribute gives the documentation comment that the declaration takes
in TypeScript, apart from its documentation comment in the theory, with the item of the work that
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

- `objectFieldsOf`: gives the structure that a functor gives at every object and its fields, where
  it gives one.
- `bindersOf`: gives the names that a declaration binds, the binders of its type, its fields and
  those of the structure that it labels, the object that its definition names where its type is a
  functor, and the structure that the functor gives at every object with its fields.
- `exportComment`, `exportClause`, `exportTypeScript`: the syntax of a comment, of a clause, and of
  the attribute `export_typescript`.
- `commentOfSyntax`: gives the documentation comment that a syntax of a comment states.

## Implementation Notes

The attribute marks each declaration by hand rather than every declaration of a library, so a
declaration that the theory alone needs, such as a data table licensed otherwise than the packages,
stays out of the packages.

A type parameter or a field takes in TypeScript the term that names what it is, such as `State` for
the carrier of a coalgebra, `Endofunctor` for its functor, or `structure` for its structure, rather
than the letter or the abbreviation that the mathematics gives it, such as `V`, `F`, or `str`, as
the packages lie a layer above Effect, whose own modules name a type lambda `F`.

Every declaration and every field that TypeScript writes takes its comment from the attribute,
which requires the comment of the declaration, and never from the documentation comment of the
theory, as the theory speaks of mathematics and TypeScript to the developers who use Effect, even
where the two comments say the same. A comment cites the work its terms come from where that work
is another than the one the declaration cites, such as Jacobs for the state space of a coalgebra
that Mathlib states, so that every term of the comment comes from a work that the comment cites.

The clauses of a structure of Mathlib lie on the declaration of the theory that labels it, such as
`Coalgebra` for `CategoryTheory.Endofunctor.Coalgebra`, as the label is what the theory writes as
TypeScript, so every setting of the export of a declaration stands in one attribute, and the
generator finds the clauses of a field by the label of its structure.

A clause names its binder or field as `(V := "State")` and takes no keyword of its own, as a
keyword of Lean is a token of every module that imports the attribute, so that a keyword such as
`name` would end the use of `name` as an identifier there.

The attribute runs while a module compiles, so it lies in a meta section, and it writes into the
record of `Falkara.ExportTypeScript.Defs`, which it imports at both phases.
-/

public meta section

namespace Falkara.ExportTypeScript

/-- Gives the structure that a functor gives at every object and its fields, such as `Prod` with
`fst` and `snd` for the product that the functor of binary products gives, where it gives one,
following the functors that a curried functor gives, with at most as many steps as the fuel. -/
def objectFieldsOf : (fuel : Nat) → (functor type : Lean.Expr) → Lean.MetaM (List Lean.Name)
  | 0, _, _ => return []
  | fuel + 1, functor, type => do
  let type ← Lean.Meta.whnfR type
  let .const `CategoryTheory.Functor levels := type.getAppFn | return []
  Lean.Meta.withLocalDeclD `object (type.getArg! 0) fun object ↦ do
    let image := Lean.mkAppN (.const `CategoryTheory.Functor.obj levels)
      (type.getAppArgs ++ #[functor, object])
    let imageType ← Lean.Meta.inferType image
    if (← Lean.Meta.whnfR imageType).isAppOf `CategoryTheory.Functor then
      return ← objectFieldsOf fuel image imageType
    let .const structureName _ := (← Lean.Meta.whnfD image).getAppFn | return []
    let environment ← Lean.getEnv
    return if Lean.isStructure environment structureName then
      structureName :: (Lean.getStructureFields environment structureName).toList
    else []

/-- Gives the names that a declaration binds: the binders of its type, its fields and those of the
structure that it labels, the object that its definition names where its type is a functor, such as
`X` of `CategoryTheory.Limits.Types.binaryProductFunctor`, which maps every type `X` to a functor,
and the structure that the functor gives at every object with its fields, such as `Prod` with `fst`
and `snd` for the product that the functor gives. -/
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
  -- A functor names the structure that it gives and its fields, such as the product of a functor of
  -- binary products, through at most two functors, as a curried functor gives a functor in turn.
  let objectFields ← Lean.Meta.forallTelescope information.type fun arguments body ↦
    objectFieldsOf 2
      (Lean.mkAppN (.const declaration (information.levelParams.map .param)) arguments) body
  return information.type.getForallBinderNames ++ fields ++ objects ++ objectFields

/-- The syntax of a documentation comment in TypeScript with the item of the work that its terms
come from, where it cites one. -/
syntax exportComment := str (" cite " str ident)?

/-- The syntax of a clause of a binder or a field, with the name and the documentation comment that
it takes in TypeScript. -/
syntax exportClause := "(" ident " := " str (ppSpace exportComment)? ")"

/-- The syntax of the attribute that marks a declaration that the generator writes as TypeScript,
with the documentation comment that it takes, which the syntax requires, and the clauses of its
binders and fields. -/
syntax (name := exportTypeScript)
  "export_typescript" ppSpace exportComment (ppSpace exportClause)* : attr

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
    let `(attr| export_typescript $comment:exportComment $clauses*) := attributeSyntax
      | Lean.throwError "The attribute takes the comment of the declaration and a clause for every \
          binder or field that it names."
    let binders ← (bindersOf declaration).run' {} {}
    let clauses : List Clause ← clauses.toList.mapM fun (clause : Lean.TSyntax ``exportClause) ↦ do
      let `(exportClause| ($binder:ident := $name:str $[$fieldComment?]?)) := clause
        | Lean.throwError "A clause takes a binder or a field, the name that it takes in \
            TypeScript, and its comment, where it gives one."
      unless binders.contains binder.getId do
        Lean.throwError m!"`{binder.getId}` is neither a binder nor a field of `{declaration}`."
      let comment ← fieldComment?.mapM commentOfSyntax
      return { binder := binder.getId, name := name.getString, comment }
    let comment ← commentOfSyntax comment
    Lean.modifyEnv (exportExtension.addEntry · { declaration, comment, clauses })
}

end Falkara.ExportTypeScript
