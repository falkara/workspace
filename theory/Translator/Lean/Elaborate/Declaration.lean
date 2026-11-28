/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Core.Declaration
public import Translator.Lean.Elaborate.Type

/-!
# Declaration

The module defines the translation of the trees of a declaration of the theory into a declaration
of the core: every tree of a type as a type, every tree of a schema as a schema, and every default
value of a type parameter as a type constructor where the parameter is one and as a type
otherwise, with the extension of a bundled structure where every part of it has a translation and
none otherwise.
-/

public section

namespace Translator.Lean

/-- Gives the type parameter of the core that the tree of a type parameter takes, with its default
value as a type constructor where the parameter is one and as a type otherwise, or refuses with
the reason. -/
def TypeParameter.toCore (context : Elaborate.Context) (parameter : Core.TypeParameter Tree) :
    Except Refusal (Core.TypeParameter Core.Argument) := do
  return {
    name := parameter.name
    kind := parameter.kind
    default := ← parameter.default.mapM fun default ↦
      if parameter.kind == .constructor then
        Core.Argument.constructor <$> default.toConstructor context
      else Core.Argument.type <$> default.toType context }

/-- Gives the field of the core that the tree of a field takes, by a translation of its tree. -/
def Field.toCore {τ : Type} (translation : Tree → Except Refusal τ) (field : Core.Field Tree) :
    Except Refusal (Core.Field τ) := do
  return {
    name := field.name
    documentation := field.documentation
    type := ← translation field.type }

/-- Gives the morphism of the core that the tree of a morphism of a law takes, or refuses with the
reason. -/
def Morphism.toCore (context : Elaborate.Context) :
    Core.Morphism Tree → Except Refusal (Core.Morphism Core.TypeTerm)
  | .parameter name => pure (.parameter name)
  | .identity type => return .identity (← type.toType context)
  | .compose first second =>
    return .compose (← Morphism.toCore context first) (← Morphism.toCore context second)
  | .map domain codomain morphism => do
    let domain ← domain.toType context
    return .map domain (← codomain.toType context) (← Morphism.toCore context morphism)

/-- Gives the law of the core that the tree of a law takes, or refuses with the reason. -/
def Law.toCore (context : Elaborate.Context) (law : Core.Law Tree) :
    Except Refusal (Core.Law Core.TypeTerm) := do
  return {
    name := law.name
    documentation := law.documentation
    typeParameters := law.typeParameters
    parameters := ← law.parameters.mapM fun (name, type) ↦ return (name, ← type.toType context)
    domain := ← law.domain.toType context
    equivalence := ← law.equivalence.mapM (·.toType context)
    left := ← Morphism.toCore context law.left
    right := ← Morphism.toCore context law.right }

/-- Gives the declaration of the core that the trees of a declaration take, or refuses with the
reason of the first tree without a translation. -/
def Declaration.toCore (context : Elaborate.Context) :
    Core.Declaration Tree Tree Tree →
      Except Refusal (Core.Declaration Core.TypeTerm Core.Argument Core.Schema)
  | .data reference documentation schema constructor fields => do
    return .data reference documentation schema constructor
      (← fields.mapM (Field.toCore (·.toSchema context)))
  | .refinement reference documentation schema base condition => do
    return .refinement reference documentation schema (← base.toSchema context) condition
  | .structure reference documentation constructor typeParameters fields => do
    return .structure reference documentation constructor
      (← typeParameters.mapM (TypeParameter.toCore context))
      (← fields.mapM (Field.toCore (·.toType context)))
  | .bundle reference documentation constructor typeParameters extended fields => do
    -- The extension is an attempt, which a type without a translation leaves out.
    return .bundle reference documentation constructor
      (← typeParameters.mapM (TypeParameter.toCore context))
      (extended.bind fun extended ↦ (extended.toType context).toOption)
      (← fields.mapM (Field.toCore (·.toType context)))
  | .lambda reference documentation typeParameters object => do
    return .lambda reference documentation (← typeParameters.mapM (TypeParameter.toCore context))
      (← object.toType context)
  | .curried reference documentation typeParameters parameter object record => do
    return .curried reference documentation (← typeParameters.mapM (TypeParameter.toCore context))
      parameter (← object.toType context)
      (← record.mapM fun record ↦ do
        return { record with arguments := ← record.arguments.mapM (·.toType context) })
  | .functorClass reference documentation constructor axioms functor fields laws => do
    return .functorClass reference documentation constructor axioms functor
      (← fields.mapM (Field.toCore (·.toType context))) (← laws.mapM (Law.toCore context))
  | .alias reference documentation typeParameters type => do
    return .alias reference documentation (← typeParameters.mapM (TypeParameter.toCore context))
      (← type.toType context)
  | .function reference documentation typeParameters bundledParameters signature => do
    return .function reference documentation typeParameters bundledParameters
      (← signature.toType context)
  | .value reference documentation type value => do
    return .value reference documentation (← type.toType context) value
  | .instance reference documentation typeParameters => do
    return .instance reference documentation (← typeParameters.mapM (TypeParameter.toCore context))

/-- Gives the module of the core that the trees of a module take, or refuses with the reason of the
first declaration without a translation. -/
def Module.toCore (context : Elaborate.Context) (module : Core.Module Tree Tree Tree) :
    Except Refusal (Core.Module Core.TypeTerm Core.Argument Core.Schema) := do
  return { module with declarations := ← module.declarations.mapM (Declaration.toCore context) }

end Translator.Lean
