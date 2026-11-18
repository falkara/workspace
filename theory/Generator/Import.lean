/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Lean.Meta.Basic

/-!
# Import

The module defines the modules of Effect that a file of TypeScript imports. Every function that
writes TypeScript records the module of Effect whose name it writes, as a value, such as `Rational`
for `Rational.fromBigInt(1n)`, or as a type alone, such as `Rational` for `Rational.Rational`, and
the file imports every module that its functions record, as a value where one of them names the
module as a value.

## Main Definitions

- `Usage`: a way that a file of TypeScript names a module of Effect.
- `TypeScriptM`: a computation that writes TypeScript and records the modules of Effect whose names
  it writes.
- `effectNameOf`: gives the name of a member of a module of Effect, such as `Rational.fromBigInt`,
  and records the module with the way the name uses it.
- `effectImportsOf`: gives the modules of Effect that a file imports from what its computations
  record, sorted by name, each as a value where one of them names the module as a value.

## Implementation Notes

A module of Effect is recorded where the generator writes its name rather than found in the
written text, so a comment or a declaration of the theory whose text holds the name of a module
imports no module. The name and its record come from one function, so the generator writes no name
of Effect that the file leaves unimported.
-/

public section

namespace Generator

/-- A way that a file of TypeScript names a module of Effect. -/
inductive Usage where
  /-- A name of a value of the module, such as `Rational.fromBigInt`. -/
  | value
  /-- A name of a type of the module alone, such as `Rational.Rational`. -/
  | type
  deriving BEq

/-- A computation that writes TypeScript and records the modules of Effect whose names it
writes. -/
abbrev TypeScriptM := StateRefT (List (String × Usage)) Lean.MetaM

/-- Gives the name of a member of a module of Effect, such as `Rational.fromBigInt`, and records the
module with the way the name uses it. -/
def effectNameOf (module member : String) (usage : Usage) : TypeScriptM String := do
  modify (· ++ [(module, usage)])
  return s!"{module}.{member}"

/-- Gives the modules of Effect that a file imports from what its computations record, sorted by
name, each as a value where one of them names the module as a value. -/
def effectImportsOf (records : List (String × Usage)) : List (String × Usage) :=
  ((records.map Prod.fst).eraseDups.mergeSort fun first second ↦ decide (first ≤ second)).map
    fun module ↦ (module, if records.contains (module, .value) then .value else .type)

end Generator
