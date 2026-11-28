/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Translation
public import Translator.Core.Reference

/-!
# Term

The module defines the terms of the core of the translator, which neither the theory nor a target
dictates: a variable, the data that a test draws for a variable, a natural number, an element of a
tuple, a field of a record or a structure, a pair, the application of a function, a function of one
parameter, the construction of a structure of the theory from its fields, the call of a function of
the theory, and the application of a primitive of a target.

## Implementation Notes

A pair holds the names of its fields where it is the object of a functor whose declaration names
them, as a pair that a functor gives and any other pair are one value in Lean but take two forms in
a target.

A variable that a test draws reads its value from the data of the test, while the data itself is a
term of its own, as the first element of a stream that a test draws is the first element of the
prefix that it draws.

The terms derive `BEq` in place of `DecidableEq`, as Lean derives no decidable equality for an
inductive type nested in a list.
-/

public section

namespace Translator.Core

/-- A term of the core. -/
inductive Term where
  /-- A variable that a theorem or a function binds, by its name. -/
  | bound (name : String)
  /-- The data that a test draws for a variable, by the name of the variable. -/
  | sample (name : String)
  /-- A natural number. -/
  | natural (value : Nat)
  /-- An element of a tuple by its index. -/
  | element (term : Term) (index : Nat)
  /-- A field of a record or a structure by its name. -/
  | field (term : Term) (name : String)
  /-- A pair, a record with the names of its two fields where it has them and a tuple otherwise. -/
  | pair (fields : Option (String × String)) (first second : Term)
  /-- The application of a function to an argument. -/
  | apply (function argument : Term)
  /-- A function of one parameter. -/
  | lambda (parameter : String) (body : Term)
  /-- A structure of the theory by the value of every field. -/
  | construct (reference : Reference) (fields : List (String × Term))
  /-- The call of a function of the theory. -/
  | global (reference : Reference) (arguments : List Term)
  /-- The application of a primitive of a target. -/
  | primitive (primitive : Falkara.Translation.Primitive) (arguments : List Term)
  deriving Repr, BEq

end Translator.Core
