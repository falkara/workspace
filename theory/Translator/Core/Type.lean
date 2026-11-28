/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Core.Reference

/-!
# Type

The module defines the types of the core of the translator, which neither the theory nor a target
dictates: the primitive types, the type parameters, the object of a type lambda, options, arrays,
streams, sequences, products, sums, effects, objects of type constructors, declarations of the
theory with their arguments, and functions, with the type constructors and the arguments they take,
and the schemas of the types of data.

## Implementation Notes

A product holds an optional presentation, the declaration of the functor whose object the product
is, where that declaration names the fields of the product, as a product that a functor gives and
any other product are one type in Lean but take two forms in a target.

An infinite stream and a sequence, which may end, are types of their own, so a target tells them
apart even where it writes both alike.

A declaration of the theory carries, for every argument, the polarities at which the declaration
takes it, which the reading of the theory gives from the definition of the declaration, so a
target annotates the variance of a type parameter from the types of its own declaration alone.

The types, the type constructors, and the arguments derive `BEq` in place of `DecidableEq`, as Lean
derives no decidable equality for an inductive type nested in a list.
-/

public section

namespace Translator.Core

mutual

/-- A type of the core. -/
inductive TypeTerm where
  /-- The rational numbers. -/
  | rational
  /-- The strings. -/
  | string
  /-- The booleans. -/
  | boolean
  /-- The type of one value. -/
  | unit
  /-- A type parameter by its name. -/
  | parameter (name : String)
  /-- The object of a type lambda, the type it maps. -/
  | target
  /-- The options of a type. -/
  | option (element : TypeTerm)
  /-- The finite arrays of a type. -/
  | array (element : TypeTerm)
  /-- The infinite streams of a type. -/
  | stream (element : TypeTerm)
  /-- The sequences of a type, streams that may end. -/
  | sequence (element : TypeTerm)
  /-- A product by its fields, presented as the declaration of its functor names it where it has a
  presentation. -/
  | product (presentation : Option Reference) (fields : List NamedType)
  /-- A binary sum, whose right summand is the one a computation goes on with. -/
  | sum (left right : TypeTerm)
  /-- A computation that reads requirements and either fails or succeeds. -/
  | effect (success failure requirements : TypeTerm)
  /-- The object of a type constructor at a type. -/
  | apply (constructor : Constructor) (argument : TypeTerm)
  /-- A declaration of the theory with its arguments, each with the polarities at which the
  declaration takes it. -/
  | named (reference : Reference) (arguments : List Argument) (variances : List (List Bool))
  /-- A function by its type parameters, its parameters, and its result. -/
  | function (typeParameters : List String) (parameters : List NamedType) (result : TypeTerm)

/-- A type constructor of the core. -/
inductive Constructor where
  /-- A type constructor that is a parameter, by its name. -/
  | parameter (name : String)
  /-- The identity, by the declaration that labels the identity functor. -/
  | identity (label : Reference)
  /-- The options. -/
  | option
  /-- A declaration of the theory with its arguments, each with the polarities at which the
  declaration takes it. -/
  | named (reference : Reference) (arguments : List Argument) (variances : List (List Bool))

/-- An argument of a declaration, a type or a type constructor. -/
inductive Argument where
  /-- A type. -/
  | type (type : TypeTerm)
  /-- A type constructor. -/
  | constructor (constructor : Constructor)

/-- A type with a name, a field of a product or a parameter of a function. -/
inductive NamedType where
  /-- A type by its name. -/
  | mk (name : String) (type : TypeTerm)

end

deriving instance Repr, BEq for TypeTerm, Constructor, Argument, NamedType

/-- The schema of a type of data, which decodes a value of the type. -/
inductive Schema where
  /-- The schema of the rational numbers. -/
  | rational
  /-- The schema of the strings. -/
  | string
  /-- The schema of the booleans. -/
  | boolean
  /-- The schema of the options of a type. -/
  | option (element : Schema)
  /-- The schema of the finite arrays of a type. -/
  | array (element : Schema)
  /-- The schema of a declaration of the theory. -/
  | named (reference : Reference)
  deriving Repr, DecidableEq

end Translator.Core
