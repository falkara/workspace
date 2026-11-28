module

public meta import Falkara.Translation
public meta import Translator.Lean.Elaborate.Theorem

/-!
# Theorem

The module defines the checks of the translation of the tree of a theorem into a specification of
the core: the first element of a stream that the test draws reads its data, and a theorem without a
comment refuses for the reason of its terms before the lack of its comment.

## Implementation Notes

The checks compare the specifications with their expected values by `#guard_msgs` on `#eval`, as
`#guard` emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

public section

open Translator Translator.Lean

/-- The tree of a theorem that the checks translate, with a stream that the test draws. -/
meta def theoremOf (documentation : Except Refusal Core.Documentation) (right : TermTree) :
    TheoremTree := {
  name := "cons_head"
  documentation
  variables := [.stream "rests" .unit true]
  hypotheses := []
  haves := []
  left := .apply `Stream'.head .plain
    [.mk (.bound "A" (.const `A [])) false, .mk (.bound "rests" (.const `rests [])) true] none
    (.const `head [])
  right
  comparison := .values }

/-- The context that the checks translate in. -/
meta def theoremContext : Elaborate.TermContext := {
  rules := [{ constant := `Stream'.head, arity := 2, domain := none, action := .structural .head }]
  streams := []
  unavailable := fun _ ↦ none }

/--
info: Except.ok (Translator.Core.Term.element (Translator.Core.Term.sample "rests") 0)
-/
#guard_msgs in
#eval ((theoremOf (Except.ok { text := "A test.", addresses := [] })
  (.bound "rests" (.const `rests []))).toSpecification theoremContext).map (·.left) |>.mapError
    fun _ ↦ "refused"

/-- error: `unknown` has no expression in a test of TypeScript. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  match (theoremOf (Except.error (.noComment `cons_head))
      (.other (.const `unknown []))).toSpecification
      theoremContext with
  | .ok _ => pure ()
  | .error refusal => Lean.throwError refusal.render
