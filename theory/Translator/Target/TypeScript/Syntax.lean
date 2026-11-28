/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Mathlib.Init -- shake: keep

/-!
# Syntax

The module defines the syntax of the TypeScript that the translator writes: the documentation
comments, the names that a file takes from a module of Effect, the types, the expressions, the
statements, the imports, and the modules, as data that `Print` writes as text and `Imports` folds
into the modules that a file imports.

## Implementation Notes

The syntax holds the TypeScript that the translator writes rather than the whole of TypeScript, so
every property and every tuple is read-only, an interface extends at most one interface, and a
statement returns early only with nothing, as a test skips the values that break a hypothesis.

A name of Effect is a symbol of its own rather than a name in the text, so the imports of a file
follow from its syntax, and a symbol in a type names the module as a type alone, while a symbol in
an expression names it as a value.

Parentheses are a node of their own, as the syntax tree of TypeScript keeps them, so the text holds
parentheses exactly where the syntax does and no precedence decides them.

A list of parameters takes the layout that its node gives, on one line or on a line for every
parameter, as nothing else in the syntax tells the two apart.

The types, expressions, and statements, which hold lists of themselves, derive `BEq` in place of
`DecidableEq`, as Lean derives no decidable equality for an inductive type nested in a list, and
the checks compare them by `==` alone.
-/

public section

namespace Translator.TypeScript

/-- A documentation comment, a paragraph followed by a tag `@see` for every address it cites. -/
structure Documentation where
  /-- The paragraph of the comment. -/
  text : String
  /-- The addresses that the tags `@see` cite, each once. -/
  addresses : List String
  deriving Repr, DecidableEq

/-- A name that a file takes from a module it imports. -/
inductive Symbol where
  /-- A member of a module of Effect, such as `fromBigInt` of `Rational`, which the package
  `effect` exports by the name of the module. -/
  | effect (module member : String)
  /-- A member of a module of the theory, such as `Comp` of `Functor`, which the file imports as a
  namespace from the generated module of its path. -/
  | theory (qualifier path member : String)
  /-- A condition of a refinement, which the file imports by its name from the module of checks
  of its path. -/
  | check (path member : String)
  /-- The module of the package of a path, which the file imports as the namespace `Module`. -/
  | module (path : String)
  /-- A member of a module of the package, such as `make` of `Point`, which a file of tests imports
  as a namespace from the module of its path. -/
  | package (qualifier path member : String)
  deriving Repr, DecidableEq

/-- A literal of a value, which a type names as well. -/
inductive Literal where
  /-- A string, written between single quotes. -/
  | string (value : String)
  /-- A natural number. -/
  | number (value : Nat)
  /-- An integer of arbitrary size, written with the suffix `n`. -/
  | bigInt (value : Int)
  deriving Repr, DecidableEq

/-- A type that a keyword names. -/
inductive Keyword where
  /-- The type of strings. -/
  | string
  /-- The type of booleans. -/
  | boolean
  /-- The type of no value of interest. -/
  | void
  /-- The type of no value at all. -/
  | never
  deriving Repr, DecidableEq

/-- The variance that a type parameter declares with the modifiers `in` and `out`. -/
inductive Variance where
  /-- No modifier, so TypeScript infers the variance. -/
  | inferred
  /-- The modifier `in`. -/
  | contravariant
  /-- The modifier `out`. -/
  | covariant
  /-- The modifiers `in out`. -/
  | invariant
  deriving Repr, DecidableEq

/-- The layout of a list of parameters. -/
inductive Layout where
  /-- Every parameter on the line of the list. -/
  | inline
  /-- Every parameter on a line of its own, followed by a comma. -/
  | lines
  deriving Repr, DecidableEq

/-- A name that a type refers to. -/
inductive TypeName where
  /-- A name alone, such as `State` or `ReadonlyArray`. -/
  | identifier (name : String)
  /-- A name after the namespace or the value that holds it, such as `Functor.Comp`. -/
  | qualified (qualifier name : String)
  /-- A name that a file takes from a module it imports. -/
  | symbol (symbol : Symbol)
  deriving Repr, DecidableEq

/-- A pattern that a parameter binds its value to. -/
inductive Binding where
  /-- A name for the whole value. -/
  | identifier (name : String)
  /-- A name for every property of the value of the same name, such as `{ first, second }`. -/
  | object (names : List String)
  deriving Repr, DecidableEq

mutual

/-- A type. -/
inductive TypeExpression where
  /-- A type that a keyword names. -/
  | keyword (keyword : Keyword)
  /-- The type of one literal. -/
  | literal (literal : Literal)
  /-- A named type with its type arguments, such as `Option.Option<X>`. -/
  | reference (name : TypeName) (arguments : List TypeExpression)
  /-- The type of the object that a member of an interface belongs to. -/
  | this
  /-- The type of a property of a type, such as `this['Target']`. -/
  | indexed (object index : TypeExpression)
  /-- A read-only tuple, such as `readonly [X, Y]`. -/
  | tuple (elements : List TypeExpression)
  /-- A type of objects by its members, such as `{ readonly output: Output }`. -/
  | object (members : List Member)
  /-- A function type, with its type parameters. -/
  | function (typeParameters : List TypeParameter) (parameters : List Parameter)
      (result : TypeExpression)
  /-- A union of types, such as `0 | 1 | 2`. -/
  | union (members : List TypeExpression)
  /-- The type of a value, such as `typeof Point.Type`. -/
  | query (name : TypeName)

