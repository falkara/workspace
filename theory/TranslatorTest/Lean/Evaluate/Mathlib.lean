module

meta import Lean.Elab.Term
meta import Translator.Lean.Evaluate
import Falkara.Counterpart
import Mathlib.Algebra.Field.Rat

/-!
# Mathlib

The module defines the checks of the values that the kernel of Lean reduces expressions to with the
instances of Mathlib: a quotient of two literals, a negated literal, and a decimal literal take
their numerators and their denominators, whether a declaration or an elaborated term gives them, a
structure of the module takes the value of every field, and an expression whose instances an
elaboration leaves unsynthesized, a type without a value, a structure without a counterpart, and a
reduction without fuel take a reason.

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

/-- The point that the checks evaluate. -/
structure Point where
  /-- The first coordinate of the point. -/
  x : Rat
  /-- The second coordinate of the point. -/
  y : Rat

attribute [counterpart
  typescript
    r"The point that the checks evaluate."
    (x
      r"The first coordinate of the point.")
    (y
      r"The second coordinate of the point.")] Point

/-- The point that the checks evaluate, whose coordinates are a quotient and a negated literal. -/
def corner : Point :=
  ⟨1 / 2, -3⟩

/-- The point that the checks leave without a counterpart. -/
structure UnmarkedPoint where
  /-- The coordinate of the point. -/
  x : Rat

/-- The unmarked point that the checks refuse. -/
def unmarkedCorner : UnmarkedPoint :=
  ⟨1⟩

end Checks

/-- info: true -/
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

/--
info: [Translator.Core.Value.rational 1 2, Translator.Core.Value.rational (-3) 1]
-/
#guard_msgs in
#eval show Lean.Elab.TermElabM (List Translator.Core.Value) from do
  let environment ← Lean.getEnv
  [← `((1 / 2 : Rat)), ← `((-3 : Rat))].mapM fun (term : Lean.Term) ↦ do
    let expression ← Lean.Elab.Term.elabTerm term none
    Lean.Elab.Term.synthesizeSyntheticMVarsNoPostponing
    match Translator.Lean.Evaluate.valueOf environment .anonymous `term 256 (Lean.mkConst ``Rat)
        (← Lean.instantiateMVars expression) with
    | .ok value => pure value
    | .error refusal => Lean.throwError refusal.render

/--
info: Translator.Core.Value.structure
  { declaration := `Checks.Point,
    module := `TranslatorTest.Lean.Evaluate.Mathlib,
    words := ["Point"],
    takesModuleName := false }
  [("x", Translator.Core.Value.rational 1 2), ("y", Translator.Core.Value.rational (-3) 1)]
-/
#guard_msgs in
#eval show Lean.MetaM Translator.Core.Value from do
  match Translator.Lean.Evaluate.valueOf (← Lean.getEnv) `Checks ``Checks.corner 256
      (Lean.mkConst ``Checks.Point) (Lean.mkConst ``Checks.corner) with
  | .ok value => pure value
  | .error refusal => Lean.throwError refusal.render

/--
error: `term` has no value in TypeScript, as `1 /
  2` holds a variable or a metavariable, which the kernel of Lean never reduces.
-/
#guard_msgs in
#eval show Lean.Elab.TermElabM Translator.Core.Value from do
  let expression ← Lean.instantiateMVars (← Lean.Elab.Term.elabTerm (← `((1 / 2 : Rat))) none)
  match Translator.Lean.Evaluate.valueOf (← Lean.getEnv) .anonymous `term 256
      (Lean.mkConst ``Rat) expression with
  | .ok value => pure value
  | .error refusal => Lean.throwError refusal.render

/--
error: `Checks.unmarkedCorner` has no value in TypeScript, as `Checks.UnmarkedPoint` is no structure that the theory gives a counterpart in TypeScript.
---
error: `Checks.half` has no value in TypeScript, as `Option ℚ` has none.
---
error: `Checks.half` has no translation, as reading it takes more steps than its depth and the unfoldings of the translator allow.
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  let environment ← Lean.getEnv
  let readings := [
    Translator.Lean.Evaluate.valueOf environment `Checks ``Checks.unmarkedCorner 256
      (Lean.mkConst ``Checks.UnmarkedPoint) (Lean.mkConst ``Checks.unmarkedCorner),
    Translator.Lean.Evaluate.valueOf environment `Checks ``Checks.half 256
      (Lean.mkApp (Lean.mkConst ``Option [.zero]) (Lean.mkConst ``Rat)) (Lean.mkConst ``Checks.half),
    Translator.Lean.Evaluate.valueOf environment `Checks ``Checks.half 0 (Lean.mkConst ``Rat)
      (Lean.mkConst ``Checks.half)]
  readings.forM fun
    | .ok _ => pure ()
    | .error refusal => Lean.logError refusal.render
