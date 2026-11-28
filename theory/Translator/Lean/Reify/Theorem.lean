/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Lean.Meta.Basic
public import Translator.Lean.Tree.Term

import Translator.Lean.Reify.Declaration
import Translator.Lean.Reify.Term

/-!
# Theorem

The module defines the reading of a theorem of the theory into its tree: the data that a test draws
for every variable of the theorem but its type variables and their instances, its hypotheses, the
leading `have`s of its conclusion, the two sides of its conclusion, an equation, and the way a test
compares them, under the variables of the theorem.

## Implementation Notes

A test draws a type variable and the state space of a system that is a variable at three values, a
function from a type variable as the table of its three values, a record or a tuple for a product,
an option and a result for an option and a coproduct of data, nothing for the type of one value,
the schema of a structure of data, a stream as a prefix of it, and a system as the table of its
structure, so the reading draws the data from the type of a variable, as `normalizedOf` reads it.

A morphism of the category of types is drawn as a function whose parameter takes the name of its
domain where its domain is a type parameter whose name is a word, as a type of the theory names it,
and the name `value` otherwise.

The tree lives under the variables of the theorem and its `have`s, so the reading runs a computation
on it there and refuses with the reason that the computation gives, whose expressions name the
variables.

A conclusion that equates two streams compares a prefix of each, as long as the one stream that the
test draws, and a stream of streams has no prefix that a test compares.
-/

public section

namespace Translator.Lean

open Falkara

