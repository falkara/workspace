module

meta import Falkara.ExportTypeScript
meta import Generator.Type
meta import Lean.Elab.Term

/-!
# Type

The module defines the checks of the types of TypeScript that the types of the theory take: a
rational number, an option, an array, a list, a function type, a declaration marked
`export_typescript`, and a structure with type parameters applied to its arguments take their
types, while a declaration without the mark, a type of any other form, such as a product, and a
function type with an unnamed parameter take none. The checks compare as well the schemas of Effect
that the types of data take: a rational number, an option, an array, a list, and a structure marked
`export_typescript` take their schemas, while a function type, a structure with type parameters,
and a type of any other form take none. The checks compare as well the variance of the type
parameters of a structure, a parameter that a field gives and a function takes occurring at both
polarities and one that a function gives at the positive polarity alone.

## Main Definitions

- `MarkedStructure`: the structure that the checks mark `export_typescript`.
- `UnmarkedStructure`: the structure that the checks leave unmarked.
- `namedFunction`: the function whose type the checks write with a named parameter.
- `unnamedFunction`: the function whose type the checks refuse, as the type leaves its parameter
  unnamed.
- `Pair`: the structure with type parameters that the checks write, a first value and the function
  that gives a second value from it.
-/

public section

/-- The structure that the checks mark `export_typescript`. -/
structure MarkedStructure where
  /-- The value of the structure. -/
  value : Rat

attribute [export_typescript] MarkedStructure

/-- The structure that the checks leave unmarked. -/
structure UnmarkedStructure where
  /-- The value of the structure. -/
  value : Rat

/-- info: "Rational.Rational" -/
#guard_msgs in
#eval (Generator.typeOf .anonymous (Lean.mkConst ``Rat)).run' []

/-- info: "ReadonlyArray<Rational.Rational>" -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  (Generator.typeOf .anonymous (← Lean.Elab.Term.elabType (← `(List Rat)))).run' []

/-- The function whose type the checks write with a named parameter. -/
@[nolint unusedArguments]
def namedFunction : (wavelength : Rat) → Option (Array MarkedStructure) :=
  fun _ ↦ none

/-- The function whose type the checks refuse, as the type leaves its parameter unnamed. -/
def unnamedFunction : Rat → Rat :=
  fun wavelength ↦ wavelength

/-- info: "(wavelength: Rational.Rational) => Option.Option<ReadonlyArray<MarkedStructure>>" -/
#guard_msgs in
#eval show Lean.MetaM String from do
  (Generator.typeOf .anonymous (← Lean.getConstInfo ``namedFunction).type).run' []

/-- error: `UnmarkedStructure` has no declaration in TypeScript, as the theory never marks it `export_typescript`. -/
#guard_msgs in
#eval (Generator.typeOf .anonymous (Lean.mkConst ``UnmarkedStructure)).run' []

/-- error: `Nat` has no declaration in TypeScript, as the theory never marks it `export_typescript`. -/
#guard_msgs in
#eval (Generator.typeOf .anonymous (Lean.mkConst ``Nat)).run' []

/-- error: `Prod` has no declaration in TypeScript, as the theory never marks it `export_typescript`. -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  (Generator.typeOf .anonymous (← Lean.Elab.Term.elabType (← `(Rat × Rat)))).run' []

/-- error: `Rat → Rat` has no type in TypeScript, as TypeScript names every parameter and the theory names none. -/
#guard_msgs in
#eval show Lean.MetaM String from do
  (Generator.typeOf .anonymous (← Lean.getConstInfo ``unnamedFunction).type).run' []

/-- info: "Schema.Option(Schema.Array(MarkedStructure))" -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  (Generator.schemaOf .anonymous
    (← Lean.Elab.Term.elabType (← `(Option (Array MarkedStructure))))).run' []

/-- info: "Schema.Array(Schema.Rational)" -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  (Generator.schemaOf .anonymous (← Lean.Elab.Term.elabType (← `(List Rat)))).run' []

/-- error: `UnmarkedStructure` has no declaration in TypeScript, as the theory never marks it `export_typescript`. -/
#guard_msgs in
#eval (Generator.schemaOf .anonymous (Lean.mkConst ``UnmarkedStructure)).run' []

/-- error: `Rat × Rat` has no schema in TypeScript. -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  (Generator.schemaOf .anonymous (← Lean.Elab.Term.elabType (← `(Rat × Rat)))).run' []

/-- error: `Rat → Rat` has no schema in TypeScript, as a schema describes data and the type is a function. -/
#guard_msgs in
#eval show Lean.MetaM String from do
  (Generator.schemaOf .anonymous (← Lean.getConstInfo ``unnamedFunction).type).run' []

/-- The structure with type parameters that the checks write, a first value and the function that
gives a second value from it. -/
structure Pair (First Second : Type) where
  /-- The first value of the pair. -/
  first : First
  /-- The function that gives the second value from the first. -/
  second : (first : First) → Second

attribute [export_typescript] Pair

/-- info: "Pair<Rational.Rational, ReadonlyArray<Rational.Rational>>" -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  (Generator.typeOf .anonymous (← Lean.Elab.Term.elabType (← `(Pair Rat (List Rat))))).run' []

/-- error: `Pair` has no schema in TypeScript, as it is neither a structure whose every field takes a schema nor a refinement. -/
#guard_msgs in
#eval (Generator.schemaOf .anonymous (Lean.mkConst ``Pair)).run' []

/-- info: [[true, false], [true]] -/
#guard_msgs in
#eval Generator.variancesOf ``Pair
