/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Core.Term
public import Translator.Target.Effect.Declaration
public import Translator.Target.Effect.Rules

import Translator.Path

/-!
# Term

The module defines the expressions of TypeScript that the terms of the core take in a test of
Effect: a variable by its name, or by the expression that reads it from the data of the test where
the test draws it, the data by their name, a natural number as an integer of arbitrary size, an
element of a tuple by its index, a field by its name, a pair as a tuple or a record, the application
of a function as a call, a function of one parameter as an arrow function, a structure by the
constructor of its module, a function of the theory by its name in its module, and a primitive by
the rule of Effect.

## Implementation Notes

A test imports every module of the package that it names as a namespace after the last word of the
module of the theory, such as `Point.make`, as a value, as a test calls the module rather than the
generated module, so that the test bounds the implementation.

A parameter of a function shadows a variable of the same name, so it reads as itself in the body.
-/

public section

namespace Translator.Effect

/-- What a lowering of a term knows beyond the term: the namespace of the theory, after which the
modules of the package take their paths, and the expression that reads every variable that the
test draws from its data, where the two differ. -/
structure TermContext where
  /-- The namespace of the theory. -/
  theory : Lean.Name
  /-- The expression that reads a variable from the data of the test, by the name of the
  variable. -/
  readers : List (String × TypeScript.Expression)

/-- Gives the symbol of a member of the module of the package that holds a declaration, which a
test imports as a namespace after the last word of the module of the theory. -/
def packageOf (theory : Lean.Name) (reference : Core.Reference) (member : String) :
    TypeScript.Symbol :=
  .package (match reference.module with
      | .str _ last => last
      | _ => "")
    (pathOf theory reference.module) member

mutual

/-- Gives the expression of TypeScript that a term takes, or refuses where the rule of a primitive
names an argument that the application does not give. -/
def lowerTerm (context : TermContext) : Core.Term → Except Refusal TypeScript.Expression
  | .bound name => pure ((context.readers.lookup name).getD (.identifier name))
  | .sample name => pure (.identifier name)
  | .natural value => pure (.literal (.bigInt value))
  | .element term index => return .element (← lowerTerm context term) (.literal (.number index))
  | .field term name => return .member (← lowerTerm context term) name
  | .pair none first second =>
    return .array [← lowerTerm context first, ← lowerTerm context second]
  | .pair (some (firstName, secondName)) first second =>
    return .object [.mk none firstName (← lowerTerm context first),
      .mk none secondName (← lowerTerm context second)]
  | .apply function argument =>
    return .call (← lowerTerm context function) [← lowerTerm context argument]
  | .lambda parameter body => do
    -- The parameter shadows a variable of the same name.
    let body ← lowerTerm
      { context with readers := context.readers.filter (·.1 != parameter) } body
    return .arrow [] [.mk (.identifier parameter) none] .inline none (.expression body)
  | .construct reference fields =>
    return .call (.symbol (packageOf context.theory reference (constructorNameOf reference)))
      [.object (← lowerFields context fields)]
  | .global reference arguments =>
    return .call (.symbol (packageOf context.theory reference (valueNameOf reference)))
      (← lowerTerms context arguments)
  | .primitive primitive arguments => do
    let arguments ← lowerTerms context arguments
    match rule primitive with
    | .implemented template _ =>
      match template.instantiate arguments with
      | some expression => return expression
      | none => throw (.templateArity primitive.word)
    | .unavailable _ => throw (.templateArity primitive.word)

/-- Gives the expressions of TypeScript that terms take, in order. -/
def lowerTerms (context : TermContext) :
    List Core.Term → Except Refusal (List TypeScript.Expression)
  | [] => pure []
  | term :: rest => return (← lowerTerm context term) :: (← lowerTerms context rest)

/-- Gives the properties of the object of a structure that the values of its fields take. -/
def lowerFields (context : TermContext) :
    List (String × Core.Term) → Except Refusal (List TypeScript.Property)
  | [] => pure []
  | (name, term) :: rest =>
    return .mk none name (← lowerTerm context term) :: (← lowerFields context rest)

end

end Translator.Effect
