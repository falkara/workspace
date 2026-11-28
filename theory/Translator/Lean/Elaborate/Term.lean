/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Lean.Tree.Term

/-!
# Term

The module defines the translation of the tree of a term of a theorem into a term of the core, by
the rules of the translator where one holds at the constant of an application, and by what the
environment tells of the constant otherwise: a pair as a pair, a record where the type of the pair
names its fields, a component of a pair as the field of the record or the element of the tuple, a
morphism applied to an argument as the application of the morphism, the first element of a stream
that the test draws as the first element of the data, an erasure as the argument it keeps, and a
primitive as its application to the explicit arguments of the constant; a field of a structure that
the theory labels as the field, the constructor of a structure of the theory as the construction
from its fields, and a function of the theory as its call on its explicit arguments. Every other
tree refuses with the reason.

## Implementation Notes

The zip of two streams takes the pair constructor as its function alone, and a target zips into
pairs, so the translation keeps the two streams alone. The map of a stream by a component of a pair
takes a function of one parameter, `value`, that takes the component apart as the elements of the
stream are, records or tuples.

A primitive that the target does not implement refuses with the reason of the target, which the
translation takes as an argument, so it names no target.

Every translation takes fuel, a step for every node, and refuses where it runs out, so it ends on
every tree.
-/

public section

namespace Translator.Lean

open Falkara

/-- What a translation of a term knows beyond the term: the rules of the translator, the streams
that the test draws, and the reason why the target does not implement a primitive, where it does
not. -/
structure Elaborate.TermContext where
  /-- The rules of the translator. -/
  rules : List Translation.Rule
  /-- The streams that the test draws, by their names. -/
  streams : List String
  /-- The reason why the target does not implement a primitive, where it does not. -/
  unavailable : Translation.Primitive → Option String

/-- Gives the type that the first argument of an application names, where it names one. -/
def TermTree.domainOf : List TermArgument → Option Lean.Name
  | .mk (.apply domain _ [] _ _) _ :: _ => some domain
  | _ => none

/-- Gives the trees of the explicit arguments of an application. -/
def TermTree.explicitOf (arguments : List TermArgument) : List TermTree :=
  arguments.filterMap fun
    | .mk tree true => some tree
    | .mk _ false => none

/-- Gives the term of the core that the tree of a term takes, or refuses with the reason. -/
def TermTree.toTerm (context : Elaborate.TermContext) : Nat → TermTree → Except Refusal Core.Term
  | 0, tree => throw (.fuel tree.source)
  | fuel + 1, tree =>
    let translate := TermTree.toTerm context fuel
    match tree with
    | .bound name _ => pure (.bound name)
    | .literal _ source | .other source => throw (.noTestExpression source)
    | .apply constant head arguments fields source =>
      -- A component of a pair is the field of its record where the type of the pair names it, and
      -- the element of its tuple otherwise.
      let component := fun (pair : Core.Term) (field : Lean.Name) (index : Nat) ↦
        match fields.bind (·.lookup field) with
        | some name => Core.Term.field pair name
        | none => .element pair index
      let explicit := TermTree.explicitOf arguments
      match Translation.ruleOf? context.rules constant arguments.length
          (TermTree.domainOf arguments) with
      | some rule =>
        match rule.action, explicit with
        | .structural .pair, [first, second] => do
          let names := fields.bind fun names ↦ do
            return (← names.lookup `fst, ← names.lookup `snd)
          return .pair names (← translate first) (← translate second)
        | .structural .first, [pair] => return component (← translate pair) `fst 0
        | .structural .second, [pair] => return component (← translate pair) `snd 1
        | .structural .coercion, [function, argument] =>
          -- A morphism applies as the function that its erasure keeps.
          match function with
          | .apply erased _ erasedArguments _ _ =>
            match Translation.ruleOf? context.rules erased erasedArguments.length
                (TermTree.domainOf erasedArguments) with
            | some { action := .erase kept, .. } =>
              match erasedArguments[kept]? with
              | some (.mk morphism _) => return .apply (← translate morphism) (← translate argument)
              | none => throw (.noTestExpression source)
            | _ => throw (.noTestExpression source)
          | _ => throw (.noTestExpression source)
        | .structural .head, [stream] =>
          -- The first element of a stream that the test draws is the first element of its
          -- prefix.
          match stream with
          | .bound name _ =>
            if context.streams.contains name then pure (.element (.sample name) 0)
            else throw (.undrawnHead source)
          | _ => throw (.undrawnHead source)
        | .erase kept, _ =>
          match arguments[kept]? with
          | some (.mk kept _) => translate kept
          | none => throw (.noTestExpression source)
        | .primitive primitive, explicit => do
          if let some reason := context.unavailable primitive then
            throw (.unavailablePrimitive source reason)
          match primitive, explicit with
          | .rationalLiteral, [.literal value _] => pure (.primitive primitive [.natural value])
          | .rationalLiteral, _ => throw (.noTestExpression source)
          | .streamZip, [function, first, second] =>
            let paired := match function with
              | .apply pair _ [_, _] _ _ => Translation.isStructural context.rules .pair pair
              | _ => false
            unless paired do throw (.zipWithoutPairs source function.source)
            return .primitive primitive [← translate first, ← translate second]
          | .streamMap, [function, stream] | .sequenceMap, [function, stream] =>
            -- A component of a pair as the function takes apart the elements of the stream.
            let mapped ← match function with
              | .apply projection _ [_, _] _ _ =>
                if Translation.isStructural context.rules .first projection then
                  pure (.lambda "value" (component (.bound "value") `fst 0))
                else if Translation.isStructural context.rules .second projection then
                  pure (.lambda "value" (component (.bound "value") `snd 1))
                else translate function
              | function => translate function
            return .primitive primitive [mapped, ← translate stream]
          | primitive, explicit => return .primitive primitive (← explicit.mapM translate)
        | _, _ => throw (.noTestExpression source)
      | none =>
        match head with
        | .projection field parameters =>
          match arguments[parameters]? with
          | some (.mk value _) => return .field (← translate value) field
          | none => throw (.noTestExpression source)
        | .constructor reference names parameters => do
          let values ← (arguments.drop parameters).mapM fun | .mk value _ => translate value
          return .construct reference (names.zip values)
        | .function reference => return .global reference (← explicit.mapM translate)
        | .plain => throw (.noTestExpression source)

end Translator.Lean
