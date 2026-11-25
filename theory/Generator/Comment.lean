/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Citation.Defs
public import Lean.Meta.Basic

import Falkara.ExportTypeScript.Defs
import Lean.Meta.Reduce

/-!
# Comment

The module defines the documentation comment of TypeScript that a declaration of the theory takes:
the comment that the attribute `export_typescript` gives the declaration, with a tag `@see` for the
item of the work that the declaration cites and for the item of the work that the terms of the
comment come from, where the attribute `export_typescript` cites one. The tag gives the page of the
item where the work has a page for every item, such as an entry of the vocabulary of the CIE, and
the DOI of the work followed by the label of the item otherwise, such as
`https://doi.org/10.1017/CBO9781316823187 Definition 1.4.5`, as the DOI leads to the work alone.

## Main Definitions

- `textOf`: gives the text of a string field of a work, such as its DOI, where the field holds
  some text.
- `addressOf`: gives the address that a tag `@see` names for an item of a work, the page of the
  item or the DOI of the work followed by the label of the item.
- `documentationOf`: gives the documentation comment of TypeScript of a text, with a tag `@see` for
  every item that it cites.
- `commentOf`: gives the documentation comment of TypeScript of a declaration, the comment that the
  attribute `export_typescript` gives, with a text that opens the comment in place of its first
  word, where one is given, and a tag `@see` for the item that the declaration cites and for the
  item that the comment cites.
- `fieldCommentOf`: gives the documentation comment of TypeScript of a field of a structure, the
  comment that a clause of the attribute `export_typescript` gives, with a tag `@see` for the item
  it cites.
- `articledOf`: gives a name of TypeScript in backticks after the indefinite article it takes.
- `fieldsOf`: gives the fields of a structure as a comment of TypeScript lists them.
- `derivedCommentOf`: gives the documentation comment of TypeScript of a function that the
  generator derives from a declaration, such as its constructor, with the citations of the
  declaration.

## Implementation Notes

A function that the generator derives from a declaration, such as a constructor, a brand, the
predicates of axioms, or an instance of the class of functors, takes a comment that says what the
function does with the names of TypeScript, such as ``Creates a `StreamCoalgebra` from its field
`structure`.``, rather than the comment of the declaration, which the type of the function already
names.

A comment keeps its formulas in LaTeX between `$`, as the documentation sets them as MathML Core
from LaTeX.

Every comment comes from the attribute `export_typescript` and never from the documentation comment
of the theory, as the theory speaks of mathematics and TypeScript to the developers who use Effect.

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
`export_typescript` gives, with a text that opens the comment in place of its first word, where one
is given, and a tag `@see` for the item that the declaration cites and for the item that the
comment cites. -/
def commentOf (name : Lean.Name) (opening : Option String := none) : Lean.MetaM String := do
  let environment ← Lean.getEnv
  let some comment := ExportTypeScript.commentOf? environment name
    | Lean.throwError m!"`{name}` has no documentation comment in TypeScript, as the attribute \
        `export_typescript` marks it nowhere."
  let text := match opening with
    | some opening => s!"{opening} {comment.text.decapitalize}"
    | none => comment.text
  documentationOf text
    ((Citation.citationOf? environment name).toList ++ comment.item.toList)

/-- Gives the documentation comment of TypeScript of a field of a structure, the comment that the
clause of the attribute `export_typescript` on the declaration that labels the structure gives,
with a tag `@see` for the item that the field cites and for the item that the comment cites. -/
def fieldCommentOf (structureName field : Lean.Name) : Lean.MetaM String := do
  let environment ← Lean.getEnv
  let some comment :=
      (ExportTypeScript.fieldClauseOf? environment structureName field).bind (·.comment)
    | Lean.throwError m!"The field `{field}` of `{structureName}` has no documentation comment in \
        TypeScript, as no clause of the attribute `export_typescript` gives it one."
  documentationOf comment.text
    ((Citation.citationOf? environment (structureName ++ field)).toList ++ comment.item.toList)

/-- Gives a name of TypeScript in backticks after the indefinite article it takes, such as
``an `Option` `` or ``a `Coalgebra` ``. -/
def articledOf (name : String) : String :=
  let article := if name.front.toLower ∈ ['a', 'e', 'i', 'o', 'u'] then "an" else "a"
  s!"{article} `{name}`"

/-- Gives the fields of a structure as a comment of TypeScript lists them, such as ``field
`structure` `` or ``fields `X`, `Y`, and `Z` ``. -/
def fieldsOf (fields : List String) : String :=
  let quoted := fields.map (s!"`{·}`")
  match quoted with
  | [field] => s!"field {field}"
  | [first, second] => s!"fields {first} and {second}"
  | _ => s!"fields {", ".intercalate quoted.dropLast}, and {quoted.getLastD ""}"

/-- Gives the documentation comment of TypeScript of a function that the generator derives from a
declaration, such as its constructor, with a text that says what the function does and a tag
`@see` for the item that the declaration cites and for the item that its comment cites. -/
def derivedCommentOf (name : Lean.Name) (text : String) : Lean.MetaM String := do
  let environment ← Lean.getEnv
  documentationOf text ((Citation.citationOf? environment name).toList ++
    ((ExportTypeScript.commentOf? environment name).bind (·.item)).toList)

end Generator