/-- A member of an interface or of a type of objects. -/
inductive Member where
  /-- A read-only property with its documentation comment. -/
  | property (documentation : Option Documentation) (name : String) (type : TypeExpression)
  /-- A call signature, with its type parameters. -/
  | call (typeParameters : List TypeParameter) (parameters : List Parameter)
      (result : TypeExpression)

/-- A parameter of a function or of a function type. -/
inductive Parameter where
  /-- A parameter by the pattern it binds and the type it annotates, where it annotates one. -/
  | mk (binding : Binding) (type : Option TypeExpression)

/-- A type parameter. -/
inductive TypeParameter where
  /-- A type parameter by its variance, its name, the type it extends, where it is constrained, and
  its default type, where it takes one. -/
  | mk (variance : Variance) (name : String) (constraint default : Option TypeExpression)

end

deriving instance Repr, BEq for TypeExpression, Member, Parameter, TypeParameter

mutual

/-- An expression. -/
inductive Expression where
  /-- A name alone. -/
  | identifier (name : String)
  /-- A name that a file takes from a module it imports. -/
  | symbol (symbol : Symbol)
  /-- A literal. -/
  | literal (literal : Literal)
  /-- A property of a value, such as `instance.map`. -/
  | member (object : Expression) (name : String)
  /-- An element of a value by its index, such as `table[state]`. -/
  | element (object index : Expression)
  /-- A call of a function. -/
  | call (callee : Expression) (arguments : List Expression)
  /-- A generic function at type arguments, such as `Function.identity<X>`. -/
  | instantiation (expression : Expression) (typeArguments : List TypeExpression)
  /-- An arrow function, with its type parameters, its parameters in their layout, and the type of
  its result, where it annotates one. -/
  | arrow (typeParameters : List TypeParameter) (parameters : List Parameter) (layout : Layout)
      (result : Option TypeExpression) (body : Body)
  /-- An object by its properties. -/
  | object (properties : List Property)
  /-- An array by its elements. -/
  | array (elements : List Expression)
  /-- The negation of a boolean. -/
  | not (operand : Expression)
  /-- An expression between parentheses. -/
  | parenthesized (expression : Expression)

/-- A property of an object. -/
inductive Property where
  /-- A property by its documentation comment, its name, and its value. -/
  | mk (documentation : Option Documentation) (name : String) (value : Expression)

/-- The body of an arrow function. -/
inductive Body where
  /-- An expression, which the function gives. -/
  | expression (expression : Expression)
  /-- A block of statements. -/
  | block (statements : List Statement)

/-- A statement. -/
inductive Statement where
  /-- A constant, exported or not, with its documentation comment and the type it annotates,
  where it annotates one. -/
  | constant (documentation : Option Documentation) (exported : Bool) (name : String)
      (type : Option TypeExpression) (value : Expression)
  /-- A type alias, exported or not, with its documentation comment and its type parameters. -/
  | typeAlias (documentation : Option Documentation) (exported : Bool) (name : String)
      (typeParameters : List TypeParameter) (type : TypeExpression)
  /-- An interface, exported or not, with its documentation comment, its type parameters, the
  interface it extends, where it extends one, and its members. -/
  | interface (documentation : Option Documentation) (exported : Bool) (name : String)
      (typeParameters : List TypeParameter) (extended : Option TypeExpression)
      (members : List Member)
  /-- An expression, with its documentation comment. -/
  | expression (documentation : Option Documentation) (expression : Expression)
  /-- A return with nothing where a condition holds, `if (condition) { return; }`. -/
  | returnIf (condition : Expression)

end

deriving instance Repr, BEq for Expression, Property, Body, Statement

/-- A name that an import takes from a module, as a type alone or not. -/
structure ImportName where
  /-- Whether the import takes the name as a type alone. -/
  typeOnly : Bool
  /-- The name. -/
  name : String
  deriving Repr, DecidableEq

/-- An import of a module. -/
inductive Import where
  /-- An import of names that a module exports, as types alone or not, such as
  `import { Brand, type Option } from 'effect';`. -/
  | named (typeOnly : Bool) (names : List ImportName) (specifier : String)
  /-- An import of a whole module under a namespace, as a type alone or not, such as
  `import type * as Functor from '#src/Functor.theory';`. -/
  | namespaced (typeOnly : Bool) (name specifier : String)
  deriving Repr, DecidableEq

/-- A module, a file of TypeScript. -/
structure Module where
  /-- The text of the comment that opens the file. -/
  header : String
  /-- The imports of the file in groups, each group apart from the next. -/
  imports : List (List Import)
  /-- The statements of the file. -/
  statements : List Statement
  deriving Repr, BEq

end Translator.TypeScript
