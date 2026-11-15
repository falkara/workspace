import Citation
import Lean.DocString
import Lean.Meta.Reduce

/-!
# Comment

The module defines the documentation comment of TypeScript that a declaration of the theory takes: the documentation comment of the declaration as the theory writes it, with a tag `@see` for the item of the work that the declaration cites. The tag gives the page of the item where the work has a page for every item, such as an entry of the vocabulary of the CIE, and the DOI of the work otherwise.

## Implementation Notes

A comment keeps its formulas in LaTeX between `$`, as the documentation sets them as MathML Core from LaTeX.

A comment reads the address of an item and the DOI of a work by reducing the declaration of the work, as evaluating the declaration takes code that Lean marks `unsafe`.
-/

namespace Generator

/-- Gives the text of a string field of a work, such as its DOI, where the field holds some text. -/
def textOf (field work : Lean.Name) : Lean.MetaM (Option String) := do
  match ← Lean.Meta.reduce (Lean.mkApp (Lean.mkConst field) (Lean.mkConst work)) with
  | .app (.app (.const ``Option.some _) _) (.lit (.strVal text)) => return some text
  | _ => return none

/-- Gives the address that the tag `@see` of a declaration names, the page of the item the declaration cites or the DOI of the work, where the declaration cites one. -/
def addressOf (name : Lean.Name) : Lean.MetaM (Option String) := do
  let some item := Citation.citeAttribute.getParam? (← Lean.getEnv) name | return none
  if let some address ← textOf ``Citation.Work.itemAddress item.work then
    return some s!"{address}{item.label}"
  if let some doi ← textOf ``Citation.Work.doi item.work then
    return some s!"https://doi.org/{doi}"
  Lean.throwError m!"`{name}` cites `{item.work}`, which has neither a page for every item nor a DOI."

/-- Gives the documentation comment of TypeScript of a declaration, with a text that opens the comment in place of the first word of the documentation comment of the theory, where one is given, and indented by the spaces given. -/
def commentOf (name : Lean.Name) (indentation : String) (opening : Option String := none) :
    Lean.MetaM String := do
  let some documentation ← Lean.findDocString? (← Lean.getEnv) name
    | Lean.throwError m!"`{name}` has no documentation comment."
  let documentation := documentation.trimAscii.copy
  let text := match opening with
    | some opening => s!"{opening} {documentation.decapitalize}"
    | none => documentation
  match ← addressOf name with
  | some address =>
    return s!"{indentation}/**\n{indentation} * {text}\n{indentation} *\n{indentation} * @see {address}\n{indentation} */\n"
  | none => return s!"{indentation}/** {text} */\n"

end Generator
