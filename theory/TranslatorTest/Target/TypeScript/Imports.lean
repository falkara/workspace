module

meta import Translator.Target.TypeScript.Imports
meta import Translator.Target.TypeScript.Print

/-!
# Imports

The module defines the checks of the modules of Effect that a file imports: a symbol in an
expression names its module as a value and a symbol among the type arguments, the parameters, or
the result of an expression as a type alone, every symbol of an interface names its module as a
type alone, a module names its symbols in the order of its statements, a file imports every module
once, sorted by name, as a value where one symbol names it as a value, and a syntax without symbols
imports nothing. The checks compare as well the imports of a file: the modules of Effect by name,
and the modules of the package sorted by their paths, a module of the theory as a namespace, as a
value where one symbol names it as a value, a module of checks by the names of its conditions, each
once, and the module of the package as the namespace `Module`, as a type alone.

## Implementation Notes

The checks compare the symbols and the modules with their expected values by `#guard_msgs` on
`#eval`, as `#guard` emits no message on success, which the linter `linter.hashCommand` of Mathlib
refuses.
-/

open Translator.TypeScript

/--
info: [(Translator.TypeScript.Symbol.effect "Brand" "nominal", Translator.TypeScript.Usage.value),
 (Translator.TypeScript.Symbol.effect "Option" "Option", Translator.TypeScript.Usage.type),
 (Translator.TypeScript.Symbol.effect "Rational" "Rational", Translator.TypeScript.Usage.type),
 (Translator.TypeScript.Symbol.effect "Equal" "equals", Translator.TypeScript.Usage.value)]
-/
#guard_msgs in
#eval Expression.symbols
  (.call
    (.instantiation (.symbol (.effect "Brand" "nominal"))
      [.reference (.symbol (.effect "Option" "Option")) [.reference (.identifier "Point") []]])
    [.arrow []
      [.mk (.identifier "value") (some (.reference (.symbol (.effect "Rational" "Rational")) []))]
      .inline none
      (.expression (.call (.symbol (.effect "Equal" "equals"))
        [.identifier "value", .identifier "value"]))])

/--
info: [(Translator.TypeScript.Symbol.effect "HKT" "TypeLambda", Translator.TypeScript.Usage.type),
 (Translator.TypeScript.Symbol.effect "HKT" "TypeClass", Translator.TypeScript.Usage.type),
 (Translator.TypeScript.Symbol.effect "Rational" "Rational", Translator.TypeScript.Usage.type)]
-/
#guard_msgs in
#eval Statement.symbols
  (.interface none true "Functor"
    [.mk .invariant "Endofunctor" (some (.reference (.symbol (.effect "HKT" "TypeLambda")) []))
      none]
    (some (.reference (.symbol (.effect "HKT" "TypeClass"))
      [.reference (.identifier "Endofunctor") []]))
    [.property none "scale" (.reference (.symbol (.effect "Rational" "Rational")) [])])

/--
info: [("Brand", Translator.TypeScript.Usage.value),
 ("Option", Translator.TypeScript.Usage.type),
 ("Schema", Translator.TypeScript.Usage.value)]
-/
#guard_msgs in
#eval effectImportsOf (Module.symbols {
  header := "A module of a point."
  imports := []
  statements := [
    .typeAlias none true "PointAt" []
      (.function [] [.mk (.identifier "coordinate") (some (.reference (.identifier "Point") []))]
        (.reference (.symbol (.effect "Option" "Option")) [.reference (.identifier "Point") []])),
    .constant none true "Point" none
      (.call (.symbol (.effect "Schema" "Struct"))
        [.object [.mk none "first" (.symbol (.effect "Schema" "Rational"))]]),
    .constant none true "make" none
      (.call
        (.instantiation (.symbol (.effect "Brand" "nominal")) [.reference (.identifier "Point") []])
        []),
    .typeAlias none true "Points" []
      (.reference (.symbol (.effect "Option" "Option")) [.reference (.identifier "Point") []])] })

/-- info: [("Rational", Translator.TypeScript.Usage.value)] -/
#guard_msgs in
#eval effectImportsOf [(.effect "Rational" "Rational", .type), (.effect "Rational" "sum", .value),
  (.effect "Rational" "Rational", .type)]

/-- info: [] -/
#guard_msgs in
#eval effectImportsOf (Expression.symbols
  (.call (.member (.identifier "Point") "pointAt") [.literal (.string "origin")]))

/--
info: import { Brand, type Option } from 'effect';

import * as Coordinate from '#src/Fixture/Coordinate.theory';
import { isFilename, isPath } from '#src/Fixture/Filename.check';
import type * as Module from '#src/Fixture/Point';
import type * as Walker from '#src/Fixture/Walker.theory';
-/
#guard_msgs in
#eval IO.print ("\n".intercalate ((importsOf
  [(.effect "Option" "Option", .type), (.theory "Walker" "Fixture/Walker" "Walker", .type),
    (.module "Fixture/Point", .type), (.effect "Brand" "nominal", .value),
    (.check "Fixture/Filename" "isFilename", .value),
    (.theory "Coordinate" "Fixture/Coordinate" "Coordinate", .type),
    (.check "Fixture/Filename" "isPath", .value),
    (.theory "Coordinate" "Fixture/Coordinate" "Coordinate", .value),
    (.check "Fixture/Filename" "isFilename", .value)]).map
  fun group ↦ String.join (group.map Import.print)))

/-- info: [[], []] -/
#guard_msgs in
#eval importsOf []
