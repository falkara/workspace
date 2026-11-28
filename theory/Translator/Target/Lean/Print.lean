/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Translation
public import Translator.Core.Declaration
public import Translator.Core.Type

/-!
# Print

The module defines the text of Lean that a type and a value of the core take, the target of the
round trip of the translator, which prints the core back into Lean so that a check closes it
against the declaration of the theory it was read from by `rfl`: a type by the constants that the
rules of the translator give its formers, a type parameter and the object of a type lambda by their
names, the object of a functor that is a parameter by the object of a functor, the object of a type
constructor that is a parameter by its application, and a function type by its parameters; a value
by its rational numbers, its pairs, and the anonymous constructors of its structures.

## Implementation Notes

The text names every constant by the rule that gives its former or its structural part, so the
round trip names no constant of Lean beyond the rules, as the reading does.

A declaration of the theory takes its arguments in the order that a target takes them, which leaves
out every instance and moves every argument with a default value last, so a type that applies one
has no text, and the round trip lists it with the reason rather than printing it.

A product takes the text of the pair of its two fields, as the object of a functor whose
declaration names the fields is the pair that the functor gives, which the check reduces.
-/

public section

namespace Translator.LeanTarget

/-- What a printing of a type knows beyond the type: the rules of the translator, the type
parameters that are functors, whose objects take the object of a functor, and the name of the local
that stands for the object of a type lambda. -/
structure Context where
  /-- The rules of the translator. -/
  rules : List Falkara.Translation.Rule
  /-- The type parameters that are functors. -/
  functors : List String
  /-- The name of the local that stands for the object of a type lambda. -/
  target : String

/-- Gives the text of the constant that the rules give an action, or the reason where they give
none. -/
def constantOf (context : Context) (action : Falkara.Translation.Action) : Except String String :=
  match (Falkara.Translation.constantsOf context.rules action).head? with
  | some constant => pure constant.toString
  | none => throw s!"the rules give no constant the action {repr action}"

mutual

/-- Gives the text of Lean that a type of the core takes, or the reason where it has none. -/
def TypeTerm.toLean (context : Context) : Core.TypeTerm → Except String String
  | .rational => constantOf context (.type .rational)
  | .string => constantOf context (.type .string)
  | .boolean => constantOf context (.type .boolean)
  | .unit => constantOf context (.type .unit)
  | .parameter name => pure name
  | .target => pure context.target
  | .option element => do
    return s!"({← constantOf context (.type .option)} {← TypeTerm.toLean context element})"
  | .array element => do
    return s!"({← constantOf context (.type .array)} {← TypeTerm.toLean context element})"
  | .stream element => do
    return s!"({← constantOf context (.type .stream)} {← TypeTerm.toLean context element})"
  | .sequence element => do
    return s!"({← constantOf context (.type .sequence)} {← TypeTerm.toLean context element})"
  | .product _ [.mk _ first, .mk _ second] => do
    return s!"({← constantOf context (.type .product)} {← TypeTerm.toLean context first} \
      {← TypeTerm.toLean context second})"
  | .product .. => throw "a product of other than two fields has no pair of Lean"
  | .sum left right => do
    return s!"({← constantOf context (.type .sum)} {← TypeTerm.toLean context left} \
      {← TypeTerm.toLean context right})"
  | .effect success failure requirements => do
    return s!"({← constantOf context (.type .reader)} {← TypeTerm.toLean context requirements} \
      ({← constantOf context (.type .except)} {← TypeTerm.toLean context failure}) \
      {← TypeTerm.toLean context success})"
  | .apply constructor argument => do
    let argument ← TypeTerm.toLean context argument
    match constructor with
    | .parameter name =>
      if context.functors.contains name then
        return s!"({← constantOf context (.structural .functorObject)} {name} {argument})"
      else return s!"({name} {argument})"
    | .option => return s!"({← constantOf context (.type .option)} {argument})"
    | .identity _ => return s!"({← constantOf context (.type .identity)} {argument})"
    | .named .. => throw "a declaration of the theory takes its arguments in the order of a target"
  | .named .. => throw "a declaration of the theory takes its arguments in the order of a target"
  | .function typeParameters parameters result => do
    let generics := String.join (typeParameters.map fun name ↦ s!"\{{name} : Type} → ")
    return s!"({generics}{← NamedType.parametersToLean context parameters}\
      {← TypeTerm.toLean context result})"

/-- Gives the text of the parameters of a function type, each a binder followed by an arrow. -/
def NamedType.parametersToLean (context : Context) :
    List Core.NamedType → Except String String
  | [] => pure ""
  | .mk name type :: rest => do
    return s!"({name} : {← TypeTerm.toLean context type}) → \
      {← NamedType.parametersToLean context rest}"

end

/-- Gives the text of Lean that a value of the core takes. -/
def Value.toLean (context : Context) : Core.Value → Except String String
  | .rational numerator denominator => do
    return s!"(({numerator} : {← constantOf context (.type .rational)}) / {denominator})"
  | .pair first second => do
    return s!"({← Value.toLean context first}, {← Value.toLean context second})"
  | .structure _ fields => do
    return s!"⟨{", ".intercalate (← fieldsToLean fields)}⟩"
where
  /-- Gives the texts of the values of the fields of a structure, in order. -/
  fieldsToLean : List (String × Core.Value) → Except String (List String)
    | [] => pure []
    | (_, value) :: rest => return (← Value.toLean context value) :: (← fieldsToLean rest)

end Translator.LeanTarget
