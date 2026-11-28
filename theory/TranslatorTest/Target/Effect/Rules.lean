module

meta import Translator.Target.Effect.Rules
meta import Translator.Target.TypeScript.Print
import Falkara.Translation.Vectors

/-!
# Rules

The module defines the checks of the rules of Effect: every primitive takes a rule, the
constructors of an option and the empty sequence are structural, the arithmetic and the streams
assume the statements that vectors check, and the first element of a sequence has none, with the
expression that every implemented rule gives at the arguments `a` and `b`. The audit of the rules
of Effect over the vectors that the theory records refuses none.

## Implementation Notes

The checks compare the rules with their expected values by `#guard_msgs` on `#eval`, as `#guard`
emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

open Translator

/--
info: rationalLiteral: Rational.fromBigInt(a) (assumption)
rationalNegate: Rational.negate(a) (assumption)
rationalAdd: Rational.sum(a, b) (assumption)
rationalSubtract: Rational.subtract(a, b) (assumption)
rationalMultiply: Rational.multiply(a, b) (assumption)
optionSome: Option.some(a) (structural)
optionNone: Option.none() (structural)
streamMap: Stream.map(b, a) (assumption)
sequenceMap: Stream.map(b, a) (assumption)
streamZip: Stream.zip(a, b) (assumption)
streamCons: Stream.prepend(b, [a]) (assumption)
streamTail: Stream.drop(a, 1) (assumption)
sequenceDestruct: unavailable
streamConst: Stream.forever(Stream.succeed(a)) (assumption)
sequenceNil: Stream.empty (structural)
sequenceCons: Stream.prepend(b, [a]) (assumption)
-/
#guard_msgs in
#eval IO.print (String.join (Falkara.Translation.Primitive.all.map fun primitive ↦
  let written := match Effect.rule primitive with
    | .implemented template trust =>
      let expression := (template.instantiate [.identifier "a", .identifier "b"]).map
        TypeScript.Expression.print
      let kind := match trust with
        | .erasure => "erasure"
        | .structural => "structural"
        | .assumption _ => "assumption"
      s!"{expression.getD "none"} ({kind})"
    | .unavailable _ => "unavailable"
  s!"{primitive.word}: {written}\n"))

/-- info: 0 -/
#guard_msgs in
#eval show Lean.CoreM Nat from do
  let environment ← Lean.getEnv
  return (Target.audit Effect.rule fun primitive ↦
    !(Falkara.Translation.vectorsOf environment primitive).isEmpty).length
