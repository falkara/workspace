module

public import Falkara.Citation

meta import Falkara.Citation
meta import Falkara.ExportTypeScript
import Falkara.Counterpart

/-!
# Counterpart

The module defines the checks of the attribute `counterpart`. The attribute records the item of a
work that a declaration states, looking the work up in the namespace `Falkara.References` and
keeping the label of the item as the citation writes it or, where the label names a declaration of
Lean, as its full name, and the item that a field states, of the work of the declaration unless
the clause of the field names another. It refuses a name that names no declaration, as the label
or as the work, a declaration that is no work, a second citation of one declaration, a declaration
of another module, a clause of no field, and a clause of a field that names no work where the
declaration cites none. The attribute marks the declaration that takes a counterpart in TypeScript
and leaves every other declaration unmarked, gives the declaration the comment that the attribute
requires, names the binder and the field that a clause names and gives the field its comment, keeps
the name of a field whose clause names none, gives the fields of a structure through the
declaration that labels it, and refuses a name that is neither a binder nor a field of the
declaration, a clause in TypeScript with neither a name nor a comment, two clauses of one field,
and a second counterpart in TypeScript. The attribute records the comment that a function the
generator derives from the declaration takes under each of the roles `schema`, `constructor`,
`axioms`, and `instance`, and none where the attribute gives none, still takes a clause for a field
named as a role, and refuses a second comment of one role and a comment out of the order of the
roles. The checks cite works of their own, so they hold for the works of every theory.
-/

public section

open Falkara

namespace Falkara.References

/-- The work that the checks cite. -/
def Checks.work : Citation.Work where
  author := "Falkara"
  title := "The Work of the Checks"
  year := 2026

/-- The table that the checks cite beside the work. -/
def Checks.table : Citation.Work where
  author := "Falkara"
  title := "The Table of the Checks"
  year := 2026

end Falkara.References

/-- The declaration that the checks cite an item of a work for. -/
@[counterpart Checks.work "Section 1"]
def citedDeclaration : ℕ := 0

/-- info: some { label := "Section 1", work := `Falkara.References.Checks.work } -/
#guard_msgs in
#eval show Lean.CoreM (Option Citation.Item) from do
  return Citation.citationOf? (← Lean.getEnv) ``citedDeclaration

/-- error: `citedDeclaration` cites an item already. -/
#guard_msgs in
attribute [counterpart Checks.work "Section 2"] citedDeclaration

/-- error: `Nat.succ` lies in another module, which alone cites it. -/
#guard_msgs in
attribute [counterpart Checks.work "Section 1"] Nat.succ

/-- The declaration that the checks cite by the name of a declaration of Lean. -/
@[counterpart Checks.work Nat.succ]
def declarationCitingAName : ℕ := 0

/-- info: some { label := "Nat.succ", work := `Falkara.References.Checks.work } -/
#guard_msgs in
#eval show Lean.CoreM (Option Citation.Item) from do
  return Citation.citationOf? (← Lean.getEnv) ``declarationCitingAName

/-- The declaration that the checks cite a work for that the theory never declares. -/
def declarationCitingAnUnknownWork : ℕ := 0

/-- error: Unknown constant `Nat.succc` -/
#guard_msgs in
attribute [counterpart Checks.work Nat.succc] declarationCitingAnUnknownWork

/-- error: Unknown constant `Falkara.References.Checks.wrok` -/
#guard_msgs in
attribute [counterpart Checks.wrok "Section 1"] declarationCitingAnUnknownWork

namespace Falkara.References

/-- The declaration among the works that is no work. -/
def Checks.number : ℕ := 0

end Falkara.References

/-- The declaration that the checks cite a declaration for that is no work. -/
def declarationCitingANumber : ℕ := 0

/-- error: `Falkara.References.Checks.number` is no declaration of a work, as its type is `ℕ` rather than `Citation.Work`. -/
#guard_msgs in
attribute [counterpart Checks.number "Section 1"] declarationCitingANumber

/-- error: A counterpart takes at least one of the item of a work that the declaration states, the items that its fields state, and its counterpart in TypeScript. -/
#guard_msgs in
attribute [counterpart] declarationCitingANumber

