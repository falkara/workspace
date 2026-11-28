/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Core.Declaration
public import Translator.Core.Term

/-!
# Specification

The module defines a theorem as a declarative test: the data that the test draws for every variable,
the hypotheses whose breaking values it skips, the values that the leading `have`s of the conclusion
bind, the two sides of the conclusion, and the way it compares them.

## Implementation Notes

A test draws a type variable and the state space of a system at three values, a function from a
type variable as the table of its three values, a stream as a prefix of it, and a system as the
table of its structure, so a draw names the form of the data rather than a schema of a target.

Two streams compare by a prefix of each, as long as the one stream that the test draws or of a fixed
length where it draws none, and an infinite stream has every element of its prefix, which a
sequence need not have.
-/

public section

namespace Translator.Core

/-- The data that a test draws for a value. -/
inductive Draw where
  /-- One of three values, `0`, `1`, and `2`, for a type variable or a state space. -/
  | values
  /-- The value of the type of one value. -/
  | unit
  /-- A rational number. -/
  | rational
  /-- A value of a structure of data of the theory, by its schema. -/
  | schema (reference : Reference)
  /-- An option of the data of its element. -/
  | option (element : Draw)
  /-- A pair of the data of its components, as a tuple. -/
  | tuple (first second : Draw)
  /-- A value of a binary sum, of the data of its left or its right summand. -/
  | result (left right : Draw)
  /-- A record of the data of its fields, by their names. -/
  | record (fields : List (String × Draw))
  /-- The table of a function from a type variable, the data of its value at each of the three
  values, which the function reads under the name of its parameter. -/
  | table (parameter : String) (result : Draw)
  deriving Repr, BEq

mutual

/-- Tells whether the data that a draw gives differ from the value they stand for, as the table of a
function, or a record with such a field, does. -/
def Draw.reads : Draw → Bool
  | .table .. => true
  | .record fields => Draw.fieldsRead fields
  | .values | .unit | .rational | .schema _ | .option _ | .tuple .. | .result .. => false

/-- Tells whether the data that a draw gives one of the fields of a record differ from its value. -/
def Draw.fieldsRead : List (String × Draw) → Bool
  | [] => false
  | (_, draw) :: rest => draw.reads || Draw.fieldsRead rest

end

/-- A variable of a theorem that a test draws. -/
inductive Variable where
  /-- A value by its name and the data that the test draws for it. -/
  | value (name : String) (draw : Draw)
  /-- A stream by its name, drawn as a prefix of the data of its elements, with a first element
  where the theorem takes the first element of the stream. -/
  | stream (name : String) (element : Draw) (headed : Bool)
  /-- A system by its name, drawn as the table of its structure, the one field of the declaration
  of its kind. -/
  | system (name : String) (declaration : Reference) (field : String) (table : Draw)
  deriving Repr, BEq

/-- A hypothesis of a theorem, an equation or the negation of one, whose breaking values a test
skips. -/
structure Hypothesis where
  /-- Whether the hypothesis is an equation rather than its negation. -/
  equal : Bool
  /-- The left side. -/
  left : Term
  /-- The right side. -/
  right : Term
  deriving Repr, BEq

/-- The way a test compares the two sides of a conclusion. -/
inductive Comparison where
  /-- As values. -/
  | values
  /-- By a prefix of each, as long as the stream of the name where the test draws one and of a
  fixed length otherwise, requiring of an infinite stream that its prefix has every element. -/
  | prefix (stream : Option String) (infinite : Bool)
  deriving Repr, BEq

/-- A theorem as a declarative test. -/
structure Specification where
  /-- The name of the test. -/
  name : String
  /-- The documentation of the test. -/
  documentation : Documentation
  /-- The variables that the test draws, in the order of the theorem. -/
  variables : List Variable
  /-- The hypotheses, in the order of the theorem. -/
  hypotheses : List Hypothesis
  /-- The values that the leading `have`s of the conclusion bind, by their names. -/
  haves : List (String × Term)
  /-- The left side of the conclusion. -/
  left : Term
  /-- The right side of the conclusion. -/
  right : Term
  /-- The way the test compares the two sides. -/
  comparison : Comparison
  deriving Repr, BEq

/-- The value that the kernel of Lean computes for a vector: a value, or the values of the first
elements of a stream or a sequence. -/
inductive Expected where
  /-- A value. -/
  | value (value : Value)
  /-- The values of the first elements of a stream or a sequence. -/
  | prefix (values : List Value)
  deriving Repr, BEq

/-- A vector of a primitive as a check of the rule of a target: the term that applies the
primitive and the value that the kernel of Lean computes for it. -/
structure Vector where
  /-- The primitive. -/
  primitive : Falkara.Translation.Primitive
  /-- The term that applies the primitive. -/
  term : Term
  /-- The value that the kernel of Lean computes for the term. -/
  expected : Expected
  deriving Repr, BEq

end Translator.Core
