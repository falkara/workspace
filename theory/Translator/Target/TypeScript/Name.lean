/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Mathlib.Init -- shake: keep

/-!
# Name

The module defines the names of TypeScript: the words of a name joined in Pascal case for a type
and in camel case for a value, and the reserved words of JavaScript, which no binding takes as its
name.
-/

public section

namespace Translator.TypeScript

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

end Translator.TypeScript
