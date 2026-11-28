/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Target

/-!
# Rules

The module defines the rule by which Effect implements every primitive of the translator: the
arithmetic of the rational numbers by the module `Rational`, the options by the module `Option`, and
the streams by the module `Stream`, each a template of the call of its function on the explicit
arguments of the primitive and the trust that the rule earns.

## Implementation Notes

The rule is a function of the primitive by cases, so a primitive without a rule fails to compile.

The constructors of an option are structural, as `Option.some` and `Option.none` of Effect hold the
values that those of Lean hold, while every function of `Rational` and `Stream` is an assumption,
which a vector checks against the value that the kernel of Lean computes.

The first element and the rest of a sequence have no rule, as a stream of Effect gives them only by
an effect.
-/

public section

namespace Translator.Effect

/-- Gives the rule by which Effect implements a primitive. -/
def rule : Falkara.Translation.Primitive → Target.Rule
  | .rationalLiteral =>
    .implemented (.call (.symbol (.effect "Rational" "fromBigInt")) [.argument 0])
      (.assumption "`Rational.fromBigInt(n)` is the rational number `n`")
  | .rationalNegate =>
    .implemented (.call (.symbol (.effect "Rational" "negate")) [.argument 0])
      (.assumption "`Rational.negate(x)` is `-x`")
  | .rationalAdd =>
    .implemented (.call (.symbol (.effect "Rational" "sum")) [.argument 0, .argument 1])
      (.assumption "`Rational.sum(x, y)` is `x + y`")
  | .rationalSubtract =>
    .implemented (.call (.symbol (.effect "Rational" "subtract")) [.argument 0, .argument 1])
      (.assumption "`Rational.subtract(x, y)` is `x - y`")
  | .rationalMultiply =>
    .implemented (.call (.symbol (.effect "Rational" "multiply")) [.argument 0, .argument 1])
      (.assumption "`Rational.multiply(x, y)` is `x * y`")
  | .optionSome =>
    .implemented (.call (.symbol (.effect "Option" "some")) [.argument 0]) .structural
  | .optionNone => .implemented (.call (.symbol (.effect "Option" "none")) []) .structural
  | .streamMap =>
    .implemented (.call (.symbol (.effect "Stream" "map")) [.argument 1, .argument 0])
      (.assumption "`Stream.map(s, f)` gives `f` of every element of `s`, in order")
  | .sequenceMap =>
    .implemented (.call (.symbol (.effect "Stream" "map")) [.argument 1, .argument 0])
      (.assumption "`Stream.map(s, f)` gives `f` of every element of the sequence `s`, in order")
  | .streamZip =>
    .implemented (.call (.symbol (.effect "Stream" "zip")) [.argument 0, .argument 1])
      (.assumption "`Stream.zip(s, t)` pairs the elements of `s` and `t`, in order")
  | .streamCons =>
    .implemented
      (.call (.symbol (.effect "Stream" "prepend")) [.argument 1, .array [.argument 0]])
      (.assumption "`Stream.prepend(s, [x])` is `x` followed by `s`")
  | .streamTail =>
    .implemented (.call (.symbol (.effect "Stream" "drop")) [.argument 0, .literal (.number 1)])
      (.assumption "`Stream.drop(s, 1)` is `s` after its first element")
  | .sequenceDestruct =>
    .unavailable "a stream of Effect gives its first element and the rest only by an effect, \
      which the translator does not write yet"
  | .streamConst =>
    .implemented
      (.call (.symbol (.effect "Stream" "forever"))
        [.call (.symbol (.effect "Stream" "succeed")) [.argument 0]])
      (.assumption "`Stream.forever(Stream.succeed(x))` repeats `x`")
  | .sequenceNil => .implemented (.symbol (.effect "Stream" "empty")) .structural
  | .sequenceCons =>
    .implemented
      (.call (.symbol (.effect "Stream" "prepend")) [.argument 1, .array [.argument 0]])
      (.assumption "`Stream.prepend(s, [x])` is the sequence `x` followed by `s`")

end Translator.Effect
