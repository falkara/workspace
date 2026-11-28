/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Target.Effect.Type

/-!
# Schema

The module defines the schema of Effect that a schema of the core takes: `Schema.Rational`,
`Schema.String`, and `Schema.Boolean` for the rational numbers, the strings, and the booleans,
`Schema.Option` and `Schema.Array` applied to the schema of the element for the options and the
arrays, and the name of a declaration for the schema that the declaration defines.
-/

public section

namespace Translator.Effect

/-- Gives the expression of TypeScript that writes the schema of Effect that a schema of the core
takes in a file of a module of the theory. -/
def lowerSchema (context : Context) : Core.Schema → TypeScript.Expression
  | .rational => .symbol (.effect "Schema" "Rational")
  | .string => .symbol (.effect "Schema" "String")
  | .boolean => .symbol (.effect "Schema" "Boolean")
  | .option element => .call (.symbol (.effect "Schema" "Option")) [lowerSchema context element]
  | .array element => .call (.symbol (.effect "Schema" "Array")) [lowerSchema context element]
  | .named reference =>
    match nameOf context reference with
    | .identifier name => .identifier name
    | .qualified qualifier name => .member (.identifier qualifier) name
    | .symbol symbol => .symbol symbol

end Translator.Effect
