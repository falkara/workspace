/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Lean.Expr
public import Translator.Core.Reference

/-!
# Tree

The module defines the tree of a type of the theory that `Reify` reads from Lean: the type with
every object of a functor reduced, every type parameter by its name, every declaration that the
theory gives a counterpart by its reference with the arguments that the counterpart takes, and
every binder told apart by the way it binds, as data that `Elaborate` translates by rules alone.

## Implementation Notes

Every node keeps the expression of Lean that it reads, so a refusal names the expression as Lean
prints it.

A morphism of the category of types and an object of a functor whose declaration names the fields
of a structure are nodes of their own, as Lean unfolds both into a function type and a structure,
which a target writes in other forms.
-/

public section

namespace Translator.Lean

/-- The role of an argument of a declaration that the theory gives a counterpart. -/
inductive Role where
  /-- An argument of a parameter without a default value. -/
  | required
  /-- An argument past the binders of the declaration, such as the state space of a system. -/
  | extra
  /-- An argument of a parameter with a default value, at that value or not. -/
  | defaulted (atDefault : Bool)
  deriving Repr, DecidableEq

mutual

/-- The tree of a type of the theory. -/
inductive Tree where
  /-- A type parameter, a local of a type, by its name. -/
  | parameter (name : String) (source : Lean.Expr)
  /-- The object of a type lambda. -/
  | target (source : Lean.Expr)
  /-- An application of a constant without a counterpart to every argument it takes. -/
  | constant (name : Lean.Name) (arguments : List Tree) (source : Lean.Expr)
  /-- An application of a declaration that the theory gives a counterpart, whether it is a type of
  data, and its arguments. -/
  | declared (reference : Core.Reference) (data : Bool) (arguments : List DeclaredArgument)
      (source : Lean.Expr)
  /-- The object of a functor or a type constructor that is a parameter. -/
  | object (functor object : Tree) (source : Lean.Expr)
  /-- The object of a functor whose declaration names the fields of the structure it gives. -/
  | record (reference : Core.Reference) (fields : List RecordField) (source : Lean.Expr)
  /-- A morphism of the category of types. -/
  | morphism (domain codomain : Tree) (source : Lean.Expr)
  /-- A function type by its explicit parameters, on which its result does not depend, and its
  result, which is no such function type, as a function type takes every parameter of the function
  types it gives in one list. -/
  | function (parameters : List FunctionParameter) (result : Tree) (source : Lean.Expr)
  /-- A function type whose result depends on its explicit parameter. -/
  | dependent (name : Lean.Name) (source : Lean.Expr)
  /-- A function type whose parameter is not explicit and no implicit type. -/
  | implicit (name : Lean.Name) (source : Lean.Expr)
  /-- A function type whose parameter is an implicit type, with its body at a local of the name. -/
  | generic (name : Lean.Name) (body : Tree) (source : Lean.Expr)
  /-- An expression of any other form. -/
  | other (source : Lean.Expr)

/-- An argument of a declaration that the theory gives a counterpart. -/
inductive DeclaredArgument where
  /-- An argument by its tree, whether its parameter is a type constructor, its role, and the
  polarities at which the declaration takes it. -/
  | mk (tree : Tree) (constructor : Bool) (role : Role) (variance : List Bool)

/-- A field of the structure that the object of a functor gives. -/
inductive RecordField where
  /-- A field by the name that the declaration of the functor gives it and its tree. -/
  | mk (name : String) (tree : Tree)

/-- An explicit parameter of a function type. -/
inductive FunctionParameter where
  /-- A parameter by the name of its binder, its tree, and the function type that binds it. -/
  | mk (name : Lean.Name) (domain : Tree) (source : Lean.Expr)

end

deriving instance Repr, BEq for Tree, DeclaredArgument, RecordField, FunctionParameter

/-- Gives the expression of Lean that a tree reads. -/
def Tree.source : Tree → Lean.Expr
  | .parameter _ source | .target source | .constant _ _ source | .declared _ _ _ source
  | .object _ _ source | .record _ _ source | .morphism _ _ source | .function _ _ source
  | .dependent _ source | .implicit _ source | .generic _ _ source | .other source => source

end Translator.Lean
