/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Mathlib.Data.Seq.Defs
public import Mathlib.Tactic.ToAdditive

import Falkara.TranslationRule

/-!
# Vectors

The module gives every primitive whose rule assumes a statement of its target a vector: a closed
declaration that applies the primitive to values, whose value the kernel of Lean computes, against
which a target checks the expression that its rule gives the same application. A rational number
takes its value, and a stream and a sequence the values of their first elements.

## Implementation Notes

A vector applies its primitive to literals and to the primitives that build streams and sequences
alone, so a target writes it by its rules and the kernel of Lean computes it, and a vector checks
the rule of its primitive together with the rules of its arguments, each of which its own vector
checks.

A stream repeats a value from its third element on, so a prefix of three elements tells apart the
primitives of the streams, and a sequence ends after two elements, so its prefix holds every one.
-/

@[expose] public section

namespace Falkara.Translation.Vectors

/-- The rational number of a literal. -/
def rationalLiteral : Rat := 7

/-- The negation of a rational number. -/
def rationalNegate : Rat := -3

/-- The sum of two rational numbers. -/
def rationalAdd : Rat := 2 + 3

/-- The difference of two rational numbers. -/
def rationalSubtract : Rat := 2 - 5

/-- The product of two rational numbers. -/
def rationalMultiply : Rat := 2 * -3

/-- The stream that repeats a rational number. -/
def streamConst : Stream' Rat := Stream'.const 2

/-- The stream of a rational number before a stream that repeats another. -/
def streamCons : Stream' Rat := Stream'.cons 1 (Stream'.const 2)

/-- The stream after the first element of a stream. -/
def streamTail : Stream' Rat := Stream'.tail (Stream'.cons 1 (Stream'.cons 4 (Stream'.const 2)))

/-- The pairs of the elements of two streams. -/
def streamZip : Stream' (Rat × Rat) :=
  Stream'.zip Prod.mk (Stream'.cons 1 (Stream'.const 2)) (Stream'.const 3)

/-- The second components of the pairs of the elements of two streams. -/
def streamMap : Stream' Rat :=
  Stream'.map Prod.snd (Stream'.zip Prod.mk (Stream'.cons (1 : Rat) (Stream'.const 2))
    (Stream'.cons 5 (Stream'.const 3)))

/-- The sequence of two rational numbers. -/
def sequenceCons : Stream'.Seq Rat := Stream'.Seq.cons 1 (Stream'.Seq.cons 2 Stream'.Seq.nil)

/-- The second components of a sequence of two pairs. -/
def sequenceMap : Stream'.Seq Rat :=
  Stream'.Seq.map Prod.snd
    (Stream'.Seq.cons ((1 : Rat), 2) (Stream'.Seq.cons (3, 4) Stream'.Seq.nil))

end Falkara.Translation.Vectors

translation_vector rationalLiteral Falkara.Translation.Vectors.rationalLiteral
translation_vector rationalNegate Falkara.Translation.Vectors.rationalNegate
translation_vector rationalAdd Falkara.Translation.Vectors.rationalAdd
translation_vector rationalSubtract Falkara.Translation.Vectors.rationalSubtract
translation_vector rationalMultiply Falkara.Translation.Vectors.rationalMultiply
translation_vector streamConst Falkara.Translation.Vectors.streamConst
translation_vector streamCons Falkara.Translation.Vectors.streamCons
translation_vector streamTail Falkara.Translation.Vectors.streamTail
translation_vector streamZip Falkara.Translation.Vectors.streamZip
translation_vector streamMap Falkara.Translation.Vectors.streamMap
translation_vector sequenceCons Falkara.Translation.Vectors.sequenceCons
translation_vector sequenceMap Falkara.Translation.Vectors.sequenceMap
