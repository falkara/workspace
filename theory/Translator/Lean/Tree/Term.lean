/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Core.Specification
public import Translator.Refusal

/-!
# Term

The module defines the trees that the reading of a theorem gives its terms and the theorem itself:
a term as a variable, a literal, an application of a constant with what the environment tells of the
constant, or an expression of any other form, each with the expression of Lean that it reads, and a
theorem as the data that a test draws for its variables, its hypotheses, the leading `have`s of its
conclusion, and the two sides of its conclusion, as trees.

## Implementation Notes

An application carries every argument with whether its binder is explicit, as a primitive takes
the explicit arguments alone, and the names of the fields of a pair where the type that the reading
gives the pair is the object of a functor whose declaration names its fields, as the type of a term
is known while the reading elaborates it and the form of a pair follows from it.

The data that a test draws are of the core already, as the reading draws them from the type of a
variable, which it alone takes apart.
-/

public section

namespace Translator.Lean

/-- What the environment tells of the constant of an application, where no rule of the translator
holds there: a field of a structure that the theory labels, the constructor of a structure that the
theory gives a counterpart, a function that the theory gives a counterpart, or nothing. -/
inductive Head where
  /-- A constant of which the environment tells nothing. -/
  | plain
  /-- A field of a structure that the theory labels, by the name that the field takes, after the
  parameters of the structure. -/
  | projection (field : String) (parameters : Nat)
  /-- The constructor of a structure that the theory gives a counterpart, with the names that its
  fields take, after the parameters of the structure. -/
  | constructor (reference : Core.Reference) (fields : List String) (parameters : Nat)
  /-- A function that the theory gives a counterpart. -/
  | function (reference : Core.Reference)
  deriving Repr, BEq

mutual

/-- The tree of a term of a theorem. -/
inductive TermTree where
  /-- A local by its name. -/
  | bound (name : String) (source : Lean.Expr)
  /-- A natural number literal. -/
  | literal (value : Nat) (source : Lean.Expr)
  /-- An application of a constant to its arguments, with what the environment tells of the
  constant and the names of the fields of the pair that the application gives, takes apart, or
  maps where it does one. -/
  | apply (constant : Lean.Name) (head : Head) (arguments : List TermArgument)
      (fields : Option (List (Lean.Name × String))) (source : Lean.Expr)
  /-- An expression of any other form. -/
  | other (source : Lean.Expr)

/-- An argument of an application. -/
inductive TermArgument where
  /-- An argument by its tree and whether its binder is explicit. -/
  | mk (tree : TermTree) (explicit : Bool)

end

deriving instance Repr, BEq for TermTree, TermArgument

/-- Gives the expression of Lean that a term tree reads. -/
def TermTree.source : TermTree → Lean.Expr
  | .bound _ source | .literal _ source | .apply _ _ _ _ source | .other source => source

/-- The tree of a theorem: the data that a test draws for its variables, its hypotheses, the leading
`have`s of its conclusion, the two sides of its conclusion, and the way a test compares them. -/
structure TheoremTree where
  /-- The name of the test. -/
  name : String
  /-- The reading of the documentation of the test, which the records of the theory give or refuse,
  as the test takes it after every term. -/
  documentation : Except Refusal Core.Documentation
  /-- The variables that the test draws. -/
  variables : List Core.Variable
  /-- The hypotheses, each an equation or its negation with its two sides. -/
  hypotheses : List (Bool × TermTree × TermTree)
  /-- The values that the leading `have`s bind, by their names. -/
  haves : List (String × TermTree)
  /-- The left side of the conclusion. -/
  left : TermTree
  /-- The right side of the conclusion. -/
  right : TermTree
  /-- The way a test compares the two sides. -/
  comparison : Core.Comparison

end Translator.Lean
