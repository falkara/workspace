/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Lean.EnvExtension
public import Mathlib.Data.Nat.Notation

/-!
# Citation

The module defines a work that the theory cites, a file of a data set, an item of a work, and the
record of the item that every declaration of the theory states, which the attribute `counterpart`
of `Falkara.Counterpart` fills while a module compiles and the translator reads when it runs.

## Implementation Notes

The record lies apart from the attribute, as the translator reads it when it runs and the attribute
fills it while a module compiles, so the record is ordinary code and the attribute a metaprogram,
which imports this module at both phases.
-/

public section

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

/-- The record of the item of a work that every declaration of the theory states. -/
initialize citationExtension : Lean.MapDeclarationExtension Item ← Lean.mkMapDeclarationExtension

/-- Gives the item of a work that a declaration states, where the theory cites one. -/
def citationOf? (environment : Lean.Environment) (declaration : Lean.Name) : Option Item :=
  citationExtension.find? environment declaration

end Falkara.Citation
