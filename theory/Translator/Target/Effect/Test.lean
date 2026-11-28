/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Core.Specification
public import Translator.Target.Effect.Term

import Translator.Target.TypeScript.Imports

/-!
# Test

The module defines the test of `@effect/vitest` that a specification of the core takes, and the file
of the tests of a module. A specification with variables takes a property test, which draws every
variable from a schema: the three values `0`, `1`, and `2` by `Schema.Literals`, the type of one
value by `Schema.Void`, a rational number by `Schema.Rational`, a structure of data by its schema,
an option, a tuple, a result, and a record of the schemas of their parts, the table of a function
as a tuple of the schemas of its three values, a stream as an array of the schemas of its elements,
which is not empty where the theorem takes its first element, and a system as the table of its
structure.
A specification without variables takes a test of its values. The test opens with a statement for
every system, which gives the system from its table by the constructor of its kind, skips the values
that break a hypothesis, binds every `have`, and compares the two sides of the conclusion by
`expect(actual).toEqual(expected)`, two streams by a prefix of each that `Stream.take` gives.

## Implementation Notes

A variable that the test draws as data other than its value, the table of a function or a stream,
reads its value from the data: a function as `(output: 0 | 1 | 2) => table[output]` and a stream as
`Stream.fromIterable(inputs)`.

A file of tests imports every module of the package that its tests name in the order of the modules
of the theory, as they import each other, and every module of Effect by name, as a value, as a test
calls every one.
-/

public section

namespace Translator.Effect

mutual

/-- Gives the schema of Effect that a test draws data from. -/
def schemaOf (theory : Lean.Name) : Core.Draw → TypeScript.Expression
  | .values =>
    .call (.symbol (.effect "Schema" "Literals"))
      [.array [.literal (.number 0), .literal (.number 1), .literal (.number 2)]]
  | .unit => .symbol (.effect "Schema" "Void")
  | .rational => .symbol (.effect "Schema" "Rational")
  | .schema reference => .symbol (packageOf theory reference (typeNameOf reference))
  | .option element => .call (.symbol (.effect "Schema" "Option")) [schemaOf theory element]
  | .tuple first second =>
    .call (.symbol (.effect "Schema" "Tuple"))
      [.array [schemaOf theory first, schemaOf theory second]]
  | .result left right =>
    -- A result of Effect succeeds with a value of the right summand.
    .call (.symbol (.effect "Schema" "Result")) [schemaOf theory right, schemaOf theory left]
  | .record fields =>
    .call (.symbol (.effect "Schema" "Struct")) [.object (fieldSchemasOf theory fields)]
  | .table _ result =>
    let schema := schemaOf theory result
    .call (.symbol (.effect "Schema" "Tuple")) [.array [schema, schema, schema]]

/-- Gives the properties of the schema of a record that the schemas of its fields take. -/
def fieldSchemasOf (theory : Lean.Name) : List (String × Core.Draw) → List TypeScript.Property
  | [] => []
  | (name, draw) :: rest => .mk none name (schemaOf theory draw) :: fieldSchemasOf theory rest

end

mutual

/-- Gives the expression that reads a value from an expression of the data that a test draws for
it, where the two differ: a function from the table of its values, and a record from the data of
its fields. -/
def readerOf : Core.Draw → TypeScript.Expression → Option TypeScript.Expression
  | .table parameter result, data =>
    let value := TypeScript.Expression.element data (.identifier parameter)
    some (.arrow []
      [.mk (.identifier parameter)
        (some (.union [.literal (.number 0), .literal (.number 1), .literal (.number 2)]))]
      .inline none (.expression ((readerOf result value).getD value)))
  | .record fields, data =>
    if (Core.Draw.record fields).reads then
      some (.parenthesized (.object (fieldReadersOf fields data)))
    else none
  | _, _ => none

/-- Gives the properties of a record that read its fields from the data of each. -/
def fieldReadersOf : List (String × Core.Draw) → TypeScript.Expression → List TypeScript.Property
  | [], _ => []
  | (name, draw) :: rest, data =>
    let value := TypeScript.Expression.member data name
    .mk none name ((readerOf draw value).getD value) :: fieldReadersOf rest data

end

