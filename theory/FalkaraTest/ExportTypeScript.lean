module

meta import Falkara.ExportTypeScript.Defs
import Falkara.ExportTypeScript

/-!
# Export TypeScript

The module defines the checks of the attribute `export_typescript`: the attribute marks the
declaration that takes the attribute and leaves every other declaration unmarked, gives the
declaration the comment that the attribute requires, names the binder and the field that a clause
names and gives the field its comment, leaves every other binder and field unnamed, gives the
fields of a structure through the declaration that labels it, and refuses a name that is neither a
binder nor a field of the declaration.

## Main Definitions

- `markedDeclaration`: the declaration that the checks mark.
- `unmarkedDeclaration`: the declaration that the checks leave unmarked.
- `Shelf`: the structure whose field of items the checks name and comment.
- `Cabinet`: the declaration that labels the shelf and names its field of labels.
- `Rack`: the structure whose binder of the type of its slots the checks name.
-/

public section

open Falkara

/-- The declaration that the checks mark. -/
def markedDeclaration : Nat := 0

attribute [export_typescript "The declaration that the checks mark."] markedDeclaration

/-- The declaration that the checks leave unmarked. -/
def unmarkedDeclaration : Nat := 0

/-- info: (true, false) -/
#guard_msgs in
#eval show Lean.CoreM (Bool × Bool) from do
  let environment ← Lean.getEnv
  return (ExportTypeScript.isExported environment ``markedDeclaration,
    ExportTypeScript.isExported environment ``unmarkedDeclaration)

/-- The structure whose field of items the checks name and comment. -/
structure Shelf where
  /-- The type of the items on the shelf. -/
  Item : Type
  /-- The type of the labels of the shelf. -/
  Label : Type

attribute [export_typescript "A shelf of books."
  (Item := "Book" "The type of the books on the shelf.")] Shelf

/-- The declaration that labels the shelf and names its field of labels. -/
abbrev Cabinet := Shelf

attribute [export_typescript
  "The declaration that labels the shelf and names its field of labels."
  (Label := "Tag")] Cabinet

/-- The structure whose binder of the type of its slots the checks name. -/
structure Rack (S : Type) where
  /-- The slot that the rack holds. -/
  slot : S

attribute [export_typescript
  "The structure whose binder of the type of its slots the checks name."
  (S := "Slot")] Rack

/--
info: (some "A shelf of books.", some "Book", some "The type of the books on the shelf.", some "Tag", none, some "Slot")
-/
#guard_msgs in
#eval show Lean.CoreM (Option String × Option String × Option String × Option String ×
    Option String × Option String) from do
  let environment ← Lean.getEnv
  return ((ExportTypeScript.commentOf? environment ``Shelf).map (·.text),
    (ExportTypeScript.fieldClauseOf? environment ``Shelf `Item).map (·.name),
    ((ExportTypeScript.fieldClauseOf? environment ``Shelf `Item).bind (·.comment)).map (·.text),
    (ExportTypeScript.fieldClauseOf? environment ``Shelf `Label).map (·.name),
    ((ExportTypeScript.fieldClauseOf? environment ``Shelf `Label).bind (·.comment)).map (·.text),
    ExportTypeScript.nameOf? environment ``Rack `S)

/-- error: `Item` is neither a binder nor a field of `unmarkedDeclaration`. -/
#guard_msgs in
attribute [export_typescript "The declaration that the checks leave unmarked."
  (Item := "Mark")] unmarkedDeclaration
