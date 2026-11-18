/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Mathlib.Data.Nat.Notation
public import Lean.Attributes
import Lean.Elab.InfoTree.Main

/-!
# Citation

The module defines a work that the theory cites, a file of a data set, an item of a work, and the
attribute `cite` that records for a declaration the item the declaration states. A declaration
cites the item as `attribute [cite "<label>" <work>] <name>`, with `<label>` the label of the item
as the work writes it and `<work>` the name of the work in the module `Falkara.References`. The
attribute refuses every name that is no declaration of a work, so a citation of a work the theory
never declares fails to elaborate. The works that a module cites, each with its files, follow from
the citations of the module.

## Main Definitions

- `File`: a file of a data set, with the address the file is published at and the SHA-256 of the
  file.
- `Work`: a work that the theory cites, with the fields a bibliography gives it.
- `Item`: an item of a work, such as a section, an equation, or a column of a data table.
- `cite`: the syntax of the attribute that cites the item of a work a declaration states.
- `citeAttribute`: the attribute that cites the item of a work a declaration states, refusing a
  name that is no declaration of a work.

## Implementation Notes

The attribute looks a work up in the module `Falkara.References`, which holds every work, so a
citation names the work without the namespace of the module.
-/

@[expose] public section

namespace Falkara.Citation

/-- A file of a data set, with the address the file is published at and the SHA-256 of the file. -/
structure File where
  /-- The name of the file as the data set writes it. -/
  name : String
  /-- The address the file is published at. -/
  url : String
  /-- The SHA-256 of the file, in hexadecimal digits. -/
  sha256 : String

/-- A work that the theory cites, with the fields a bibliography gives it. -/
structure Work where
  /-- The author of the work, a person or an organization. -/
  author : String
  /-- The title of the work as the work writes it. -/
  title : String
  /-- The year in which the work was published. -/
  year : ℕ
  /-- The publisher of the work with its place, where the work names one. -/
  publisher : Option String := none
  /-- The DOI of the work, where the work has one. -/
  doi : Option String := none
  /-- The address that the label of an item follows to give the page of the item, where every item
  of the work has a page of its own. -/
  itemAddress : Option String := none
  /-- The license of the work, where the work names one. -/
  license : Option String := none
  /-- The files of the work that the theory formalizes, where the work is a data set. -/
  files : List File := []

/-- An item of a work, such as a section, an equation, or a column of a data table. -/
structure Item where
  /-- The label of the item as the work writes it. -/
  label : String
  /-- The name of the declaration of the work. -/
  work : Lean.Name
  deriving Inhabited, Repr

/-- The syntax of the attribute that cites the item of a work a declaration states. -/
syntax (name := cite) "cite " str ident : attr

/-- The attribute that cites the item of a work a declaration states, refusing a name that is no
declaration of a work. -/
initialize citeAttribute : Lean.ParametricAttribute Item ←
  Lean.registerParametricAttribute {
    name := `cite
    descr := "cite the item of a work that a declaration states"
    getParam := fun _ attributeSyntax ↦ match attributeSyntax with
      | `(attr| cite $label:str $work:ident) => do
        -- The work is named as in the module `Falkara.References`, which holds every work.
        let name ← Lean.Elab.realizeGlobalConstNoOverloadWithInfo
          (Lean.mkIdentFrom work (`Falkara.References ++ work.getId))
        let information ← Lean.getConstInfo name
        unless information.type == Lean.mkConst ``Work do
          Lean.throwError m!"`{name}` is no declaration of a work, as its type is \
            `{information.type}` rather than `Citation.Work`."
        pure { label := label.getString, work := name }
      | _ => Lean.throwError
        "A citation takes the label of the item as a string and the name of the work."
  }

end Falkara.Citation
