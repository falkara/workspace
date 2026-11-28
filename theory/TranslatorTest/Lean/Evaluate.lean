module

meta import Translator.Lean.Evaluate

/-!
# Evaluate

The module defines the checks of the values that the kernel of Lean reduces rational numbers to
without Mathlib, by the instances of the core of Lean alone: a quotient of two literals, a negated
literal, and a decimal literal take their numerators and their denominators. The module `Mathlib`
beside it checks the same values with the instances of Mathlib.

## Implementation Notes

The checks compare the values with their expected values by `#guard_msgs` on `#eval`, as `#guard`
emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

public section

namespace Checks

/-- The rational number that the checks write as a quotient of two literals. -/
def half : Rat := 1 / 2

/-- The rational number that the checks write as a negated literal. -/
def minusThree : Rat := -3

/-- The rational number that the checks write as a decimal literal. -/
def pointFive : Rat := 0.5

end Checks

/-- info: false -/
#guard_msgs in
#eval show Lean.MetaM Bool from do
  return ((← Lean.getEnv).getModuleIdx? `Mathlib.Data.Rat.Defs).isSome

/--
info: [Translator.Core.Value.rational 1 2, Translator.Core.Value.rational (-3) 1, Translator.Core.Value.rational 1 2]
-/
#guard_msgs in
#eval show Lean.MetaM (List Translator.Core.Value) from do
  let environment ← Lean.getEnv
  [``Checks.half, ``Checks.minusThree, ``Checks.pointFive].mapM fun name ↦
    match Translator.Lean.Evaluate.valueOf environment .anonymous name 256 (Lean.mkConst ``Rat)
        (Lean.mkConst name) with
    | .ok value => pure value
    | .error refusal => Lean.throwError refusal.render
