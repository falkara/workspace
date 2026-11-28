module

meta import Translator.Target
meta import Translator.Target.TypeScript.Print

/-!
# Target

The module defines the checks of the rules of a target: a template takes the expressions of the
arguments of an application at its holes and gives none where it names an argument that the
application does not give, the reason of a primitive that the target does not implement is read
from its rule, and the audit refuses an assumption without a vector alone, never a structural rule
or a verified assumption.

## Implementation Notes

The checks compare the expressions and the refusals with their expected values by `#guard_msgs` on
`#eval`, as `#guard` emits no message on success, which the linter `linter.hashCommand` of Mathlib
refuses.
-/

open Translator Translator.Target

/-- info: [some "Rational.sum(x, [y])", none] -/
#guard_msgs in
#eval
  let template := Template.call (.symbol (.effect "Rational" "sum"))
    [.argument 0, .array [.argument 1]]
  [(template.instantiate [.identifier "x", .identifier "y"]).map (·.print),
    (template.instantiate [.identifier "x"]).map (·.print)]

/--
error: The rule of the target for `rationalAdd` assumes that the sum is the sum, and no vector checks it.
---
info: [none, some "a sum of two values is out of reach"]
-/
#guard_msgs in
#eval show Lean.MetaM (List (Option String)) from do
  let rule : Falkara.Translation.Primitive → Rule := fun
    | .rationalAdd => .implemented (.argument 0) (.assumption "the sum is the sum")
    | .rationalSubtract => .implemented (.argument 0) (.assumption "the difference is the difference")
    | .rationalMultiply => .unavailable "a sum of two values is out of reach"
    | _ => .implemented (.argument 0) .structural
  (audit rule (· == .rationalSubtract)).forM fun refusal ↦ Lean.logError refusal.render
  return [unavailableOf rule .rationalAdd, unavailableOf rule .rationalMultiply]
