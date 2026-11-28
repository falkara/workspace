/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Core.Specification
public import Translator.Refusal
public import Translator.Target.TypeScript.Syntax

import Translator.Target.Effect.Term
import Translator.Target.TypeScript.Imports

/-!
# Vector

The module defines the test of `@effect/vitest` that a vector of a primitive takes, which checks the
rule of Effect for the primitive: the expression that the rule gives the term of the vector, a
prefix of three elements of it where the vector is a stream or a sequence, equals the value that the
kernel of Lean computes, with the statement that the rule assumes as its comment, and the file of
the tests of every vector.

## Implementation Notes

A vector names no module of the package, so its test reads the same in every package, and every
package takes the file of every vector, as every package computes by the rules of Effect.
-/

public section

namespace Translator.Effect

/-- Gives the test of `@effect/vitest` that a vector takes, or refuses where the rule of a primitive
names an argument that an application does not give. -/
def lowerVector (vector : Core.Vector) : Except Refusal TypeScript.Statement := do
  let actual ← lowerTerm { theory := .anonymous, readers := [] } vector.term
  let (actual, expected) := match vector.expected with
    | .value value => (actual, initializerOf value)
    | .prefix values =>
      (.call (.symbol (.effect "Effect" "runSync"))
          [.call (.symbol (.effect "Stream" "runCollect"))
            [.call (.symbol (.effect "Stream" "take")) [actual, .literal (.number 3)]]],
        .array (values.map initializerOf))
  let statement := match rule vector.primitive with
    | .implemented _ (.assumption statement) => statement
    | _ => vector.primitive.word
  return .expression (some { text := s!"Checks that {statement}.", addresses := [] })
    (.call (.identifier "it")
      [.literal (.string vector.primitive.word),
        .arrow [] [] .inline none (.block
          [.constant none false "actual" none actual, .constant none false "expected" none expected,
            .expression none (.call (.member (.call (.identifier "expect")
              [.identifier "actual"]) "toEqual") [.identifier "expected"])])])

/-- Gives the file of the tests of the vectors, with its header and a `describe` of the
translation. -/
def vectorModuleOf (header : String) (tests : List TypeScript.Statement) : TypeScript.Module :=
  let statements := [TypeScript.Statement.expression none
    (.call (.identifier "describe")
      [.literal (.string "Translation"), .arrow [] [] .inline none (.block tests)])]
  { header, imports := TypeScript.testImportsOf (fun _ ↦ 0) (statements.flatMap (·.symbols)),
    statements }

end Translator.Effect