/-- The structure whose fields the checks cite, the first of the work of the structure and the
second of the table. -/
@[counterpart Checks.work "Section 2"
  (first := "Section 2.1")
  (second := Checks.table "Column 1")]
structure Pair where
  /-- The first value of the pair. -/
  first : ℕ
  /-- The second value of the pair. -/
  second : ℕ

/--
info: (some { label := "Section 2.1", work := `Falkara.References.Checks.work },
 some { label := "Column 1", work := `Falkara.References.Checks.table })
-/
#guard_msgs in
#eval show Lean.CoreM (Option Citation.Item × Option Citation.Item) from do
  let environment ← Lean.getEnv
  return (Citation.citationOf? environment ``Pair.first,
    Citation.citationOf? environment ``Pair.second)

/-- The structure whose clauses the checks refuse. -/
structure Single where
  /-- The value of the structure. -/
  value : ℕ

/-- error: `other` is no field of `Single`. -/
#guard_msgs in
attribute [counterpart Checks.work "Section 3" (other := "Section 3.1")] Single

/-- error: `value` is no field of `citedDeclaration`. -/
#guard_msgs in
attribute [counterpart (value := Checks.work "Section 1.1")] citedDeclaration

/-- error: The clause of `value` takes the work of its item, as the declaration cites none. -/
#guard_msgs in
attribute [counterpart (value := "Section 3.1")] Single

/-- error: The clause of `value` takes a name or a comment in TypeScript. -/
#guard_msgs in
attribute [counterpart
  typescript
    r"The structure whose clauses the checks refuse."
    (value)] Single

/-- error: A binder or a field takes one clause alone in the items and one in TypeScript. -/
#guard_msgs in
attribute [counterpart Checks.work "Section 3"
  (value := "Section 3.1")
  (value := "Section 3.2")] Single

/-- The structure whose field the checks cite by the name of a declaration of Lean, of the work of
the structure. -/
@[counterpart Checks.work "Section 5"
  (value := Nat.succ)]
structure Named where
  /-- The value of the structure. -/
  value : ℕ

/-- info: some { label := "Nat.succ", work := `Falkara.References.Checks.work } -/
#guard_msgs in
#eval show Lean.CoreM (Option Citation.Item) from do
  return Citation.citationOf? (← Lean.getEnv) ``Named.value

/-- The declaration that the checks give a counterpart in TypeScript. -/
@[counterpart
  typescript
    r"The declaration that the checks mark."]
def markedDeclaration : ℕ := 0

/-- The declaration that the checks leave unmarked. -/
def unmarkedDeclaration : ℕ := 0

/-- info: (true, false) -/
#guard_msgs in
#eval show Lean.CoreM (Bool × Bool) from do
  let environment ← Lean.getEnv
  return (ExportTypeScript.isExported environment ``markedDeclaration,
    ExportTypeScript.isExported environment ``unmarkedDeclaration)

/-- error: `markedDeclaration` has a counterpart in TypeScript already. -/
#guard_msgs in
attribute [counterpart
  typescript
    r"The declaration that the checks mark again."] markedDeclaration

/-- The structure whose field of items the checks name and comment. -/
@[counterpart
  typescript
    r"A shelf of books."
    (Item → "Book"
      r"The type of the books on the shelf.")]
structure Shelf where
  /-- The type of the items on the shelf. -/
  Item : Type
  /-- The type of the labels of the shelf. -/
  Label : Type

/-- The declaration that labels the shelf and names its field of labels. -/
@[counterpart
  typescript
    r"The declaration that labels the shelf and names its field of labels."
    (Label → "Tag")]
abbrev Cabinet := Shelf

/-- The structure whose binder of the type of its slots the checks name. -/
@[counterpart
  typescript
    r"The structure whose binder of the type of its slots the checks name."
    (S → "Slot")]
structure Rack (S : Type) where
  /-- The slot that the rack holds. -/
  slot : S

/-- The structure whose field keeps its name in TypeScript. -/
@[counterpart
  typescript
    r"The structure whose field keeps its name in TypeScript."
    (content
      r"The content of the crate.")]
structure Crate where
  /-- The content of the crate. -/
  content : ℕ

/--
info: (some "A shelf of books.", some "Book", some "The type of the books on the shelf.", some "Tag", none, some "Slot",
  some "content")
-/
#guard_msgs in
#eval show Lean.CoreM (Option String × Option String × Option String × Option String ×
    Option String × Option String × Option String) from do
  let environment ← Lean.getEnv
  return (ExportTypeScript.commentOf? environment ``Shelf,
    (ExportTypeScript.fieldClauseOf? environment ``Shelf `Item).map (·.name),
    (ExportTypeScript.fieldClauseOf? environment ``Shelf `Item).bind (·.comment),
    (ExportTypeScript.fieldClauseOf? environment ``Shelf `Label).map (·.name),
    (ExportTypeScript.fieldClauseOf? environment ``Shelf `Label).bind (·.comment),
    ExportTypeScript.nameOf? environment ``Rack `S,
    (ExportTypeScript.fieldClauseOf? environment ``Crate `content).map (·.name))

/-- error: `Item` is neither a binder nor a field of `unmarkedDeclaration`. -/
#guard_msgs in
attribute [counterpart
  typescript
    r"The declaration that the checks leave unmarked."
    (Item → "Mark")] unmarkedDeclaration

/-- The structure that the checks cite and give a counterpart in TypeScript at once. -/
@[counterpart Checks.work "Section 4"
  (coordinate := "Section 4.1")
  typescript
    r"A point by its coordinate $\bar{c}$, which keeps every backslash as written."
    (coordinate
      r"The coordinate of the point.")]
structure Point where
  /-- The coordinate of the point. -/
  coordinate : ℕ

/--
info: (some { label := "Section 4", work := `Falkara.References.Checks.work },
 some { label := "Section 4.1", work := `Falkara.References.Checks.work },
 some "A point by its coordinate $\\bar{c}$, which keeps every backslash as written.",
 some "The coordinate of the point.")
-/
#guard_msgs in
#eval show Lean.CoreM (Option Citation.Item × Option Citation.Item × Option String ×
    Option String) from do
  let environment ← Lean.getEnv
  return (Citation.citationOf? environment ``Point,
    Citation.citationOf? environment ``Point.coordinate,
    ExportTypeScript.commentOf? environment ``Point,
    (ExportTypeScript.fieldClauseOf? environment ``Point `coordinate).bind (·.comment))

