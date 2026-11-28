/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Citation
public import Translator.Core.Declaration
public import Translator.Refusal

import Lean.DeclarationRange

/-!
# Source

The module defines what the records of the theory give a module: the declarations and the theorems
that the attribute `counterpart` gives a counterpart, in the order of their lines, the reference to
a declaration with the words of its name, the name that a field takes in a target, and the
documentation that the attribute gives a declaration, a field, or a function that a target derives
from a declaration, with the address of every item of a work that the declaration cites: the page
of the item where the work has a page for every item, and the DOI of the work followed by the label
of the item otherwise, such as `https://doi.org/10.1017/CBO9781316823187 Definition 1.4.5`, as the
DOI leads to the work alone.

## Implementation Notes

The reading takes the environment alone and no computation of Lean, so it reads the address of an
item and the DOI of a work by the kernel of Lean, which reduces the field of the declaration of the
work, as evaluating the declaration takes code that Lean marks `unsafe`.

A comment wraps at 100 columns as the theory writes it, and its lines join into one paragraph, as
Markdown reads them.

The words of a name are told apart from the theory alone, the words of the name of a declaration
after the namespace of its package and the name of its module, so every target joins the same
words by its own conventions, and a declaration that takes the name of its module, such as the
structure `StreamCoalgebra` in the module `StreamCoalgebra`, keeps its name, as `Option.Option` of
Effect does.
-/

public section

namespace Translator.Lean.Source

open Falkara

/-- The declarations and the theorems of a module of the theory that the attribute `counterpart`
gives a counterpart, each in the order of their lines. -/
structure Module where
  /-- The module of the theory. -/
  module : Lean.Name
  /-- The declarations of the module, which are no theorems. -/
  declarations : List Lean.Name
  /-- The theorems of the module. -/
  theorems : List Lean.Name
  deriving Repr, DecidableEq

/-- Gives what the records of the theory give a module of the theory, its declarations and its
theorems that the attribute `counterpart` gives a counterpart, each in the order of their lines. -/
def moduleOf (environment : Lean.Environment) (module : Lean.Name) : Module :=
  let marked := match environment.getModuleIdx? module with
    | some index => match environment.header.moduleData[index.toNat]? with
      | some data => data.constNames.toList.filter (ExportTypeScript.isExported environment ·)
      | none => []
    | none => []
  let ordered := (marked.map fun name ↦
      (name, ((Lean.declRangeExt.find? environment name).map (·.range.pos.line)).getD 0)).mergeSort
    fun first second ↦ first.snd ≤ second.snd
  let isTheorem := fun (name : Lean.Name) ↦ environment.find? name matches some (.thmInfo _)
  {
    module
    declarations := (ordered.filter (!isTheorem ·.1)).map Prod.fst
    theorems := (ordered.filter (isTheorem ·.1)).map Prod.fst }

/-- Gives the words of the name of a declaration after the namespace of its package. -/
def wordsOf (packageNamespace name : Lean.Name) : List String :=
  (name.replacePrefix packageNamespace .anonymous).components.map (·.toString)

/-- Gives the words of the name of a declaration after the namespace of its package and the name of
its module, such as `behavior` for `StreamCoalgebra.behavior` in the module `StreamCoalgebra`, and
none where the declaration takes the name of its module, such as `StreamCoalgebra` itself. -/
def localWordsOf (packageNamespace module name : Lean.Name) : List String :=
  match wordsOf packageNamespace name, module with
  | first :: rest, .str _ last => if first.toLower == last.toLower then rest else first :: rest
  | words, _ => words

/-- Gives the module of the theory that declares a declaration, or the module being written where
the declaration lies in no imported module. -/
def declaringModuleOf (environment : Lean.Environment) (name : Lean.Name) : Lean.Name :=
  ((environment.getModuleIdxFor? name).bind fun index ↦
    environment.header.moduleNames[index.toNat]?).getD environment.mainModule

