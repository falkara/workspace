/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Lean.Meta.Basic
public import Translator.Lean.Tree.Term

import Translator.Lean.Reify.Declaration

/-!
# Term

The module defines the reading of a term of a theorem into its tree: a local by its name, a natural
number literal, and an application of a constant with every argument, whether its binder is
explicit, what the environment tells of the constant where no rule of the translator holds there,
and the names of the fields of the pair that the application gives, takes apart, or maps, and the
type of a term as a target reads it.

## Implementation Notes

The type of a term is read as `normalizedOf` gives the type of a declaration, so that a product that
the functor of a system gives keeps the declaration of the functor, which names its fields, where
the type that Lean infers unfolds it: a local that a `have` binds takes the type of its value rather
than the type the `have` ascribes, a morphism applied to an argument the result of the morphism, and
a component of a pair the type of the component.

A pair, a component of a pair, and the map of a stream take the names of the fields of the pair from
the type that the reading gives it, the pair itself, the pair taken apart, and an element of the
stream mapped, as the form of a pair follows from its type, which a later phase no longer knows. A
pair takes first the type that its place expects of it: the type of an equation for its sides, and
the binder of the function for an argument. Lean infers a pair as the product of its components,
which names no fields, while the type that its place expects keeps the functor that names them.

A constant of which a rule of the translator tells is read with no lookup in the environment beyond
its arguments, as the rule alone gives its meaning.

A declaration of the theory that a term names takes the module that declares it, which a test
imports, so a declaration of no imported module has no term.
-/

public section

namespace Translator.Lean

open Falkara

/-- Gives the names that the fields of an object of a functor take, where the declaration of the
functor names them, by the names of the fields in the structure. -/
def recordFieldsOf? (rules : List Translation.Rule) (type : Lean.Expr) :
    Lean.MetaM (Option (List (Lean.Name × String))) := do
  return (← recordOf? rules type).map fun record ↦
    record.fields.map fun (field, name, _) ↦ (field, name)

/-- Gives the type of a term of a theorem as a target reads it, as `normalizedOf` gives the type of
a declaration, or refuses with the reason where a morphism applies to no argument it takes, a pair
is taken apart that is no pair, or the fuel runs out. -/
def shapeOf (rules : List Translation.Rule) : Nat → Lean.Expr → Lean.MetaM Lean.Expr
  | 0, expression => Lean.throwError (Refusal.render (.fuel expression))
  | fuel + 1, expression => do
    if let .fvar binder := expression then
      if let some value ← binder.getValue? then return ← shapeOf rules fuel value
    if let .const name _ := expression.getAppFn then
      match expression.getAppArgs.toList with
      | [_, _, _, _, .app _ morphism, argument] =>
        if Translation.isStructural rules .coercion name then
          let shape ← shapeOf rules fuel morphism
          let codomain := match shape, shape.getAppArgs with
            | .forallE _ _ result _, _ => some (result.instantiate1 argument)
            | _, #[_, _, _, codomain] =>
              if isApplicationOf rules .hom shape then some codomain else none
            | _, #[_, codomain] =>
              if isApplicationOf rules .typeHom shape then some codomain else none
            | _, _ => none
          let some codomain := codomain
            | Lean.throwError (Refusal.render (.noApplicableMorphism morphism shape))
          return codomain
      | [_, _, pair] =>
        let first := Translation.isStructural rules .first name
        if first || Translation.isStructural rules .second name then
          let shape ← shapeOf rules fuel pair
          -- A component of a product that a functor gives is the field of its record.
          if let some (_, _, component) := (← recordOf? rules shape).bind
              (·.fields.find? (·.1 == if first then `fst else `snd)) then
            return ← normalizedOf rules component
          match shape with
          | .app (.app (.const product _) firstType) secondType =>
            unless Translation.formerOf? rules product == some .product do
              Lean.throwError (Refusal.render (.noPair pair shape))
            return if first then firstType else secondType
          | shape => Lean.throwError (Refusal.render (.noPair pair shape))
      | _ => pure ()
    normalizedOf rules (← Lean.instantiateMVars (← Lean.Meta.inferType expression)).headBeta

/-- Gives the module that declares a declaration of a term, which a test imports, or refuses where
the declaration lies in no imported module. -/
def testModuleOf (name : Lean.Name) : Lean.MetaM Unit := do
  let environment ← Lean.getEnv
  let some index := environment.getModuleIdxFor? name
    | Lean.throwError (Refusal.render (.noTestModule name))
  unless environment.header.moduleNames[index.toNat]? matches some (.str _ _) do
    Lean.throwError (Refusal.render (.noTestModule name))

