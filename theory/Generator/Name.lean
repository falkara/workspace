/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Mathlib.Init -- shake: keep
import Lean.Data.Name

/-!
# Name

The module defines the name that a declaration of the theory takes in TypeScript: the words of its
name after the namespace of its package and the name of its module, such as `behavior` for
`StreamCoalgebra.behavior` in the module `StreamCoalgebra`, joined in Pascal case for a type or a
schema and in camel case for a value, a function, or a constructor, as a module of TypeScript is
imported as a namespace, as Effect imports `Option` and calls `Option.some`.

## Main Definitions

- `wordsOf`: gives the words of the name of a declaration after the namespace of its package.
- `localWordsOf`: gives the words of the name of a declaration after the namespace of its package
  and the name of its module.
- `reservedWords`: the reserved words of JavaScript, which no binding takes as its name.
- `pascalCaseOf`: gives the words joined in Pascal case, each capitalized.
- `camelCaseOf`: gives the words joined in camel case, the first opening with a lowercase letter
  and every other capitalized.

## Implementation Notes

The words of a name are told apart from the theory alone, and the case joins them by the
conventions of TypeScript, so a language with other conventions takes the same words.

A declaration that takes the name of its module, such as the structure `StreamCoalgebra` in the
module `StreamCoalgebra`, keeps its name as a type, as `Option.Option` of Effect does.
-/

public section

namespace Generator

/-- Gives the words of the name of a declaration after the namespace of its package. -/
def wordsOf (packageNamespace name : Lean.Name) : List String :=
  (name.replacePrefix packageNamespace .anonymous).components.map (·.toString)

/-- Gives the words of the name of a declaration after the namespace of its package and the name of
its module, such as `behavior` for `StreamCoalgebra.behavior` in the module `StreamCoalgebra`, and
none where the declaration takes the name of its module, such as `StreamCoalgebra` itself. -/
def localWordsOf (packageNamespace module name : Lean.Name) : List String :=
  match wordsOf packageNamespace name, module with
  | first :: rest, .str _ last => if first.toLower == last.toLower then rest else first :: rest
  | words, _ => words

/-- The reserved words of JavaScript, which no binding takes as its name. -/
def reservedWords : List String :=
  ["await", "break", "case", "catch", "class", "const", "continue", "debugger", "default",
    "delete", "do", "else", "enum", "export", "extends", "false", "finally", "for", "function",
    "if", "implements", "import", "in", "instanceof", "interface", "let", "new", "null",
    "package", "private", "protected", "public", "return", "static", "super", "switch", "this",
    "throw", "true", "try", "typeof", "var", "void", "while", "with", "yield"]

/-- Gives the words joined in Pascal case, each capitalized. -/
def pascalCaseOf (words : List String) : String :=
  String.join (words.map String.capitalize)

/-- Gives the words joined in camel case, the first opening with a lowercase letter and every other
capitalized. -/
def camelCaseOf (words : List String) : String :=
  (pascalCaseOf words).decapitalize

end Generator
