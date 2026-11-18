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
name after the namespace of its package, such as `Machine` and `Outcome` for `Machine.Outcome`,
joined in Pascal case, such as `MachineOutcome`, for a type or a schema, and in camel case, such as
`machineOutcome`, for a value, a function, or a constructor.

## Main Definitions

- `wordsOf`: gives the words of the name of a declaration after the namespace of its package.
- `pascalCaseOf`: gives the words joined in Pascal case, each capitalized.
- `camelCaseOf`: gives the words joined in camel case, the first opening with a lowercase letter
  and every other capitalized.

## Implementation Notes

The words of a name are told apart from the theory alone, and the case joins them by the
conventions of TypeScript, so a language with other conventions takes the same words.
-/

public section

namespace Generator

/-- Gives the words of the name of a declaration after the namespace of its package. -/
def wordsOf (packageNamespace name : Lean.Name) : List String :=
  (name.replacePrefix packageNamespace .anonymous).components.map (·.toString)

/-- Gives the words joined in Pascal case, each capitalized. -/
def pascalCaseOf (words : List String) : String :=
  String.join (words.map String.capitalize)

/-- Gives the words joined in camel case, the first opening with a lowercase letter and every other
capitalized. -/
def camelCaseOf (words : List String) : String :=
  (pascalCaseOf words).decapitalize

end Generator
