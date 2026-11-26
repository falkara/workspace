/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public meta import Falkara.Citation
public meta import Falkara.ExportTypeScript  -- shake: keep
public import Lean.Meta.Basic

import Falkara.Citation
import Falkara.ExportTypeScript
import Lean.Structure

/-!
# Counterpart

The module defines the attribute `counterpart`, which gives a declaration of the theory its
counterparts outside Lean: the item of a work that the declaration states, and the declaration that
the generator writes as TypeScript. A declaration takes the attribute above it, as

```
@[counterpart CIE.internationalLightingVocabulary "17-23-052"
  (x := "17-23-053")
  (y := "17-23-053")
  typescript
    r"A property of a color stimulus that its chromaticity coordinates $x$ and $y$ define."
    (x
      r"The quotient of the tristimulus value $X$ and the sum $X + Y + Z$.")
    (y
      r"The quotient of the tristimulus value $Y$ and the sum $X + Y + Z$.")]
structure Chromaticity where
```

with `<work> <label>` the item that the declaration states, as a reference names the work and then
the place in it, `<work>` the name of the work in the module `Falkara.References` and `<label>` the
label of the item as the work writes it, a string, or the name of the declaration where the item is
one, such as an item of Mathlib, then a clause `(<field> := <label>)` for every field with the
item that it states, of the work of the declaration unless the clause names another before the
label, then, where the generator writes the declaration, `typescript` with the documentation
comment that the declaration takes in TypeScript as a raw string literal and a clause for every
binder or field with the name that it takes there, as `(V → "State")`, where it is another than
its own, and its documentation comment. A declaration that the theory alone needs
takes the item alone, as `@[counterpart Jacobs.introductionToCoalgebra "(2.22)"]`.

## Main Definitions

- `itemOf`: gives the item of a work by its label and the name of the work in the module
  `Falkara.References`, or fails with the reason where the name is no declaration of a work.
- `objectFieldsOf`: gives the structure that a functor gives at every object and its fields, where
  it gives one.
- `bindersOf`: gives the names that a declaration binds, the binders of its type, its fields and
  those of the structure that it labels, the object that its definition names where its type is a
  functor, and the structure that the functor gives at every object with its fields.
- `rawStringAhead`: the parser that passes where a raw string literal follows, reading nothing.
- `counterpartLabel`, `fieldItem`, `citationClause`, `typeScriptComment`, `typeScriptClause`,
  `typeScriptBlock`, `counterpart`: the syntax of the label of an item, of the item of a field, of
  a clause of a field with its item, of a comment in TypeScript, of a clause in TypeScript, of the
  counterpart in TypeScript, and of the attribute `counterpart`.
- `textOf`: gives the text of a documentation comment in TypeScript.

## Implementation Notes

The attribute looks a work up in the module `Falkara.References`, which holds every work, so a
citation names the work without the namespace of the module. It refuses every name that is no
declaration of a work, so a citation of a work the theory never declares fails to elaborate.

A field takes no attribute of its own in Lean, so its structure gives the item that the field
states in a clause, which the attribute records for the projection of the field, such as
`Chromaticity.x`.

The attribute gives a declaration its counterpart in TypeScript by hand rather than every
declaration of a library, so a declaration that the theory alone needs, such as a data table
licensed otherwise than the packages, stays out of the packages.

A type parameter or a field takes in TypeScript the term that names what it is, such as `State` for
the carrier of a coalgebra, `Endofunctor` for its functor, or `structure` for its structure, rather
than the letter or the abbreviation that the mathematics gives it, such as `V`, `F`, or `str`, as
the packages lie a layer above Effect, whose own modules name a type lambda `F`. A clause that
names no name keeps the name of the binder or the field.

Every declaration and every field that TypeScript writes takes its comment from the attribute,
which requires the comment of the declaration, and never from the documentation comment of the
theory, as the theory speaks of mathematics and TypeScript to the developers who use Effect, even
where the two comments say the same. A comment in TypeScript is a raw string literal rather than a
documentation comment of Lean, so it reads as the text that the generator writes into another
language rather than as the documentation of the declaration below it, and keeps every backslash of
a formula unescaped; the syntax refuses an ordinary string literal there, which would escape them.
A comment in TypeScript cites no work of its own, as it speaks
in the terms of a developer rather than of a work, and the item that the declaration states gives
the developer the source of the declaration.

The clauses of a structure of Mathlib lie on the declaration of the theory that labels it, such as
`Coalgebra` for `CategoryTheory.Endofunctor.Coalgebra`, as the label is what the theory writes as
TypeScript, so the generator finds the clauses of a field by the label of its structure.

