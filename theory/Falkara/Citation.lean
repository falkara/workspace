/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public meta import Falkara.Citation.Defs
public import Falkara.Citation.Defs

import Lean.Message

/-!
# Citation

The module defines the attribute `cite`, which records for a declaration the item of a work the
declaration states. A declaration cites the item as `attribute [cite "<label>" <work>] <name>`, with
`<label>` the label of the item as the work writes it and `<work>` the name of the work in the
module `Falkara.References`. The attribute refuses every name that is no declaration of a work, so a
citation of a work the theory never declares fails to elaborate. The works that a module cites,
each with its files, follow from the citations of the module.

## Main Definitions

- `itemOf`: gives the item of a work by its label and the name of the work in the module
  `Falkara.References`, or fails with the reason where the name is no declaration of a work.
- `cite`: the syntax of the attribute that cites the item of a work a declaration states.

## Implementation Notes

The attribute looks a work up in the module `Falkara.References`, which holds every work, so a
citation names the work without the namespace of the module.

The attribute runs while a module compiles, so it lies in a meta section, and it writes into the
record of `Falkara.Citation.Defs`, which it imports at both phases.
-/

public meta section

namespace Falkara.Citation

/-- Gives the item of a work by its label and the name of the work in the module
`Falkara.References`, or fails with the reason where the name is no declaration of a work. -/
def itemOf (label : Lean.StrLit) (work : Lean.Ident) : Lean.AttrM Item :=
  -- The citation records the name of the work alone, so no public declaration depends on it.
  Lean.withoutExporting do
  -- The work is named as in the module `Falkara.References`, which holds every work.
  let name ← Lean.Elab.realizeGlobalConstNoOverloadWithInfo
    (Lean.mkIdentFrom work (`Falkara.References ++ work.getId))
  -- The citation needs the module of the work, which `lake shake` sees in no constant.
  Lean.recordExtraModUseFromDecl name (isMeta := false)
  let information ← Lean.getConstInfo name
  unless information.type == Lean.mkConst ``Work do
    Lean.throwError m!"`{name}` is no declaration of a work, as its type is \
      `{information.type}` rather than `Citation.Work`."
  return { label := label.getString, work := name }

/-- The syntax of the attribute that cites the item of a work a declaration states. -/
syntax (name := cite) "cite " str ident : attr

/-- The attribute that cites the item of a work a declaration states, refusing a declaration of
another module, a declaration that cites an item already, and a name that is no declaration of a
work. -/
initialize Lean.registerBuiltinAttribute {
  name := `cite
  descr := "cite the item of a work that a declaration states"
  add := fun declaration attributeSyntax kind ↦ do
    unless kind == .global do
      Lean.throwError "A citation is global, as the record of the citations is."
    let `(attr| cite $label:str $work:ident) := attributeSyntax
      | Lean.throwError "A citation takes the label of the item as a string and the name of the \
          work."
    let environment ← Lean.getEnv
    if (environment.getModuleIdxFor? declaration).isSome then
      Lean.throwError m!"`{declaration}` lies in another module, which alone cites it."
    if (citationOf? environment declaration).isSome then
      Lean.throwError m!"`{declaration}` cites an item already."
    let item ← itemOf label work
    Lean.modifyEnv (citationExtension.insert · declaration item)
}

end Falkara.Citation
