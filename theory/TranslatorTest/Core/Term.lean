module

meta import Translator.Core.Term

/-!
# Term

The module defines the checks of the terms of the core: a pair with the names of its fields and a
tuple of the same components are two terms, and a primitive keeps its arguments in order.

## Implementation Notes

The checks compare the terms with their expected values by `#guard_msgs` on `#eval`, as `#guard`
emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

open Translator.Core

/--
info: Translator.Core.Term.primitive
  (Falkara.Translation.Primitive.streamCons)
  [Translator.Core.Term.element (Translator.Core.Term.sample "keys") 0, Translator.Core.Term.bound "rest"]
-/
#guard_msgs in
#eval Term.primitive .streamCons [.element (.sample "keys") 0, .bound "rest"]

/-- info: false -/
#guard_msgs in
#eval Term.pair (some ("tone", "next")) (.bound "x") (.bound "y") ==
  Term.pair none (.bound "x") (.bound "y")