The items that a declaration and its fields state lie at the top of the attribute, and its
counterpart in TypeScript in a block of its own under the keyword `typescript`, so the mathematics
reads the same whether the generator writes the declaration or not, and a counterpart in another
language would take a block of its own. A field that the declaration cites and TypeScript writes
takes a clause in each. A clause of a field with its item takes `:=` and a clause in TypeScript
takes `→` for its name, as Mathlib gives a value and a new name, so a clause on the wrong side of
`typescript` fails to parse rather than change its meaning. A keyword of Lean is a token of every
module that imports the attribute, so `typescript` names no identifier there.

The attribute runs while a module compiles, so it lies in a meta section, and it writes into the
records of `Falkara.Citation`, which it imports at both phases, as its functions name the item of a
work, and `Falkara.ExportTypeScript`, which its handler alone uses.
-/

public meta section

namespace Falkara.Counterpart

/-- The syntax of the label of an item, a string as the work writes it, or the name of a declaration
of Lean where the item is one, such as an item of Mathlib. -/
syntax counterpartLabel := str <|> ident

/-- Gives the item of a work by its label and the name of the work in the module
`Falkara.References`, or fails with the reason where the label names no declaration or the name is
no declaration of a work. -/
def itemOf (label : Lean.TSyntax ``counterpartLabel) (work : Lean.Ident) :
    Lean.AttrM Citation.Item :=
  -- The citation records the names of the item and the work alone, so no public declaration
  -- depends on them.
  Lean.withoutExporting do
  let text ← match label with
    | `(counterpartLabel| $text:str) => pure text.getString
    | `(counterpartLabel| $declaration:ident) => do
      -- A label that names a declaration is its full name, which Lean resolves, so a misspelt name
      -- fails to elaborate.
      let name ← Lean.Elab.realizeGlobalConstNoOverloadWithInfo declaration
      Lean.recordExtraModUseFromDecl name (isMeta := false)
      pure name.toString
    | _ => Lean.throwError "A label is a string or the name of a declaration."
  -- The work is named as in the module `Falkara.References`, which holds every work.
  let name ← Lean.Elab.realizeGlobalConstNoOverloadWithInfo
    (Lean.mkIdentFrom work (`Falkara.References ++ work.getId))
  -- The citation needs the module of the work, which `lake shake` sees in no constant.
  Lean.recordExtraModUseFromDecl name (isMeta := false)
  let information ← Lean.getConstInfo name
  unless information.type == Lean.mkConst ``Citation.Work do
    Lean.throwError m!"`{name}` is no declaration of a work, as its type is \
      `{information.type}` rather than `Citation.Work`."
  return { label := text, work := name }

/-- Gives the structure that a functor gives at every object and its fields, such as `Prod` with
`fst` and `snd` for the product that the functor of binary products gives, where it gives one,
following the functors that a curried functor gives, with at most as many steps as the fuel. -/
def objectFieldsOf : (fuel : Nat) → (functor type : Lean.Expr) → Lean.MetaM (List Lean.Name)
  | 0, _, _ => return []
  | fuel + 1, functor, type => do
  let type ← Lean.Meta.whnfR type
  let .const `CategoryTheory.Functor levels := type.getAppFn | return []
  Lean.Meta.withLocalDeclD `object (type.getArg! 0) fun object ↦ do
    let image := Lean.mkAppN (.const `CategoryTheory.Functor.obj levels)
      (type.getAppArgs ++ #[functor, object])
    let imageType ← Lean.Meta.inferType image
    if (← Lean.Meta.whnfR imageType).isAppOf `CategoryTheory.Functor then
      return ← objectFieldsOf fuel image imageType
    let .const structureName _ := (← Lean.Meta.whnfD image).getAppFn | return []
    let environment ← Lean.getEnv
    return if Lean.isStructure environment structureName then
      structureName :: (Lean.getStructureFields environment structureName).toList
    else []

/-- Gives the names that a declaration binds: the binders of its type, its fields and those of the
structure that it labels, the object that its definition names where its type is a functor, such as
`X` of `CategoryTheory.Limits.Types.binaryProductFunctor`, which maps every type `X` to a functor,
and the structure that the functor gives at every object with its fields, such as `Prod` with `fst`
and `snd` for the product that the functor gives. -/
def bindersOf (declaration : Lean.Name) : Lean.MetaM (List Lean.Name) := do
  let information ← Lean.getConstInfo declaration
  let environment ← Lean.getEnv
  let labelled := match information.value? with
    | some (.const name _) => [declaration, name]
    | _ => [declaration]
  let fields := labelled.flatMap fun structureName ↦
    if Lean.isStructure environment structureName then
      (Lean.getStructureFieldsFlattened environment structureName).toList
    else []
  -- The definition gives the object of a functor as a function, whose binder names the object.
  let objects ← Lean.Meta.forallTelescope information.type fun arguments body ↦ do
    let body ← Lean.Meta.whnfR body
    let .const `CategoryTheory.Functor levels := body.getAppFn | return []
    let functor := Lean.mkAppN (.const declaration (information.levelParams.map .param)) arguments
    let .lam name .. ← Lean.Meta.whnfD (Lean.mkAppN (.const `CategoryTheory.Functor.obj levels)
        (body.getAppArgs.push functor)) | return []
    return [name]
  -- A functor names the structure that it gives and its fields, such as the product of a functor of
  -- binary products, through at most two functors, as a curried functor gives a functor in turn.
  let objectFields ← Lean.Meta.forallTelescope information.type fun arguments body ↦
    objectFieldsOf 2
      (Lean.mkAppN (.const declaration (information.levelParams.map .param)) arguments) body
  return information.type.getForallBinderNames ++ fields ++ objects ++ objectFields

/-- The category of the syntax of the item of a work that a field states, its work and its label, or
its label alone where the field states an item of the work of the declaration. -/
declare_syntax_cat fieldItem

/-- The syntax of the item of a work that a field states, with the work that it lies in. -/
syntax ident ppSpace counterpartLabel : fieldItem

/-- The syntax of the item that a field states, of the work of the declaration. -/
syntax counterpartLabel : fieldItem

/-- The syntax of a clause of a field with the item of a work that the field states, of the work
of the declaration unless the clause names another before the label. -/
syntax citationClause := "(" ident " := " fieldItem ")"

/-- Passes where a raw string literal follows and fails otherwise, reading nothing, so that a
comment in TypeScript is a raw string literal and never an ordinary one. -/
def rawStringAheadFn : Lean.Parser.ParserFn := fun context state ↦
  if context.get state.pos == 'r' then state else state.mkError "raw string literal"

/-- The parser that passes where a raw string literal follows, reading nothing. -/
def rawStringAhead : Lean.Parser.Parser := { fn := rawStringAheadFn }

/-- The formatter of `rawStringAhead`, which writes nothing, as the parser reads nothing. -/
@[combinator_formatter rawStringAhead]
def rawStringAhead.formatter : Lean.PrettyPrinter.Formatter := pure ()

/-- The parenthesizer of `rawStringAhead`, which adds nothing, as the parser reads nothing. -/
@[combinator_parenthesizer rawStringAhead]
def rawStringAhead.parenthesizer : Lean.PrettyPrinter.Parenthesizer := pure ()

/-- The syntax of a documentation comment in TypeScript, a raw string literal, which reads as the
text that the generator writes into TypeScript rather than as the documentation of Lean code, and
keeps every backslash of its formulas as written. -/
syntax typeScriptComment := rawStringAhead str

/-- The syntax of a clause of a binder or a field in TypeScript, with the name that it takes there
where it is another than its own, and its documentation comment. -/
syntax typeScriptClause := "(" ident (" → " str)? (ppSpace typeScriptComment)? ")"

/-- The syntax of the counterpart of a declaration in TypeScript, with the documentation comment
that the declaration takes there and the clauses of its binders and fields. -/
syntax typeScriptBlock := " typescript " typeScriptComment (ppSpace typeScriptClause)*

/-- Gives the text of a documentation comment in TypeScript, the contents of its raw string
literal. -/
def textOf (comment : Lean.TSyntax ``typeScriptComment) : String :=
  (⟨comment.raw[0]⟩ : Lean.StrLit).getString

/-- The syntax of the attribute that gives a declaration its counterparts outside Lean: the item of
a work that it states, the items that its fields state, and its counterpart in TypeScript, where
the generator writes it. -/
syntax (name := counterpart) "counterpart" (ppSpace ident ppSpace counterpartLabel)?
  (ppSpace citationClause)* (typeScriptBlock)? : attr

/-- The attribute that gives a declaration its counterparts outside Lean, refusing a declaration of
another module that it cites, a declaration or a field that cites an item already, a declaration
whose counterpart in TypeScript the theory gives already, a name that the declaration does not
bind, a field that the declaration does not have, and a name that is no declaration of a work. -/
initialize Lean.registerBuiltinAttribute {
  name := `counterpart
  descr := "give a declaration the item of a work that it states and its counterpart in TypeScript"
  add := fun declaration attributeSyntax kind ↦ do
    unless kind == .global do
      Lean.throwError "A counterpart is global, as the records of the counterparts are."
    let `(attr| counterpart $[$work? $label?]? $citationClauses* $[$block?]?) := attributeSyntax
      | Lean.throwError "A counterpart takes the item of a work that the declaration states, the \
          items that its fields state, and its counterpart in TypeScript."
    let environment ← Lean.getEnv
    let another := (environment.getModuleIdxFor? declaration).isSome
    let binders ← (bindersOf declaration).run' {} {}
    let fields := if Lean.isStructure environment declaration then
      (Lean.getStructureFields environment declaration).toList
    else []
    let item? ← match label?, work? with
      | some label, some work => do
        if another then
          Lean.throwError m!"`{declaration}` lies in another module, which alone cites it."
        if (Citation.citationOf? environment declaration).isSome then
          Lean.throwError m!"`{declaration}` cites an item already."
        some <$> itemOf label work
      | _, _ => pure none
    let fieldCitations ← citationClauses.toList.mapM
      fun (clause : Lean.TSyntax ``citationClause) ↦ do
        let `(citationClause| ($field:ident := $fieldItem)) := clause
          | Lean.throwErrorAt clause "A clause of a field takes the field and the item of a work \
              that it states."
        let (fieldWork, fieldLabel) ← match fieldItem with
          | `(fieldItem| $fieldWork:ident $fieldLabel:counterpartLabel) =>
            pure (some fieldWork, fieldLabel)
          | `(fieldItem| $fieldLabel:counterpartLabel) => pure (none, fieldLabel)
          | _ => Lean.throwErrorAt fieldItem "The item of a field takes its label, after its work \
              where the work is another than the work of the declaration."
        unless fields.contains field.getId do
          Lean.throwErrorAt field m!"`{field.getId}` is no field of `{declaration}`."
        let projection := declaration ++ field.getId
        if another then
          Lean.throwErrorAt field m!"`{projection}` lies in another module, which alone cites it."
        if (Citation.citationOf? environment projection).isSome then
          Lean.throwErrorAt field m!"`{projection}` cites an item already."
        let some fieldWork := fieldWork <|> work?
          | Lean.throwErrorAt clause m!"The clause of `{field.getId}` takes the work of its item, \
              as the declaration cites none."
        return (projection, ← itemOf fieldLabel fieldWork)
    let typeScript? ← block?.mapM fun block ↦ do
      let `(typeScriptBlock| typescript $comment:typeScriptComment $clauses*) := block
        | Lean.throwErrorAt block "A counterpart in TypeScript takes the comment of the \
            declaration and a clause for every binder or field that it names or comments."
      if ExportTypeScript.isExported environment declaration then
        Lean.throwErrorAt block m!"`{declaration}` has a counterpart in TypeScript already."
      let clauses ← clauses.toList.mapM fun (clause : Lean.TSyntax ``typeScriptClause) ↦ do
        let `(typeScriptClause| ($binder:ident $[→ $name?]? $[$fieldComment?]?)) := clause
          | Lean.throwErrorAt clause "A clause in TypeScript takes a binder or a field, the name \
              that it takes there, and its comment."
        unless binders.contains binder.getId do
          Lean.throwErrorAt binder m!"`{binder.getId}` is neither a binder nor a field of \
            `{declaration}`."
        if name?.isNone && fieldComment?.isNone then
          Lean.throwErrorAt clause m!"The clause of `{binder.getId}` takes a name or a comment in \
            TypeScript."
        return ({
          binder := binder.getId
          name := (name?.map (·.getString)).getD binder.getId.toString
          comment := fieldComment?.map textOf } : ExportTypeScript.Clause)
      return ({ declaration, comment := textOf comment, clauses }
        : ExportTypeScript.Export)
    let cited := fieldCitations.map (·.1)
    let named := (typeScript?.map (·.clauses.map (·.binder))).getD []
    if cited.eraseDups.length != cited.length || named.eraseDups.length != named.length then
      Lean.throwError "A binder or a field takes one clause alone in the items and one in \
        TypeScript."
    if item?.isNone && fieldCitations.isEmpty && typeScript?.isNone then
      Lean.throwError "A counterpart takes at least one of the item of a work that the declaration \
        states, the items that its fields state, and its counterpart in TypeScript."
    let citations := (item?.map (declaration, ·)).toList ++ fieldCitations
    Lean.modifyEnv fun environment ↦
      let cited := citations.foldl (fun environment (name, item) ↦
        Citation.citationExtension.insert environment name item) environment
      match typeScript? with
      | some typeScript => ExportTypeScript.exportExtension.addEntry cited typeScript
      | none => cited
}

end Falkara.Counterpart
