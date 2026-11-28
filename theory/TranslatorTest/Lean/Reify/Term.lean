module

meta import Translator.Lean.Reify
meta import Translator.Lean.Reify.Term
import Falkara.Translation.Rules
import all TranslatorTest.Fixture.Point

/-!
# Term

The module defines the checks of the trees that the reading gives the terms of a theorem: a local by
its name, a constant that a rule tells of without a lookup, a function of the theory, and the
constructor of a structure of the theory with the names of its fields, and the explicit arguments of
each.

## Implementation Notes

The checks compare the heads and the explicit arguments of the trees with their expected values
rather than the trees themselves, as a tree carries the expressions of Lean it was read from, by
`#guard_msgs` on `#eval`, as `#guard` emits no message on success, which the linter
`linter.hashCommand` of Mathlib refuses.
-/

open Translator Translator.Lean

/--
info: [("Option.some", "plain", ["Geometry.Point.mk"]),
  ("Geometry.Point.mk", "constructor of Point with first", ["coordinate"]),
  ("Geometry.pointAt", "function pointAt", ["coordinate"])]
-/
#guard_msgs in
#eval show Lean.MetaM (List (String × String × List String)) from do
  let rules ← rulesOf
  Lean.Meta.forallTelescope (← Lean.getConstInfo ``Geometry.pointAt_first).type
    fun _ conclusion ↦ do
      let .app (.app _ left) right := conclusion | return []
      let summary := fun (tree : TermTree) ↦ match tree with
        | .apply constant head arguments _ _ =>
          let written := match head with
            | .plain => "plain"
            | .projection field _ => s!"projection {field}"
            | .constructor reference fields _ =>
              s!"constructor of {"".intercalate reference.words} with {", ".intercalate fields}"
            | .function reference => s!"function {"".intercalate reference.words}"
          let explicit := arguments.filterMap fun
            | .mk (.apply name _ _ _ _) true => some name.toString
            | .mk (.bound name _) true => some name
            | _ => none
          [(constant.toString, written, explicit)]
        | _ => []
      let right ← reifyTerm rules `Geometry (fuelOf right) right
      let left ← reifyTerm rules `Geometry (fuelOf left) left
      let inner := match right with
        | .apply _ _ [_, .mk inner _] _ _ => summary inner
        | _ => []
      return summary right ++ inner ++ summary left
