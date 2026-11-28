/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Core.Declaration
public import Translator.Refusal

import Falkara.Translation
import Lean.Structure
import Translator.Lean.Source

/-!
# Evaluate

The module defines the value of the core that a closed expression of a type of the theory takes, as
the kernel of Lean reduces it: a rational number by its numerator and its denominator, each a
literal, and a structure of the theory by the value of every field, or a reason where the type has
no value, the expression holds a variable or a metavariable, or the reduction runs out of fuel.

## Implementation Notes

The evaluation takes the environment alone and no elaboration, so it reduces by `Lean.Kernel.whnf`,
the reduction of the kernel that checks every proof of the theory, rather than by the reduction of
the elaborator, which follows the transparency that an attribute such as `@[irreducible]` sets.

The evaluation is sound, as every step of the kernel gives an expression that is definitionally
equal to the one before it, so the literal that the evaluation reads is the value that Lean gives
the expression. A rational number reduces to the structure `Rat` and a field of it to a constructor
of `Int` or a literal of `Nat`, whatever instance builds the number, those of the core of Lean or
those of Mathlib alike: the projections `Rat.num` and `Rat.den` unfold the operations of `Rat`,
such as `Rat.inv` and `Rat.normalize`, into operations of `Int`, which reduce by their recursors to
operations of `Nat`, and the kernel computes the operations of `Nat` on literals, such as
`Nat.gcd` and `Nat.div`, by its extension for literals, without unfolding their definitions. The
evaluation reads a field by its head alone and reduces its arguments further, as the kernel reduces
an expression to its weak head normal form, such as `Int.ofNat` of a quotient of literals.

An expression that holds a free variable or a metavariable has no value, as the kernel never
reduces either, such as a literal whose instance an elaboration leaves unsynthesized, so the
evaluation refuses it before it reduces anything, with the reason.

Every evaluation takes fuel, a step for every level of a structure and for every successor of a
natural number that the kernel gives as `Nat.succ` rather than as a literal, and refuses where it
runs out, so it ends on every expression.
-/

public section

namespace Translator.Lean.Evaluate

open Falkara

/-- Gives the weak head normal form of an expression as the kernel of Lean reduces it, or refuses
where the kernel fails. -/
def headOf (environment : Lean.Environment) (expression : Lean.Expr) : Except Refusal Lean.Expr :=
  (Lean.Kernel.whnf environment {} expression).mapError fun _ ↦ .irreducible expression

/-- Gives the natural number that the kernel of Lean reduces an expression to, or refuses with the
reason where it reduces to none or the fuel runs out. -/
def naturalOf (environment : Lean.Environment) : Nat → Lean.Expr → Except Refusal Nat
  | 0, expression => throw (.fuel expression)
  | fuel + 1, expression => do
    match ← headOf environment expression with
    | .lit (.natVal value) => return value
    | .const ``Nat.zero _ => return 0
    | .app (.const ``Nat.succ _) predecessor =>
      return (← naturalOf environment fuel predecessor) + 1
    | reduced => throw (.noNatural expression reduced)

/-- Gives the integer that the kernel of Lean reduces an expression to, or refuses with the reason
where it reduces to none or the fuel runs out. -/
def integerOf (environment : Lean.Environment) (fuel : Nat) (expression : Lean.Expr) :
    Except Refusal Int := do
  match ← headOf environment expression with
  | .app (.const ``Int.ofNat _) value => return (← naturalOf environment fuel value)
  | .app (.const ``Int.negSucc _) value => return -((← naturalOf environment fuel value) : Int) - 1
  | reduced => throw (.noInteger expression reduced)

/-- Gives the rational number that the kernel of Lean reduces an expression of `Rat` to, by its
numerator and its denominator, or refuses with the reason where either reduces to no literal. -/
def rationalOf (environment : Lean.Environment) (fuel : Nat) (expression : Lean.Expr) :
    Except Refusal Core.Value := do
  return .rational
    (← integerOf environment fuel (Lean.mkApp (Lean.mkConst ``Rat.num) expression))
    (← naturalOf environment fuel (Lean.mkApp (Lean.mkConst ``Rat.den) expression))

