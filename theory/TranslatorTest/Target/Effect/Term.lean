module

meta import Translator.Target.Effect.Term
meta import Translator.Target.TypeScript.Print

/-!
# Term

The module defines the checks of the expressions of Effect that the terms of the core take: a
variable that the test draws reads its value from its data, and a parameter of a function of the
same name shadows it, the data by its name, a record and a tuple of a pair, the component of each,
the call of a function and the construction of a structure of the package after the namespace of its
module, a morphism applied to an argument, and the rules of the primitives, the prefix of a stream
after its first element among them.

## Implementation Notes

The checks compare the printed expressions with the text that the translator writes by
`#guard_msgs` on `#eval`, as `#guard` emits no message on success, which the linter
`linter.hashCommand` of Mathlib refuses.
-/

open Translator Translator.Effect

/--
info: Stream.map(Stream.fromIterable(value), (value) => value.tone)
Organ.play(organ, keys[0], { tone: x, next: y })
Point.make({ first: [x, y][1] })
Stream.prepend(Stream.drop(Stream.fromIterable(value), 1), [step(key)])
Rational.fromBigInt(3n)
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  let context : TermContext :=
    { theory := `Fixture, readers := [("value", .call (.symbol (.effect "Stream" "fromIterable"))
        [.identifier "value"])] }
  let organ : Core.Reference :=
    { declaration := `Organ.play, module := `Fixture.Organ, words := ["play"] }
  let point : Core.Reference :=
    { declaration := `Point, module := `Fixture.Point, words := ["Point"], takesModuleName := true }
  let terms : List Core.Term :=
    [.primitive .streamMap [.lambda "value" (.field (.bound "value") "tone"), .bound "value"],
      .global organ
        [.bound "organ", .element (.sample "keys") 0, .pair (some ("tone", "next")) (.bound "x")
          (.bound "y")],
      .construct point [("first", .element (.pair none (.bound "x") (.bound "y")) 1)],
      .primitive .streamCons
        [.apply (.bound "step") (.bound "key"), .primitive .streamTail [.bound "value"]],
      .primitive .rationalLiteral [.natural 3]]
  match terms.mapM (lowerTerm context) with
  | .ok lowered => IO.print ("\n".intercalate (lowered.map (·.print)))
  | .error refusal => Lean.throwError refusal.render

/-- error: The rule of the target for `sequenceDestruct` names an argument that the application of the primitive does not give. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  match lowerTerm { theory := `Fixture, readers := [] } (.primitive .sequenceDestruct []) with
  | .ok _ => pure ()
  | .error refusal => Lean.throwError refusal.render
