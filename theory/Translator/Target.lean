/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Translation
public import Translator.Refusal
public import Translator.Target.TypeScript.Syntax

/-!
# Target

The module defines the rule by which a target implements a primitive of the translator: a template
of the expression that an application of the primitive takes, built from the syntax of the target
with a hole for every argument, and the trust that the rule earns, an erasure, a structural
correspondence, or an assumption with the statement that it assumes, or the reason why the target
does not implement the primitive. The module defines as well the audit of the rules of a target,
which refuses every rule that assumes a statement no vector checks.

## Implementation Notes

A template is data rather than a function, so the audit and the checks read a rule as it stands.

A structural rule maps a constructor of Lean to a constructor of the target that holds the same
values, such as `Option.some` to `Option.some`, so it holds by the form of the two alone, while an
assumption, such as that `Rational.sum` adds two rational numbers, holds only where a vector checks
it against the value that the kernel of Lean computes.
-/

public section

namespace Translator.Target

/-- The template of an expression of a target, with a hole for every argument of the application
of a primitive. -/
inductive Template where
  /-- The argument at an index. -/
  | argument (index : Nat)
  /-- A name that a file takes from a module it imports. -/
  | symbol (symbol : TypeScript.Symbol)
  /-- A literal. -/
  | literal (literal : TypeScript.Literal)
  /-- A call of a function. -/
  | call (callee : Template) (arguments : List Template)
  /-- An array by its elements. -/
  | array (elements : List Template)
  deriving Repr, BEq

/-- The trust that a rule of a target earns. -/
inductive Trust where
  /-- The rule erases a part of Lean that the target has no counterpart of. -/
  | erasure
  /-- The rule maps a constructor of Lean to a constructor of the target of the same values. -/
  | structural
  /-- The rule assumes a statement of the target, which a vector checks. -/
  | assumption (statement : String)
  deriving Repr, BEq

/-- The rule by which a target implements a primitive. -/
inductive Rule where
  /-- The template of the expression of an application and the trust that the rule earns. -/
  | implemented (template : Template) (trust : Trust)
  /-- The reason why the target does not implement the primitive. -/
  | unavailable (reason : String)
  deriving Repr, BEq

/-- Gives the expression that a template takes at the expressions of the arguments, or none where
it names an argument that the application does not give. -/
def Template.instantiate (arguments : List TypeScript.Expression) :
    Template → Option TypeScript.Expression
  | .argument index => arguments[index]?
  | .symbol name => some (.symbol name)
  | .literal value => some (.literal value)
  | .call callee templates => do
    return .call (← Template.instantiate arguments callee) (← instantiateAll templates)
  | .array templates => .array <$> instantiateAll templates
where
  /-- Gives the expressions that the templates take, in order. -/
  instantiateAll : List Template → Option (List TypeScript.Expression)
    | [] => some []
    | template :: rest => do
      return (← Template.instantiate arguments template) :: (← instantiateAll rest)

/-- Gives the reason why the target does not implement a primitive, where it does not. -/
def unavailableOf (rule : Falkara.Translation.Primitive → Rule)
    (primitive : Falkara.Translation.Primitive) : Option String :=
  match rule primitive with
  | .unavailable reason => some reason
  | .implemented .. => none

/-- Gives a refusal for every rule of a target that assumes a statement of its primitive where no
vector checks the primitive, given the rule of the target and whether a primitive has a vector. -/
def audit (rule : Falkara.Translation.Primitive → Rule)
    (verified : Falkara.Translation.Primitive → Bool) : List Refusal :=
  Falkara.Translation.Primitive.all.filterMap fun primitive ↦
    match rule primitive with
    | .implemented _ (.assumption statement) =>
      if verified primitive then none else some (.unverifiedRule primitive.word statement)
    | _ => none

end Translator.Target
