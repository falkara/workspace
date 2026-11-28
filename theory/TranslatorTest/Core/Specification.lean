module

meta import Translator.Core.Specification

/-!
# Specification

The module defines the checks of the specifications of the core: the table of a function and a
record with such a field read their values from their data, while a record of data, a tuple, and the
three values do not, and a term and a specification compare by their parts.

## Implementation Notes

The checks compare the values with their expected values by `#guard_msgs` on `#eval`, as `#guard`
emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

open Translator.Core

/-- info: [true, true, false, false, false] -/
#guard_msgs in
#eval [(Draw.table "state" .values).reads,
  (Draw.record [("tone", .values), ("next", .table "key" .values)]).reads,
  (Draw.record [("tone", .values), ("next", .values)]).reads,
  (Draw.tuple .rational .unit).reads, Draw.values.reads]

/-- info: [true, false] -/
#guard_msgs in
#eval
  let specification : Specification := {
    name := "pointAt_first"
    documentation := { text := "A point.", addresses := [] }
    variables := [.value "coordinate" .rational]
    hypotheses := []
    haves := []
    left := .bound "coordinate"
    right := .primitive .optionSome [.bound "coordinate"]
    comparison := .values }
  [specification == specification,
    specification == { specification with left := .element (.sample "coordinate") 0 }]