/-- Gives the value of an expression of a type of the theory for a declaration of a module: a
rational number by its numerator and its denominator and a structure of the module by the value of
every field, or refuses with the reason where the type has no value, the structure lies in another
module, or the fuel runs out. -/
def literalOf (environment : Lean.Environment) (packageNamespace name : Lean.Name) :
    Nat → Lean.Expr → Lean.Expr → Except Refusal Core.Value
  | 0, _, expression => throw (.fuel expression)
  | fuel + 1, type, expression =>
    match type with
    | .const ``Rat _ => rationalOf environment fuel expression
    | .const structureName _ => do
      unless ExportTypeScript.isExported environment structureName &&
          Lean.isStructure environment structureName do
        throw (.unexportedStructureValue name structureName)
      let fields ← (Lean.getStructureFields environment structureName).toList.mapM fun field ↦ do
        -- A field of a structure without parameters is a function of the structure alone.
        let some (.forallE _ _ fieldType _) :=
            ((environment.find? (structureName ++ field)).map (·.type) : Option Lean.Expr)
          | throw (.parametricStructureValue structureName)
        return (Source.fieldNameOf environment structureName field,
          ← literalOf environment packageNamespace name fuel fieldType
            (Lean.mkApp (Lean.mkConst (structureName ++ field)) expression))
      -- A value takes a structure of its own module alone, as a file imports the declarations of
      -- another module as types and schemas and never their constructors.
      unless (environment.getModuleIdxFor? structureName).map (·.toNat) ==
          (environment.getModuleIdxFor? name).map (·.toNat) do
        throw (.foreignStructureValue name structureName)
      return .structure (Source.referenceOf environment packageNamespace structureName) fields
    | .app (.app (.const product _) firstType) secondType =>
      -- A pair takes the values of its two components, which the projections of its structure
      -- give.
      if Falkara.Translation.formerOf? (Falkara.Translation.rulesOf environment) product ==
          some .product then do
        let first ← literalOf environment packageNamespace name fuel firstType
          (.proj product 0 expression)
        return .pair first
          (← literalOf environment packageNamespace name fuel secondType
            (.proj product 1 expression))
      else throw (.noValue name type)
    | _ => throw (.noValue name type)

/-- Gives the values of the first elements of a closed expression of a stream or a sequence, at most
as many as a length, the elements of a sequence up to its end, or refuses with the reason where an
element has no value, the type is neither, or the fuel runs out. -/
def prefixOf (environment : Lean.Environment) (packageNamespace name : Lean.Name) (fuel : Nat)
    (type expression : Lean.Expr) (length : Nat) : Except Refusal (List Core.Value) :=
  let rules := Falkara.Translation.rulesOf environment
  match type with
  | .app (.const former _) element =>
    match Falkara.Translation.formerOf? rules former with
    | some .stream =>
      -- A stream is a function of the natural numbers, so it takes every index as an argument.
      (List.range length).mapM fun index ↦
        literalOf environment packageNamespace name fuel element
          (Lean.mkApp expression (Lean.mkNatLit index))
    | some .sequence => elementsOf rules element length 0
    | _ => throw (.noValue name type)
  | _ => throw (.noValue name type)
where
  /-- Gives the elements of a sequence from an index on, at most as many as remain, up to the first
  index at which the stream of options that the sequence is gives none. -/
  elementsOf (rules : List Falkara.Translation.Rule) (element : Lean.Expr) :
      Nat → Nat → Except Refusal (List Core.Value)
    | 0, _ => pure []
    | remaining + 1, index => do
      let option := Lean.mkApp (.proj ``Subtype 0 expression) (Lean.mkNatLit index)
      match ← headOf environment option with
      | .app (.app (.const ``Option.some _) _) value =>
        return (← literalOf environment packageNamespace name fuel element value) ::
          (← elementsOf rules element remaining (index + 1))
      | _ => pure []

/-- Gives the value of a closed expression of a type of the theory for a declaration of a module, as
`literalOf` gives it, or refuses with the reason where the expression or its type holds a variable
or a metavariable. -/
def valueOf (environment : Lean.Environment) (packageNamespace name : Lean.Name) (fuel : Nat)
    (type expression : Lean.Expr) : Except Refusal Core.Value :=
  if expression.hasFVar || expression.hasMVar || expression.hasLevelMVar || type.hasFVar ||
      type.hasMVar then
    throw (.openValue name expression)
  else literalOf environment packageNamespace name fuel type expression

end Translator.Lean.Evaluate