/-- Gives the test of `@effect/vitest` that a specification takes, with its documentation comment,
or refuses where the rule of a primitive names an argument that an application does not give. -/
def lowerSpecification (theory : Lean.Name) (specification : Core.Specification) :
    Except Refusal TypeScript.Statement := do
  let readers := specification.variables.filterMap fun
    | .value name draw => (readerOf draw (.identifier name)).map (name, ·)
    | .stream name .. =>
      some (name, .call (.symbol (.effect "Stream" "fromIterable")) [.identifier name])
    | .system .. => none
  let context : TermContext := { theory, readers }
  let arbitraries := specification.variables.map fun
    | .value name draw => (name, schemaOf theory draw)
    | .stream name element headed =>
      (name, .call (.symbol (.effect "Schema" (if headed then "NonEmptyArray" else "Array")))
        [schemaOf theory element])
    | .system name _ _ table => (s!"{name}Table", schemaOf theory table)
  -- A system is given from the table of its structure by the constructor of its kind.
  let systems := specification.variables.filterMap fun
    | .system name declaration field table =>
      let data := TypeScript.Expression.identifier s!"{name}Table"
      some (TypeScript.Statement.constant none false name none
        (.call (.symbol (packageOf theory declaration (constructorNameOf declaration)))
          [.object [.mk none field ((readerOf table data).getD data)]]))
    | _ => none
  let conditions ← specification.hypotheses.mapM fun hypothesis ↦ do
    let equals := TypeScript.Expression.call (.symbol (.effect "Equal" "equals"))
      [← lowerTerm context hypothesis.left, ← lowerTerm context hypothesis.right]
    return TypeScript.Statement.returnIf (if hypothesis.equal then .not equals else equals)
  let haves ← specification.haves.mapM fun (name, value) ↦ do
    return TypeScript.Statement.constant none false name none (← lowerTerm context value)
  let left ← lowerTerm context specification.left
  let right ← lowerTerm context specification.right
  let sides : List TypeScript.Statement := match specification.comparison with
    | .values =>
      [.constant none false "actual" none left, .constant none false "expected" none right]
    | .prefix stream infinite =>
      -- A prefix as long as the stream that the test draws, or of 6 elements, which tell apart two
      -- systems of 3 states each.
      let length : TypeScript.Expression := match stream with
        | some stream => .member (.identifier stream) "length"
        | none => .literal (.number 6)
      let collect := fun (side : TypeScript.Expression) ↦
        TypeScript.Expression.call (.symbol (.effect "Effect" "runSync"))
          [.call (.symbol (.effect "Stream" "runCollect"))
            [.call (.symbol (.effect "Stream" "take")) [side, length]]]
      -- An infinite stream never ends, so its prefix has every one of its elements.
      [.constant none false "actual" none (collect left),
          .constant none false "expected" none (collect right)] ++
        if infinite then
          [.expression none (.call (.member (.call (.identifier "expect") [.identifier "actual"])
            "toHaveLength") [length])]
        else []
  let check := TypeScript.Statement.expression none
    (.call (.member (.call (.identifier "expect") [.identifier "actual"]) "toEqual")
      [.identifier "expected"])
  let body := TypeScript.Body.block (systems ++ conditions ++ haves ++ sides ++ [check])
  let test := if arbitraries.isEmpty then
      TypeScript.Expression.call (.identifier "it")
        [.literal (.string specification.name), .arrow [] [] .inline none body]
    else
      .call (.member (.identifier "it") "prop")
        [.literal (.string specification.name),
          .object (arbitraries.map fun (name, schema) ↦ .mk none name schema),
          .arrow [] [.mk (.object (arbitraries.map Prod.fst)) none] .inline none body]
  return .expression (some (documentationOf specification.documentation)) test

/-- Gives the file of the tests of a module of the theory, with its header, the imports that its
tests name, the modules of the package in the order that a rank gives their paths, and a
`describe` of the path of the module. -/
def testModuleOf (header path : String) (rank : String → Nat)
    (tests : List TypeScript.Statement) : TypeScript.Module :=
  let statements := [TypeScript.Statement.expression none
    (.call (.identifier "describe")
      [.literal (.string path), .arrow [] [] .inline none (.block tests)])]
  { header, imports := TypeScript.testImportsOf rank (statements.flatMap (·.symbols)), statements }

end Translator.Effect
