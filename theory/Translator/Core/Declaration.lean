/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Core.Reference

/-!
# Declaration

The module defines the declarations of the core and the modules that hold them: a structure of
data with its schema, a refinement of a schema by a condition, a structure with type parameters, a
bundled structure, a functor or a type constructor as a type lambda, a curried functor, a class of
functors with its laws, a type alias, a function by its signature, a value, and the instance of the
class of functors that a functor takes, each with its documentation and the documentation of every
function that a target derives from it.

## Implementation Notes

A declaration takes its types, the arguments of its type constructors, and its schemas as
parameters, so the reading of the theory holds its trees in the same form and the translation of
a declaration maps its trees one by one.

A function holds its signature alone and no body, as every function of the theory is still
implemented by hand.
-/

public section

namespace Translator.Core

/-- A documentation comment, a paragraph and the addresses that it cites, each once. -/
structure Documentation where
  /-- The paragraph of the comment. -/
  text : String
  /-- The addresses that the comment cites. -/
  addresses : List String
  deriving Repr, DecidableEq

/-- The kind of a type parameter: a type, a functor on types, or a type constructor. -/
inductive ParameterKind where
  /-- A type. -/
  | type
  /-- A functor on types. -/
  | functor
  /-- A type constructor, a function from types to types. -/
  | constructor
  deriving Repr, DecidableEq

/-- A type parameter of a declaration by its name, its kind, and its default value, an argument,
where it takes one. -/
structure TypeParameter (κ : Type) where
  /-- The name of the parameter. -/
  name : String
  /-- The kind of the parameter. -/
  kind : ParameterKind
  /-- The default value of the parameter. -/
  default : Option κ
  deriving Repr, BEq

/-- A field of a structure by its name, its documentation, and its type or its schema. -/
structure Field (τ : Type) where
  /-- The name of the field. -/
  name : String
  /-- The documentation of the field. -/
  documentation : Documentation
  /-- The type or the schema of the field. -/
  type : τ
  deriving Repr, BEq

/-- A value of the theory as the kernel of Lean reduces it. -/
inductive Value where
  /-- A rational number by its numerator and its positive denominator. -/
  | rational (numerator : Int) (denominator : Nat)
  /-- A structure of the module being written by its declaration and the value of every field,
  each with the name of its field. -/
  | structure (declaration : Reference) (fields : List (String × Value))
  /-- A pair of two values. -/
  | pair (first second : Value)
  deriving Repr, BEq

/-- A morphism of the category of types in a law of a class of functors. -/
inductive Morphism (τ : Type) where
  /-- A morphism that is a parameter of the law, by its name. -/
  | parameter (name : String)
  /-- The identity of a type. -/
  | identity (type : τ)
  /-- The composite of two morphisms, the first applied first. -/
  | compose (first second : Morphism τ)
  /-- The action of the functor of the law on a morphism, with its domain and its codomain. -/
  | map (domain codomain : τ) (morphism : Morphism τ)
  deriving Repr, BEq

/-- A law of a class of functors, an equality of two morphisms at every value of their domain. -/
structure Law (τ : Type) where
  /-- The name of the field of the class that states the law. -/
  name : String
  /-- The documentation of the law. -/
  documentation : Documentation
  /-- The type variables of the law. -/
  typeParameters : List String
  /-- Every other variable of the law by its name and its type. -/
  parameters : List (String × τ)
  /-- The domain of the two morphisms. -/
  domain : τ
  /-- The object of the functor at which the law compares two values, where the codomain is the
  object of the functor that is a parameter. -/
  equivalence : Option τ
  /-- The left morphism of the equality. -/
  left : Morphism τ
  /-- The right morphism of the equality. -/
  right : Morphism τ
  deriving Repr, BEq

/-- The structure that the object of a curried functor gives, whose fields the declaration of the
functor names, by the name that the declaration gives it, its documentation, a type parameter for
every argument of the structure, its fields, each by its name, its documentation, and the type
parameter of its type, and the arguments of the structure at the object. -/
structure Record (τ : Type) where
  /-- The name of the structure. -/
  name : String
  /-- The documentation of the structure. -/
  documentation : Documentation
  /-- The type parameter of every argument of the structure. -/
  parameters : List String
  /-- Every field by its name, its documentation, and the type parameter of its type. -/
  fields : List (String × Documentation × String)
  /-- The arguments of the structure at the object of the curried functor. -/
  arguments : List τ
  deriving Repr, BEq

/-- A declaration of the core, with its types, the arguments of its type constructors, and its
schemas. -/
inductive Declaration (τ κ σ : Type) where
  /-- A structure of data, with the documentation of its schema and of its constructor, and the
  schema of every field. -/
  | data (reference : Reference) (documentation schema constructor : Documentation)
      (fields : List (Field σ))
  /-- A refinement of a schema by a condition, with the documentation of its schema. -/
  | refinement (reference : Reference) (documentation schema : Documentation) (base : σ)
      (condition : Reference)
  /-- A structure with type parameters or a field of a type other than data, with the
  documentation of its constructor. -/
  | structure (reference : Reference) (documentation constructor : Documentation)
      (typeParameters : List (TypeParameter κ)) (fields : List (Field τ))
  /-- A bundled structure, with the documentation of its constructor, its type parameters in the
  order of a target, the declaration that labels its structure at its functors, where a target
  names them, and its fields. -/
  | bundle (reference : Reference) (documentation constructor : Documentation)
      (typeParameters : List (TypeParameter κ)) (extended : Option τ) (fields : List (Field τ))
  /-- A functor on types or a type constructor, as a type lambda by its object. -/
  | lambda (reference : Reference) (documentation : Documentation)
      (typeParameters : List (TypeParameter κ)) (object : τ)
  /-- A curried functor, as a type lambda with a type parameter for the type it maps, by its
  object and the structure that the object gives, where its declaration names its fields. -/
  | curried (reference : Reference) (documentation : Documentation)
      (typeParameters : List (TypeParameter κ)) (parameter : String) (object : τ)
      (record : Option (Record τ))
  /-- A class of functors, with the documentation of its constructor and of the predicates of its
  axioms, the name of its functor, its fields, and its laws. -/
  | functorClass (reference : Reference) (documentation constructor axioms : Documentation)
      (functor : String) (fields : List (Field τ)) (laws : List (Law τ))
  /-- A type alias. -/
  | alias (reference : Reference) (documentation : Documentation)
      (typeParameters : List (TypeParameter κ)) (type : τ)
  /-- A function by its type parameters, those of its bundled parameters after them, and its
  signature. -/
  | function (reference : Reference) (documentation : Documentation)
      (typeParameters bundledParameters : List String) (signature : τ)
  /-- A value by its type and its value. -/
  | value (reference : Reference) (documentation : Documentation) (type : τ) (value : Value)
  /-- The instance of the class of functors that a functor, a curried functor, or a type
  constructor takes, by the type parameters of the instance. -/
  | «instance» (reference : Reference) (documentation : Documentation)
      (typeParameters : List (TypeParameter κ))
  deriving Repr, BEq

/-- A module of the core, the declarations of a module of the theory in the order of their lines,
with the class of functors that the theory gives a counterpart, where it gives one. -/
structure Module (τ κ σ : Type) where
  /-- The module of the theory. -/
  module : Lean.Name
  /-- The declarations of the module. -/
  declarations : List (Declaration τ κ σ)
  /-- The class of functors. -/
  functorClass : Option Reference
  deriving Repr, BEq

end Translator.Core
