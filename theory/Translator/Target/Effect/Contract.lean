/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Core.Declaration
public import Translator.Target.Effect.Type

import Translator.Target.Effect.Declaration
import Translator.Target.Effect.Shape

/-!
# Contract

The module defines the contract of a module of the core, an interface that names every function as
the module of the package beside the file exports it, such as `behavior`, and the instance of the
class of functors that every functor takes, such as `functor`, and a type that fails to compile
where that module leaves a function out or gives it another type, as a signature of a module in ML
requires of the module, and the declarations of TypeScript of a whole module.

## Implementation Notes

The contract and its check stay unexported, as they concern the module of the package alone, and
the check takes a name that opens with `_`, as Oxlint takes such a name for a declaration that is
meant to stay unused.

An instance takes the type parameters of its functor and an instance of every functor among them,
such as the functors of a composite, whose action on morphisms it applies, named as the functor in
camel case, as TypeScript names a value.
-/

public section

namespace Translator.Effect

/-- Gives the member of the contract that a declaration of the core takes: the type of a function
under its name, and the type of the instance of the class of functors that a functor takes under
the name of the class in camel case where the functor takes the name of its module and under its
own name otherwise, where the declaration is one. -/
def memberOf (context : Context) (functorClass : Option Core.Reference) :
    Core.Declaration Core.TypeTerm Core.Argument Core.Schema → Option TypeScript.Member
  | .function reference documentation .. =>
    some (.property (some (documentationOf documentation)) (valueNameOf reference)
      (.reference (.identifier (typeNameOf reference)) []))
  | .instance reference documentation typeParameters =>
    let className := (functorClass.map (nameOf context)).getD (.identifier "")
    let name := if reference.takesModuleName then
        ((functorClass.map typeNameOf).getD "").decapitalize
      else valueNameOf reference
    some (.property (some (documentationOf documentation)) name
      (.function (typeParameters.map (typeParameterOf context .inferred))
        (typeParameters.filterMap fun parameter ↦
          if parameter.kind == .functor then
            some (.mk (.identifier parameter.name.decapitalize)
              (some (.reference className [.reference (.identifier parameter.name) []])))
          else none)
        (.reference className
          [.reference (.identifier (typeNameOf reference))
            (typeParameters.map fun parameter ↦ .reference (.identifier parameter.name) [])])))
  | _ => none

/-- Gives the contract of a module of the core and its check, where the module takes a function or
an instance, given the path of the module, whose module of the package the check names. -/
def contractOf (context : Context) (path : String)
    (module : Core.Module Core.TypeTerm Core.Argument Core.Schema) :
    List TypeScript.Statement :=
  -- The functions come first and the instances after them, each in the order of the module.
  let functions := module.declarations.filter fun
    | .function .. => true
    | _ => false
  let instances := module.declarations.filter fun
    | .instance .. => true
    | _ => false
  let members := (functions ++ instances).filterMap (memberOf context module.functorClass)
  if members.isEmpty then [] else
    [.interface
        (some { text := s!"A contract of the functions of the theory that the module `{path}` of \
          the package implements.", addresses := [] })
        false "Contract" [] none members,
      .typeAlias
        (some { text := s!"A check of the module `{path}` of the package, which fails to compile \
          where the module leaves a function of the contract out or gives the function another \
          type.", addresses := [] })
        false "_Implemented"
        [.mk .inferred "Implementation" (some (.reference (.identifier "Contract") []))
          (some (.query (.symbol (.module path))))]
        (.reference (.identifier "Implementation") [])]

/-- Gives the declarations of TypeScript of a module of the core, every declaration in the order of
the module and the contract of the module after them. -/
def lowerModule (context : Context) (path : String)
    (module : Core.Module Core.TypeTerm Core.Argument Core.Schema) :
    List TypeScript.Statement :=
  module.declarations.flatMap (lowerDeclaration context module.functorClass) ++
    contractOf context path module

end Translator.Effect
