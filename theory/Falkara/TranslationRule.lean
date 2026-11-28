/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public meta import Falkara.Translation
public meta import Lean.Elab.Command

import Falkara.Translation
import Lean.Message

/-!
# Translation Rule

The module defines the command `translation_rule`, which gives a constant of Lean a rule of a
translator, and the command `translation_vector`, which gives a primitive a vector, as

```
translation_rule Rat 0 type rational
translation_rule HAdd.hAdd 6 at Rat primitive rationalAdd
translation_rule Prod.mk 4 structural pair
translation_vector rationalAdd Checks.sumOfHalves
```

with the constant, the number of arguments that an application of it takes, the type that its
first argument names after `at` where the rule holds at one type alone, and the action of the rule:
`type` with the word of a former, `structural` with the word of a structural part, `primitive` with
the word of a primitive, or `erase` with the index of the argument that the application stands for.
A vector takes the word of its primitive and a closed declaration of the theory.

## Implementation Notes

The commands resolve every constant while the module compiles, as the attribute `counterpart`
resolves the label of an item, so a misspelt constant fails to elaborate rather than leave a rule
that no application ever meets.

A rule refuses a number of arguments beyond the binders of the type of its constant, and an erasure
of an argument beyond the number of arguments, so an application that the rule names can take the
arguments it reads.

The commands run while a module compiles, so they lie in a meta section, and they write into the
record of `Falkara.Translation`, which they import at both phases.
-/

public meta section

namespace Falkara.TranslationRule

/-- The syntax of the action of a rule: a former, a structural part, or a primitive by its word, or
the erasure of an application to the argument at an index. -/
syntax translationAction := (&"type" ident) <|> (&"structural" ident) <|> (&"primitive" ident) <|>
  (&"erase" num)

/-- The syntax of a rule of a translator: its constant, the number of arguments that an application
of it takes, the type that its first argument names where the rule holds at one type alone, and its
action. -/
syntax (name := translationRule) "translation_rule " ident ppSpace num (" at " ident)? ppSpace
  translationAction : command

/-- The syntax of a vector of a primitive: the word of the primitive and a closed declaration. -/
syntax (name := translationVector) "translation_vector " ident ppSpace ident : command

/-- Gives the constant that an identifier names, recording the module of the constant as one that
the module of the command uses, or fails where the identifier names no constant. -/
def constantOf (identifier : Lean.Ident) : Lean.Elab.Command.CommandElabM Lean.Name :=
  Lean.Elab.Command.liftCoreM do
    let name ← Lean.Elab.realizeGlobalConstNoOverloadWithInfo identifier
    -- A rule records the name of its constant alone, which `lake shake` sees in no constant.
    Lean.recordExtraModUseFromDecl name (isMeta := false)
    return name

/-- Gives the value of a vocabulary that a word names, or fails with the words of the vocabulary. -/
def wordOf {α : Type} (kind : String) (all : List α) (word : α → String) (identifier : Lean.Ident) :
    Lean.Elab.Command.CommandElabM α := do
  let text := identifier.getId.toString
  match all.find? (word · == text) with
  | some value => return value
  | none => Lean.throwErrorAt identifier m!"`{text}` is no {kind}, as the {kind}s are \
      {", ".intercalate (all.map fun value ↦ s!"`{word value}`")}."

/-- Gives the action that the syntax of an action names, or fails with the reason. -/
def actionOf (action : Lean.TSyntax ``translationAction) :
    Lean.Elab.Command.CommandElabM Translation.Action :=
  -- The syntax of an action holds its keyword and its argument in a node of the two alone, as the
  -- keywords are no tokens that a quotation tells apart.
  let argument := action.raw[0][1]
  match action.raw[0][0].getAtomVal, argument.isIdent, argument.isNatLit? with
  | "type", true, _ =>
    .type <$> wordOf "former" Translation.Former.all Translation.Former.word ⟨argument⟩
  | "structural", true, _ =>
    .structural <$>
      wordOf "structural part" Translation.Structural.all Translation.Structural.word ⟨argument⟩
  | "primitive", true, _ =>
    .primitive <$>
      wordOf "primitive" Translation.Primitive.all Translation.Primitive.word ⟨argument⟩
  | "erase", _, some kept => pure (.erase kept)
  | _, _, _ => Lean.throwErrorAt action "An action is a former, a structural part, a primitive, or \
      an erasure."

/-- The command that gives a constant a rule of a translator, refusing a name that names no
constant, a number of arguments beyond the binders of the type of the constant, an erasure of an
argument beyond the number of arguments, and a second rule of one constant at one number of
arguments and one type. -/
@[command_elab translationRule]
def elaborateRule : Lean.Elab.Command.CommandElab := fun command ↦ do
  let `(translation_rule $constant:ident $arity:num $[at $domain?]? $action:translationAction) :=
      command
    | Lean.throwErrorAt command "A rule takes a constant, its number of arguments, the type of \
        its first argument where it holds at one type alone, and its action."
  let name ← constantOf constant
  let domain ← domain?.mapM constantOf
  let action ← actionOf action
  let some information := (← Lean.getEnv).find? name
    | Lean.throwErrorAt constant m!"`{name}` is no constant."
  let binders := information.type.getForallBinderNames.length
  if arity.getNat > binders then
    Lean.throwErrorAt arity m!"`{name}` takes at most {binders} arguments, as its type binds no \
      more."
  if let .erase kept := action then
    unless kept < arity.getNat do
      Lean.throwErrorAt command m!"An erasure keeps one of the {arity.getNat} arguments of the \
        application, so its index lies below {arity.getNat}."
  let rule : Translation.Rule := { constant := name, arity := arity.getNat, domain, action }
  if (Translation.rulesOf (← Lean.getEnv)).any fun other ↦
      other.constant == rule.constant && other.arity == rule.arity && other.domain == rule.domain
  then
    Lean.throwErrorAt constant m!"`{name}` has a rule at {arity.getNat} arguments already."
  Lean.modifyEnv (Translation.translationExtension.addEntry · (.rule rule))

/-- The command that gives a primitive a vector, refusing a word that names no primitive and a name
that names no constant. -/
@[command_elab translationVector]
def elaborateVector : Lean.Elab.Command.CommandElab := fun command ↦ do
  let `(translation_vector $primitive:ident $declaration:ident) := command
    | Lean.throwErrorAt command "A vector takes a primitive and a closed declaration."
  let primitive ←
    wordOf "primitive" Translation.Primitive.all Translation.Primitive.word primitive
  let declaration ← constantOf declaration
  Lean.modifyEnv (Translation.translationExtension.addEntry · (.vector { primitive, declaration }))

end Falkara.TranslationRule