/-- The structure whose field takes the name of a role and whose derived functions the checks
comment under every role. -/
@[counterpart
  typescript
    r"A form by its schema."
    (schema
      r"The schema that the form follows.")
    schema
      r"A schema of a form, which decodes the schema that the form follows."
    constructor
      r"Creates a form from its schema $\bar{s}$, which keeps every backslash as written."
    axioms
      r"Gives the axioms of a form as predicates."
    instance
      r"Gives the instance of a form."]
structure Form where
  /-- The schema of the form. -/
  schema : ℕ

/--
info: (some "The schema that the form follows.", some "A schema of a form, which decodes the schema that the form follows.",
  some "Creates a form from its schema $\\bar{s}$, which keeps every backslash as written.",
  some "Gives the axioms of a form as predicates.", some "Gives the instance of a form.", none)
-/
#guard_msgs in
#eval show Lean.CoreM (Option String × Option String × Option String × Option String ×
    Option String × Option String) from do
  let environment ← Lean.getEnv
  return ((ExportTypeScript.fieldClauseOf? environment ``Form `schema).bind (·.comment),
    ExportTypeScript.derivedCommentOf? environment ``Form .schema,
    ExportTypeScript.derivedCommentOf? environment ``Form .constructor,
    ExportTypeScript.derivedCommentOf? environment ``Form .axioms,
    ExportTypeScript.derivedCommentOf? environment ``Form .instance,
    ExportTypeScript.derivedCommentOf? environment ``Point .constructor)

/-- error: `constructor` takes one comment alone. -/
#guard_msgs in
attribute [counterpart
  typescript
    r"The declaration that the checks leave unmarked."
    constructor
      r"Creates the declaration."
    constructor
      r"Creates the declaration once more."] unmarkedDeclaration

/-- error: `schema` stands before `constructor`, as the comments take the order `schema`, `constructor`, `axioms`, and `instance`. -/
#guard_msgs in
attribute [counterpart
  typescript
    r"The declaration that the checks leave unmarked."
    constructor
      r"Creates the declaration."
    schema
      r"A schema of the declaration."] unmarkedDeclaration
