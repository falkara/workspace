module

public meta import Falkara.Translation
public meta import Translator.Target.Lean.Print

/-!
# Print

The module defines the checks of the text of Lean that the types and the values of the core take: a
computation by the reader of a result that may fail, the object of a functor that is a parameter by
the object of a functor, the object of a type constructor that is a parameter by its application, a
function type by its binders, and a value by its rational numbers and pairs, while a type that
applies a declaration of the theory gives the reason why it has no text.

## Implementation Notes

The checks compare the texts with their expected values by `#guard_msgs` on `#eval`, as `#guard`
emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

public section

open Translator

/-- The context that the checks print in, with the formers and the object of a functor. -/
meta def printContext : LeanTarget.Context := {
  rules := [{ constant := `Rat, arity := 0, domain := none, action := .type .rational },
    { constant := `ReaderT, arity := 3, domain := none, action := .type .reader },
    { constant := `Except, arity := 2, domain := none, action := .type .except },
    { constant := `Prod, arity := 2, domain := none, action := .type .product },
    { constant := `CategoryTheory.Functor.obj, arity := 6, domain := none,
      action := .structural .functorObject }]
  functors := ["F"]
  target := "target" }

/--
info: [Except.ok "(ReaderT R (Except E) target)",
 Except.ok "(CategoryTheory.Functor.obj F (m target))",
 Except.ok "((state : State) → (Prod Rat target))",
 Except.error "a declaration of the theory takes its arguments in the order of a target",
 Except.ok "(((1 : Rat) / 2), ((-3 : Rat) / 1))"]
-/
#guard_msgs in
#eval [LeanTarget.TypeTerm.toLean printContext
    (.effect .target (.parameter "E") (.parameter "R")),
  LeanTarget.TypeTerm.toLean printContext
    (.apply (.parameter "F") (.apply (.parameter "m") .target)),
  LeanTarget.TypeTerm.toLean printContext
    (.function [] [.mk "state" (.parameter "State")]
      (.product none [.mk "fst" .rational, .mk "snd" .target])),
  LeanTarget.TypeTerm.toLean printContext
    (.named { declaration := `Shelf, module := `Shelf, words := ["Shelf"] } [] []),
  LeanTarget.Value.toLean printContext (.pair (.rational 1 2) (.rational (-3) 1))]
