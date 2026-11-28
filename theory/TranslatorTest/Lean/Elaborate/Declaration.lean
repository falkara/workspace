module

public meta import Falkara.Translation
meta import Translator.Lean.Elaborate.Declaration

/-!
# Declaration

The module defines the checks of the declarations of the core that the trees of a declaration
take: a type alias with a type parameter whose default value is a type constructor and another
whose default value is a type, a bundled structure whose extension has no translation, which it
leaves out, and a reason where a field has no type.

## Implementation Notes

The checks compare the declarations with their expected values by `#guard_msgs` on `#eval`, as
`#guard` emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

public section

open Translator Translator.Lean

/-- The rules of the formers that the checks read, as the list of the rules of the translator gives
them. -/
meta def formers : List Falkara.Translation.Rule :=
  [(`Rat, 0, .rational), (`Option, 1, .option)].map fun (constant, arity, former) ↦
    { constant, arity, domain := none, action := .type former }

/--
info: Except.ok (Translator.Core.Declaration.alias
  { declaration := `Shelf, module := `Shelf, words := ["Shelf"], takesModuleName := true }
  { text := "A shelf.", addresses := [] }
  [{ name := "Box",
     kind := Translator.Core.ParameterKind.constructor,
     default := some (Translator.Core.Argument.constructor (Translator.Core.Constructor.option)) },
   { name := "Item",
     kind := Translator.Core.ParameterKind.type,
     default := some (Translator.Core.Argument.type (Translator.Core.TypeTerm.rational)) }]
  (Translator.Core.TypeTerm.option (Translator.Core.TypeTerm.parameter "Item")))
-/
#guard_msgs in
#eval show Except String _ from
  (Declaration.toCore { rules := formers, identity := none }
    (.alias
      { declaration := `Shelf, module := `Shelf, words := ["Shelf"], takesModuleName := true }
      { text := "A shelf.", addresses := [] }
      [{ name := "Box", kind := .constructor
         default := some (.constant `Option [] (.const `Option [])) },
        { name := "Item", kind := .type, default := some (.constant `Rat [] (.const `Rat [])) }]
      (.constant `Option [.parameter "Item" (.const `Item [])] (.const `Option [])))).mapError
    (fun _ ↦ "refused")

/-- info: Except.ok none -/
#guard_msgs in
#eval
  (Declaration.toCore { rules := formers, identity := none }
    (.bundle
      { declaration := `Shelf, module := `Shelf, words := ["Shelf"], takesModuleName := true }
      { text := "A shelf.", addresses := [] } { text := "Creates a shelf.", addresses := [] } []
      (some (.constant `Nat [] (.const `Nat [])))
      [{ name := "item"
         documentation := { text := "The item.", addresses := [] }
         type := .constant `Rat [] (.const `Rat []) }])).map
    (fun
      | .bundle _ _ _ _ extended _ => extended
      | _ => none) |>.mapError (fun _ ↦ "refused")

/--
error: `Nat` has no declaration in TypeScript, as the theory never gives it a counterpart in TypeScript.
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  if let .error refusal := Declaration.toCore { rules := formers, identity := none }
      (.structure
        { declaration := `Shelf, module := `Shelf, words := ["Shelf"], takesModuleName := true }
        { text := "A shelf.", addresses := [] } { text := "Creates a shelf.", addresses := [] } []
        [{ name := "count"
           documentation := { text := "The count.", addresses := [] }
           type := .constant `Nat [] (.const `Nat []) }]) then
    Lean.throwError refusal.render
