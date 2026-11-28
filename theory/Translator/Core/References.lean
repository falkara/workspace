/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Core.Declaration
public import Translator.Core.Type

/-!
# References

The module defines the declarations of the theory that a module of the core names, as a fold over
its types, its type constructors, its schemas, and its declarations, each declaration once, in the
order in which the module first names it.
-/

public section

namespace Translator.Core

mutual

/-- Gives the declarations that a type names, in order. -/
def TypeTerm.references : TypeTerm → List Reference
  | .rational | .string | .boolean | .unit | .parameter _ | .target => []
  | .option element | .array element | .stream element | .sequence element => element.references
  | .product presentation fields =>
    presentation.toList ++ fields.flatMap NamedType.references
  | .sum left right => left.references ++ right.references
  | .effect success failure requirements =>
    success.references ++ failure.references ++ requirements.references
  | .apply constructor argument => constructor.references ++ argument.references
  | .named reference arguments _ => reference :: arguments.flatMap Argument.references
  | .function _ parameters result => parameters.flatMap NamedType.references ++ result.references

/-- Gives the declarations that a type constructor names, in order. -/
def Constructor.references : Constructor → List Reference
  | .parameter _ | .option => []
  | .identity label => [label]
  | .named reference arguments _ => reference :: arguments.flatMap Argument.references

/-- Gives the declarations that an argument names, in order. -/
def Argument.references : Argument → List Reference
  | .type type => type.references
  | .constructor constructor => constructor.references

/-- Gives the declarations that the type of a field or a parameter names, in order. -/
def NamedType.references : NamedType → List Reference
  | .mk _ type => type.references

end

/-- Gives the declarations that a schema names, in order. -/
def Schema.references : Schema → List Reference
  | .rational | .string | .boolean => []
  | .option element | .array element => element.references
  | .named reference => [reference]

mutual

/-- Gives the declarations that a value names, the structures it builds, in order. -/
def Value.references : Value → List Reference
  | .rational .. => []
  | .structure declaration fields => declaration :: Value.fieldReferences fields
  | .pair first second => first.references ++ second.references

/-- Gives the declarations that the values of the fields of a structure name, in order. -/
def Value.fieldReferences : List (String × Value) → List Reference
  | [] => []
  | (_, contents) :: rest => contents.references ++ Value.fieldReferences rest

end

/-- Gives the declarations that a morphism of a law names, in order. -/
def Morphism.references : Morphism TypeTerm → List Reference
  | .parameter _ => []
  | .identity type => type.references
  | .compose first second => first.references ++ second.references
  | .map domain codomain morphism =>
    domain.references ++ codomain.references ++ morphism.references

/-- Gives the declarations that the default value of a type parameter names. -/
def TypeParameter.references (parameter : TypeParameter Argument) : List Reference :=
  parameter.default.toList.flatMap Argument.references

/-- Gives the declarations that a declaration names beyond itself, in order. -/
def Declaration.references : Declaration TypeTerm Argument Schema → List Reference
  | .data _ _ _ _ fields => fields.flatMap (·.type.references)
  | .refinement _ _ _ base condition => base.references ++ [condition]
  | .structure _ _ _ typeParameters fields =>
    typeParameters.flatMap TypeParameter.references ++ fields.flatMap (·.type.references)
  | .bundle _ _ _ typeParameters extended fields =>
    typeParameters.flatMap TypeParameter.references ++
      extended.toList.flatMap TypeTerm.references ++ fields.flatMap (·.type.references)
  | .lambda _ _ typeParameters object =>
    typeParameters.flatMap TypeParameter.references ++ object.references
  | .curried _ _ typeParameters _ object record =>
    typeParameters.flatMap TypeParameter.references ++ object.references ++
      record.toList.flatMap (·.arguments.flatMap TypeTerm.references)
  | .functorClass _ _ _ _ _ fields laws =>
    fields.flatMap (·.type.references) ++ laws.flatMap fun law ↦
      law.parameters.flatMap (·.2.references) ++ law.domain.references ++
        law.equivalence.toList.flatMap TypeTerm.references ++ law.left.references ++
        law.right.references
  | .alias _ _ typeParameters type => typeParameters.flatMap TypeParameter.references ++
    type.references
  | .function _ _ _ _ signature => signature.references
  | .value _ _ type contents => type.references ++ contents.references
  | .instance _ _ typeParameters => typeParameters.flatMap TypeParameter.references

/-- Gives the declarations that a module names, each once, in the order in which it first names
them. -/
def Module.references (module : Module TypeTerm Argument Schema) : List Reference :=
  (module.declarations.flatMap Declaration.references).eraseDups

end Translator.Core