/-- Gives what the environment tells of the constant of an application where no rule of the
translator holds there: a field of a structure that the theory labels, the constructor of a
structure that the theory gives a counterpart, a function that the theory gives a counterpart, or
nothing, in that order. -/
def headOf (packageNamespace name : Lean.Name) (arguments : List Lean.Expr) :
    Lean.MetaM Head := do
  let environment ← Lean.getEnv
  if let some projection := environment.getProjectionFnInfo? name then
    -- A field of a structure of Mathlib is written where a declaration of the theory labels the
    -- structure, such as `Coalgebra` for `CategoryTheory.Endofunctor.Coalgebra`.
    if (ExportTypeScript.exportsOf environment).any fun declared ↦
        ExportTypeScript.labels environment declared.declaration name.getPrefix then
      if let (.str _ field, some _) := (name, arguments[projection.numParams]?) then
        return .projection (← fieldNameOf name.getPrefix (.mkSimple field)) projection.numParams
  if let some (.ctorInfo constructor) := environment.find? name then
    if ExportTypeScript.isExported environment constructor.induct then
      testModuleOf constructor.induct
      return .constructor (← declarationReferenceOf packageNamespace constructor.induct)
        (← (Lean.getStructureFields environment constructor.induct).toList.mapM
          (fieldNameOf constructor.induct))
        constructor.numParams
  if ExportTypeScript.isExported environment name &&
      !(environment.find? name matches some (.thmInfo _)) && arguments.length > 0 then
    if (← kindOf name) matches .function then
      testModuleOf name
      return .function (← declarationReferenceOf packageNamespace name)
  return .plain

/-- Gives the type that an application expects of every argument, the binder of the type of its
function at the argument, and none from the first argument where the type shows no binder. -/
def domainsOf : List Lean.Expr → Lean.Expr → Lean.MetaM (List (Option Lean.Expr))
  | [], _ => return []
  | argument :: rest, type => do
    match ← Lean.Meta.whnf type with
    | .forallE _ domain body _ =>
      return some domain :: (← domainsOf rest (body.instantiate1 argument))
    | _ => return none :: rest.map fun _ ↦ none

/-- Gives the tree of a term of a theorem at the type that its place expects of it, where the place
expects one, or refuses with the reason where the type of a pair that it takes apart or of a stream
that it maps has no reading, or the fuel runs out. -/
def reifyTerm (rules : List Translation.Rule) (packageNamespace : Lean.Name) :
    Nat → Option Lean.Expr → Lean.Expr → Lean.MetaM TermTree
  | 0, _, expression => Lean.throwError (Refusal.render (.fuel expression))
  | fuel + 1, expected, expression => do
    match expression with
    | .fvar binder => return .bound (← binder.getUserName).toString expression
    | .lit (.natVal value) => return .literal value expression
    | _ =>
      let .const name _ := expression.getAppFn | return .other expression
      let arguments := expression.getAppArgs.toList
      let information ← Lean.Meta.getFunInfoNArgs expression.getAppFn arguments.length
      let domains ← domainsOf arguments (← Lean.Meta.inferType expression.getAppFn)
      let trees ← (arguments.zip domains).mapM fun (argument, domain) ↦
        reifyTerm rules packageNamespace fuel domain argument
      let typed := trees.zipIdx.map fun (tree, index) ↦
        TermArgument.mk tree ((information.paramInfo[index]?.map (·.isExplicit)).getD true)
      let domain := match arguments with
        | .const domain _ :: _ => some domain
        | _ => none
      match Translation.ruleOf? rules name arguments.length domain with
      | some rule =>
        let fields ← match rule.action, arguments with
          | .structural .pair, _ => do
            -- A pair takes the fields that the type its place expects names, and those of its own
            -- type otherwise, as Lean infers a pair as the product of its components alone.
            let expectedFields ← match expected with
              | some type => recordFieldsOf? rules (← normalizedOf rules type)
              | none => pure none
            match expectedFields with
            | some fields => pure (some fields)
            | none => recordFieldsOf? rules (← shapeOf rules fuel expression)
          | .structural .first, [_, _, pair] | .structural .second, [_, _, pair] =>
            recordFieldsOf? rules (← shapeOf rules fuel pair)
          | .primitive .streamMap, [_, _, _, stream] | .primitive .sequenceMap, [_, _, _, stream] =>
            match ← shapeOf rules fuel stream with
            | .app _ element => recordFieldsOf? rules element
            | _ => pure none
          | _, _ => pure none
        return .apply name .plain typed fields expression
      | none =>
        return .apply name (← headOf packageNamespace name arguments) typed none expression

end Translator.Lean