/-- Gives the reference to a declaration of the theory, with the words of its name after the name
of its module, or the words of the name of the module where the declaration takes it. -/
def referenceOf (environment : Lean.Environment) (packageNamespace name : Lean.Name) :
    Core.Reference :=
  let module := declaringModuleOf environment name
  let localWords := localWordsOf packageNamespace module name
  {
    declaration := name
    module
    words := if localWords.isEmpty then wordsOf packageNamespace name else localWords
    takesModuleName := localWords.isEmpty }

/-- Gives the name that a field of a structure takes in a target, as the clause of the attribute
`counterpart` on the declaration that labels the structure names it or else as the structure names
it. -/
def fieldNameOf (environment : Lean.Environment) (structureName field : Lean.Name) : String :=
  ((ExportTypeScript.fieldClauseOf? environment structureName field).map (·.name)).getD
    field.toString

/-- Gives the text of a string field of a work, such as its DOI, where the field holds some text,
as the kernel of Lean reduces it. -/
def textOf (environment : Lean.Environment) (field work : Lean.Name) : Option String :=
  match Lean.Kernel.whnf environment {} (Lean.mkApp (Lean.mkConst field) (Lean.mkConst work)) with
  | .ok (.app (.app (.const ``Option.some _) _) (.lit (.strVal text))) => some text
  | _ => none

/-- Gives the address that a comment cites for an item of a work, the page of the item where the
work has a page for every item and the DOI of the work followed by the label of the item otherwise,
or refuses where the work has neither. -/
def addressOf (environment : Lean.Environment) (item : Citation.Item) : Except Refusal String :=
  match textOf environment ``Citation.Work.itemAddress item.work,
      textOf environment ``Citation.Work.doi item.work with
  | some address, _ => pure s!"{address}{item.label}"
  | none, some doi => pure s!"https://doi.org/{doi} {item.label}"
  | none, none => throw (.noAddress item.work)

/-- Gives the documentation of a text, its lines joined into one paragraph, with the address of
every item that it cites, each once, or refuses where a work has no address. -/
def documentationOf (environment : Lean.Environment) (text : String)
    (items : List Citation.Item) : Except Refusal Core.Documentation := do
  return {
    text := " ".intercalate ((text.trimAscii.copy.splitOn "\n").map (·.trimAscii.copy))
    addresses := (← items.mapM (addressOf environment)).eraseDups }

/-- Gives the documentation of a declaration, the comment that the attribute `counterpart` gives,
with the address of the item that the declaration cites, or refuses where the attribute gives
none. -/
def commentOf (environment : Lean.Environment) (name : Lean.Name) :
    Except Refusal Core.Documentation := do
  let some comment := ExportTypeScript.commentOf? environment name | throw (.noComment name)
  documentationOf environment comment (Citation.citationOf? environment name).toList

/-- Gives the documentation of a field of a structure, the comment that the clause of the attribute
`counterpart` on the declaration that labels the structure gives, with the address of the item that
the field cites, or refuses where no clause gives one. -/
def fieldCommentOf (environment : Lean.Environment) (structureName field : Lean.Name) :
    Except Refusal Core.Documentation := do
  let some comment :=
      (ExportTypeScript.fieldClauseOf? environment structureName field).bind (·.comment)
    | throw (.noFieldComment structureName field)
  documentationOf environment comment
    (Citation.citationOf? environment (structureName ++ field)).toList

/-- Gives the documentation of the function of a role that a target derives from a declaration,
such as its constructor, the comment that the attribute `counterpart` gives under the role, with the
address of the item that the declaration cites, or refuses where the attribute gives none. -/
def derivedCommentOf (environment : Lean.Environment) (name : Lean.Name)
    (role : ExportTypeScript.Derived) : Except Refusal Core.Documentation := do
  let some comment := ExportTypeScript.derivedCommentOf? environment name role
    | throw (.noDerivedComment name role)
  documentationOf environment comment (Citation.citationOf? environment name).toList

end Translator.Lean.Source
