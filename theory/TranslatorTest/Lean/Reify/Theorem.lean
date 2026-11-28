module

meta import Translator.Lean.Reify.Theorem
import Falkara.Translation.Rules
import all TranslatorTest.Fixture.Point

/-!
# Theorem

The module defines the checks of the trees that the reading gives the theorems of the theory: the
data that a test draws for every variable, by the schema of a structure of data, the hypotheses, and
the way a test compares the two sides, as values, and a reason where the theorem has no equation.

## Implementation Notes

The checks compare the parts of the trees that hold no expression of Lean with their expected
values by `#guard_msgs` on `#eval`, as `#guard` emits no message on success, which the linter
`linter.hashCommand` of Mathlib refuses.
-/

open Translator Translator.Lean

/--
info: ("pointAt_eq",
 [Translator.Core.Variable.value
    "first"
    (Translator.Core.Draw.schema
      { declaration := `Geometry.Coordinate,
        module := `TranslatorTest.Fixture.Coordinate,
        words := ["Coordinate"],
        takesModuleName := true }),
  Translator.Core.Variable.value
    "second"
    (Translator.Core.Draw.schema
      { declaration := `Geometry.Coordinate,
        module := `TranslatorTest.Fixture.Coordinate,
        words := ["Coordinate"],
        takesModuleName := true })],
 [true],
 Translator.Core.Comparison.values)
-/
#guard_msgs in
#eval show Lean.MetaM (String × List Core.Variable × List Bool × Core.Comparison) from do
  reifyTheorem `Geometry ``Geometry.pointAt_eq fun tree ↦
    pure (tree.name, tree.variables, tree.hypotheses.map (·.1), tree.comparison)

/-- error: `Type` is no equation that a test can check. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  reifyTheorem `Geometry ``Geometry.Point fun _ ↦ pure ()