/-- Gives the data that a test draws for a value of a type, as `normalizedOf` reads the type, or
refuses with the reason where the type has none or the fuel runs out. -/
def drawOf (rules : List Translation.Rule) (packageNamespace : Lean.Name) :
    Nat → Lean.Expr → Lean.MetaM Core.Draw
  | 0, type => Lean.throwError (Refusal.render (.fuel type))
  | fuel + 1, type => do
    let environment ← Lean.getEnv
    -- A part of an option, a tuple, or a result is data alone, as a schema draws them.
    let dataOf := fun (part : Lean.Expr) ↦ do
      let draw ← drawOf rules packageNamespace fuel part
      if draw.reads then Lean.throwError (Refusal.render (.drawnFunctionInData type))
      return draw
    -- An object that is a structure whose fields the declaration of its functor names takes a
    -- record, as a type of the theory takes one.
    if let some record ← recordOf? rules type then
      return .record (← record.fields.mapM fun (_, name, fieldType) ↦ do
        return (name, ← drawOf rules packageNamespace fuel (← normalizedOf rules fieldType)))
    let morphism := match type.getAppArgs with
      | #[_, _, domain, codomain] =>
        if isApplicationOf rules .hom type then some (domain, codomain) else none
      | #[domain, codomain] =>
        if isApplicationOf rules .typeHom type then some (domain, codomain) else none
      | _ => none
    if let some (domain, codomain) := morphism then
      let name ← match domain with
        | .fvar parameter => do
          let parameterName := (← parameter.getUserName).toString
          pure (if parameterName.all Char.isAlphanum then .mkSimple parameterName.decapitalize
            else `value)
        | _ => pure `value
      return ← drawOf rules packageNamespace fuel
        (.forallE name domain (codomain.liftLooseBVars 0 1) .default)
    match type with
    | .mdata _ inner => drawOf rules packageNamespace fuel inner
    | .forallE name (.fvar parameter) body _ =>
      unless (← Lean.Meta.whnfR (← parameter.getType)).isSort && !body.hasLooseBVars do
        Lean.throwError (Refusal.render (.drawnFunction type))
      return .table name.eraseMacroScopes.toString (← drawOf rules packageNamespace fuel body)
    | .forallE .. => Lean.throwError (Refusal.render (.drawnFunction type))
    | .app (.const former _) element =>
      if Translation.formerOf? rules former == some .option then
        return .option (← dataOf element)
      undrawn rules type
    | .app (.app (.const former _) first) second =>
      match Translation.formerOf? rules former with
      | some .product => return .tuple (← dataOf first) (← dataOf second)
      | some .sum => return .result (← dataOf first) (← dataOf second)
      | _ => undrawn rules type
    | .const name _ =>
      match Translation.formerOf? rules name with
      | some .unit => return .unit
      | some .rational => return .rational
      | _ =>
        unless ExportTypeScript.isExported environment name &&
            (← kindOf name) matches .dataStructure do
          Lean.throwError (Refusal.render (.undrawnDeclaration name))
        testModuleOf name
        return .schema (← declarationReferenceOf packageNamespace name)
    | _ => undrawn rules type
where
  /-- Gives the three values of a type variable or of the state space of a system that is a
  variable, such as `machine.V`, or refuses where the type is neither. -/
  undrawn (rules : List Translation.Rule) (type : Lean.Expr) : Lean.MetaM Core.Draw := do
    if (← parameterObjectOf rules type).isSome then
      Lean.throwError (Refusal.render (.drawnMonadicSystem type))
    let environment ← Lean.getEnv
    let stateSpace := match type.getAppFn, type with
      | .const name _, .app _ (.fvar _) => (environment.getProjectionFnInfo? name).isSome
      | _, _ => false
    unless (type.isFVar || stateSpace) &&
        (← Lean.Meta.whnfR (← Lean.Meta.inferType type)).isSort do
      Lean.throwError (Refusal.render (.undrawnType type))
    return .values

/-- Gives the variable that a test draws for a binder of a theorem, with the hypothesis that it
states where it is one, or neither where it binds a type variable or an instance, or refuses with
the reason where it has no data or states no hypothesis that a test can skip the values of. -/
def variableOf (rules : List Translation.Rule) (packageNamespace name : Lean.Name)
    (statements : List Lean.Expr) (binder : Lean.Expr) :
    Lean.MetaM (Option Core.Variable × Option (Bool × TermTree × TermTree)) := do
  let environment ← Lean.getEnv
  let type ← Lean.Meta.inferType binder
  -- A type variable takes the three values that the test draws at, and an instance of a class on
  -- it constrains it, so neither is a variable of the test.
  if isParameterType rules type || (← Lean.Meta.isClass? type).isSome then
    return (none, none)
  if ← Lean.Meta.isProp type then
    let hypothesis := fun (equal : Bool) (left right : Lean.Expr) ↦ do
      return (none, some (equal, ← reifyTerm rules packageNamespace (fuelOf left) left,
        ← reifyTerm rules packageNamespace (fuelOf right) right))
    return ← match type.getAppFn, type.getAppArgs.toList with
      | .const ``Ne _, [_, left, right] => hypothesis false left right
      | .const ``Eq _, [_, left, right] => hypothesis true left right
      | _, _ => Lean.throwError (Refusal.render (.noHypothesis type))
  let binderName ← binderNameOf binder
  if ["actual", "expected"].contains binderName then
    Lean.throwError (Refusal.render (.sideVariable name binderName))
  let reduced ← Lean.Meta.whnfR type
  if let .app (.const stream _) element := type then
    if Translation.formerOf? rules stream == some .stream then
      -- A stream is drawn as a prefix of it, which has a first element where the theorem takes
      -- the first element of the stream.
      let elementDraw ← drawOf rules packageNamespace (fuelOf element) element
      if elementDraw.reads then Lean.throwError (Refusal.render (.drawnFunctionInData type))
      let headed := statements.any fun statement ↦ (statement.find? fun
        | .app (.app (.const head _) _) taken =>
          Translation.isStructural rules .head head && taken == binder
        | _ => false).isSome
      return (some (.stream binderName elementDraw headed), none)
  if let some structureName ← bundledOf reduced then
    let .const declaration _ := type.getAppFn
      | Lean.throwError (Refusal.render (.undrawnType type))
    unless ExportTypeScript.isExported environment declaration &&
        (← kindOf declaration) matches .bundled do
      Lean.throwError (Refusal.render (.undrawnDeclaration declaration))
    -- A system is drawn as the table of its structure, which its constructor reads.
    let (field, table) ← bundledFieldsOf rules reduced fun _ fields ↦ do
      match fields with
      | [(field, shape)] =>
        return (← fieldNameOf structureName field,
          ← drawOf rules packageNamespace (fuelOf shape) shape)
      | _ => Lean.throwError (Refusal.render (.drawnSystemFields declaration))
    testModuleOf declaration
    return (some (.system binderName (← declarationReferenceOf packageNamespace declaration) field
      table), none)
  return (some (.value binderName (← drawOf rules packageNamespace (fuelOf type) type)), none)

/-- Runs a computation on the tree of a theorem of the theory under its variables and the leading
`have`s of its conclusion, and refuses with the reason that the computation gives, or where the
theorem has no test. -/
def reifyTheorem {α : Type} (packageNamespace name : Lean.Name)
    (computation : TheoremTree → Except Refusal α) : Lean.MetaM α := do
  let rules ← rulesOf
  let environment ← Lean.getEnv
  let documentation := Source.commentOf environment name
  Lean.Meta.forallTelescope (← Lean.getConstInfo name).type fun binders conclusion ↦ do
    let statements := conclusion :: (← binders.toList.mapM Lean.Meta.inferType)
    let read ← binders.toList.mapM (variableOf rules packageNamespace name statements)
    let variables := read.filterMap (·.1)
    let streams := variables.filterMap fun
      | .stream streamName .. => some streamName
      | _ => none
    let testName := (name.replacePrefix packageNamespace .anonymous).toString
    underHaves rules streams testName documentation variables (read.filterMap (·.2)) []
      (fuelOf conclusion) conclusion
where
  /-- Takes the leading `have`s of the conclusion one at a time, with a step of the fuel for every
  one, and runs the computation on the equation under them. -/
  underHaves (rules : List Translation.Rule) (streams : List String) (testName : String)
      (documentation : Except Refusal Core.Documentation) (variables : List Core.Variable)
      (hypotheses : List (Bool × TermTree × TermTree)) (haves : List (String × TermTree))
      (fuel : Nat) (conclusion : Lean.Expr) : Lean.MetaM α := do
    match fuel, conclusion with
    | 0, .letE .. => Lean.throwError (Refusal.render (.fuel conclusion))
    | fuel + 1, .letE haveName type value body _ =>
      let tree ← reifyTerm rules packageNamespace (fuelOf value) value
      Lean.Meta.withLetDecl haveName type value fun binder ↦
        underHaves rules streams testName documentation variables hypotheses
          (haves ++ [(haveName.toString, tree)]) fuel (body.instantiate1 binder)
    | _, _ =>
      let .app (.app (.app (.const ``Eq _) type) left) right := conclusion
        | Lean.throwError (Refusal.render (.noEquation conclusion))
      -- Two streams are compared by a prefix of each, as long as the stream that the test draws,
      -- or of a fixed length where it draws none.
      let comparison ← match type with
        | .app (.const former _) element =>
          match Translation.formerOf? rules former with
          | some .stream | some .sequence =>
            if (element.find? fun part ↦ match part with
                | .const nested _ =>
                  Translation.formerOf? rules nested == some .stream ||
                    Translation.formerOf? rules nested == some .sequence
                | _ => false).isSome then
              Lean.throwError (Refusal.render (.streamOfStreams conclusion))
            match streams with
            | [] => pure (Core.Comparison.prefix none
                (Translation.formerOf? rules former == some .stream))
            | [stream] => pure (.prefix (some stream)
                (Translation.formerOf? rules former == some .stream))
            | _ => Lean.throwError (Refusal.render (.severalStreams conclusion name))
          | _ => pure .values
        | _ => pure .values
      let tree : TheoremTree := {
        name := testName
        documentation
        variables
        hypotheses
        haves
        left := ← reifyTerm rules packageNamespace (fuelOf left) left
        right := ← reifyTerm rules packageNamespace (fuelOf right) right
        comparison }
      match computation tree with
      | .ok value => return value
      | .error refusal => Lean.throwError refusal.render

end Translator.Lean
