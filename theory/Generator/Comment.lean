/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Citation
public import Falkara.ExportTypeScript
public import Lean.Meta.Basic

import Lean.Meta.Reduce

/-!
# Comment

The module defines the documentation comment of TypeScript that a declaration of the theory takes:
the comment that the attribute `counterpart` gives the declaration, with a tag `@see` for the item
of the work that the declaration cites. The tag gives the page of the item where
the work has a page for every item, such as an entry of the vocabulary of the CIE, and the DOI of
the work followed by the label of the item otherwise, such as
`https://doi.org/10.1017/CBO9781316823187 Definition 1.4.5`, as the DOI leads to the work alone.

## Implementation Notes

A function that the generator derives from a declaration, a schema, a constructor, the predicates
of axioms, or an instance of the class of functors, takes the comment that the attribute gives
under its role, such as `constructor`, rather than the comment of the declaration, which the type of
the function already names, or a sentence that the generator composes from the names of the
declaration, which says no more than the type. The generator fails where the attribute gives no
comment under the role, so no function goes without one.

A comment keeps its formulas in LaTeX between `$`, as the documentation sets them as MathML Core
from LaTeX.

Every comment comes from the attribute `counterpart` and never from the documentation comment of
the theory, as the theory speaks of mathematics and TypeScript to the developers who use Effect.

A comment reads the address of an item and the DOI of a work by reducing the declaration of the
work, as evaluating the declaration takes code that Lean marks `unsafe`.
-/

public section

namespace Generator

open Falkara

/-- Gives the text of a string field of a work, such as its DOI, where the field holds some text. -/
def textOf (field work : Lean.Name) : Lean.MetaM (Option String) := do
  match ← Lean.Meta.reduce (Lean.mkApp (Lean.mkConst field) (Lean.mkConst work)) with
  | .app (.app (.const ``Option.some _) _) (.lit (.strVal text)) => return some text
  | _ => return none

/-- Gives the address that a tag `@see` names for an item of a work, the page of the item where the
work has a page for every item and the DOI of the work followed by the label of the item otherwise,
or fails with the reason where the work has neither. -/
def addressOf (item : Citation.Item) : Lean.MetaM String := do
  if let some address ← textOf ``Citation.Work.itemAddress item.work then
    return s!"{address}{item.label}"
  if let some doi ← textOf ``Citation.Work.doi item.work then
    return s!"https://doi.org/{doi} {item.label}"
  Lean.throwError m!"`{item.work}` has neither a page for every item nor a DOI."

/-- Gives the documentation comment of TypeScript of a text, its lines joined into one paragraph,
with a tag `@see` for every item that it cites, each address once. -/
def documentationOf (text : String) (items : List Citation.Item) : Lean.MetaM String := do
  -- A comment wraps at 100 columns as the theory writes it, and its lines join into one paragraph,
  -- as Markdown reads them.
  let text := " ".intercalate ((text.trimAscii.copy.splitOn "\n").map (·.trimAscii.copy))
  let addresses := (← items.mapM addressOf).eraseDups
  if addresses.isEmpty then return s!"/** {text} */\n"
  return s!"/**\n * {text}\n *\n{String.join (addresses.map (s!" * @see {·}\n"))} */\n"

/-- Gives the documentation comment of TypeScript of a declaration, the comment that the attribute
`counterpart` gives, with a tag `@see` for the item that the declaration cites. -/
def commentOf (name : Lean.Name) : Lean.MetaM String := do
  let environment ← Lean.getEnv
  let some comment := ExportTypeScript.commentOf? environment name
    | Lean.throwError m!"`{name}` has no documentation comment in TypeScript, as the theory never \
        gives it a counterpart in TypeScript."
  documentationOf comment (Citation.citationOf? environment name).toList

/-- Gives the documentation comment of TypeScript of a field of a structure, the comment that the
clause of the attribute `counterpart` on the declaration that labels the structure gives, with a
tag `@see` for the item that the field cites. -/
def fieldCommentOf (structureName field : Lean.Name) : Lean.MetaM String := do
  let environment ← Lean.getEnv
  let some comment :=
      (ExportTypeScript.fieldClauseOf? environment structureName field).bind (·.comment)
    | Lean.throwError m!"The field `{field}` of `{structureName}` has no documentation comment in \
        TypeScript, as no clause of the attribute `counterpart` gives it one."
  documentationOf comment (Citation.citationOf? environment (structureName ++ field)).toList

/-- Gives the documentation comment of TypeScript of the function of a role that the generator
derives from a declaration, such as its constructor, the comment that the attribute `counterpart`
gives under the role, with a tag `@see` for the item that the declaration cites, or fails with the
reason where the attribute gives none. -/
def derivedCommentOf (name : Lean.Name) (role : ExportTypeScript.Derived) :
    Lean.MetaM String := do
  let environment ← Lean.getEnv
  let some comment := ExportTypeScript.derivedCommentOf? environment name role
    | Lean.throwError m!"`{name}` has no comment of its {role.word} in TypeScript, as its \
        attribute `counterpart` gives none under `{role.word}`."
  documentationOf comment (Citation.citationOf? environment name).toList

end Generator
