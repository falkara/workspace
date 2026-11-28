module

meta import Falkara.Translation
import Falkara.Translation.Rules
import Falkara.TranslationRule

/-!
# Translation Rule

The module defines the checks of the commands `translation_rule` and `translation_vector`. The
command records a rule with its constant, as Lean resolves it, its number of arguments, the type of
its first argument where the rule holds at one type alone, and its action, a former, a structural
part, a primitive, or an erasure, and a rule at one type comes before a rule at every type. It
refuses a name that names no constant, a number of arguments beyond the binders of the type of the
constant, an erasure beyond the arguments, a word that names no former, and a second rule of one
constant at one number of arguments and one type. The command `translation_vector` records a
vector of a primitive. The list of the rules gives the sum of two rational numbers its primitive at
`Rat` alone.

## Implementation Notes

The checks compare the records with their expected values by `#guard_msgs` on `#eval`, as `#guard`
emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

public section

namespace Checks

/-- The constant that the checks give rules. -/
def scale (factor : Nat) (value : Nat) : Nat :=
  factor * value

/-- The closed declaration that the checks give as a vector. -/
def doubledThree : Nat :=
  scale 2 3

end Checks

translation_rule Checks.scale 2 primitive rationalMultiply
translation_rule Checks.scale 2 at Nat erase 1
translation_rule Checks.scale 1 structural pair
translation_vector rationalMultiply Checks.doubledThree

/--
info: [{ constant := `Checks.scale,
   arity := 2,
   domain := none,
   action := Falkara.Translation.Action.primitive (Falkara.Translation.Primitive.rationalMultiply) },
 { constant := `Checks.scale, arity := 2, domain := some `Nat, action := Falkara.Translation.Action.erase 1 },
 { constant := `Checks.scale,
   arity := 1,
   domain := none,
   action := Falkara.Translation.Action.structural (Falkara.Translation.Structural.pair) }]
-/
#guard_msgs in
#eval show Lean.CoreM (List Falkara.Translation.Rule) from do
  return (Falkara.Translation.rulesOf (← Lean.getEnv)).filter (·.constant == ``Checks.scale)

/--
info: [some (Falkara.Translation.Action.erase 1),
 some (Falkara.Translation.Action.primitive (Falkara.Translation.Primitive.rationalMultiply))]
-/
#guard_msgs in
#eval show Lean.CoreM (List (Option Falkara.Translation.Action)) from do
  let rules := Falkara.Translation.rulesOf (← Lean.getEnv)
  return [(Falkara.Translation.ruleOf? rules ``Checks.scale 2 (some ``Nat)).map (·.action),
    (Falkara.Translation.ruleOf? rules ``Checks.scale 2 (some ``Int)).map (·.action)]

/-- info: [{ primitive := Falkara.Translation.Primitive.rationalMultiply, declaration := `Checks.doubledThree }] -/
#guard_msgs in
#eval show Lean.CoreM (List Falkara.Translation.Vector) from do
  return Falkara.Translation.vectorsOf (← Lean.getEnv) .rationalMultiply

/--
info: [some (Falkara.Translation.Action.primitive (Falkara.Translation.Primitive.rationalAdd)), none]
-/
#guard_msgs in
#eval show Lean.CoreM (List (Option Falkara.Translation.Action)) from do
  let rules := Falkara.Translation.rulesOf (← Lean.getEnv)
  return [(Falkara.Translation.ruleOf? rules ``HAdd.hAdd 6 (some ``Rat)).map (·.action),
    (Falkara.Translation.ruleOf? rules ``HAdd.hAdd 6 (some ``Nat)).map (·.action)]

/-- error: Unknown constant `Checks.scal` -/
#guard_msgs in
translation_rule Checks.scal 2 primitive rationalMultiply

/-- error: `Checks.scale` takes at most 2 arguments, as its type binds no more. -/
#guard_msgs in
translation_rule Checks.scale 3 primitive rationalMultiply

/--
error: An erasure keeps one of the 2 arguments of the application, so its index lies below 2.
-/
#guard_msgs in
translation_rule Checks.scale 2 at Int erase 2

/--
error: `rationals` is no former, as the formers are `rational`, `string`, `boolean`, `unit`, `option`, `array`, `stream`, `sequence`, `product`, `sum`, `reader`, `except`, `identity`.
-/
#guard_msgs in
translation_rule Checks.scale 0 type rationals

/-- error: `Checks.scale` has a rule at 2 arguments already. -/
#guard_msgs in
translation_rule Checks.scale 2 primitive rationalAdd
