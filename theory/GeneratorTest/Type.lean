module

meta import Generator.Type
meta import Lean.Elab.Term
import Batteries.Tactic.Lint.Basic
import Batteries.Tactic.Lint.Misc
import Falkara.Counterpart

/-!
# Type

The module defines the checks of the types of TypeScript that the types of the theory take: a
rational number, an option, an array, a list, an infinite stream and a sequence of Mathlib, both
as a stream of Effect, a product, a function type, with the name Lean gives
a parameter that the source leaves unnamed, a function type with implicit type parameters, a
declaration that the theory gives a counterpart in TypeScript, and a structure with type parameters
applied to its arguments take their types, while a declaration without a counterpart in TypeScript
and a type of any other form, such as a sum, take none. The checks compare as well the schemas of
Effect that the types of data take: a rational number, an option, an array, a list, and a
structure that the theory gives a counterpart in TypeScript take their schemas, while a function
type, a structure with type parameters, and a type of any other form take none. The checks compare
as well the variance of the type parameters of a structure, a parameter that a field gives and a
function takes occurring at both polarities and one that a function gives at the positive polarity
alone.
-/

public section

/-- The structure that the checks give a counterpart in TypeScript. -/
structure MarkedStructure where
  /-- The value of the structure. -/
  value : Rat

attribute [counterpart
  typescript
    r"The structure that the checks give a counterpart in TypeScript."
    (value
      r"The value of the structure.")] MarkedStructure

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

-- The checks import no Mathlib, so they name the stream and the sequence of Mathlib alone.
/-- info: "Stream.Stream<Rational.Rational>" -/
#guard_msgs in
#eval (Generator.typeOf .anonymous
  (Lean.mkApp (Lean.mkConst `Stream' [.zero]) (Lean.mkConst ``Rat))).run' []

/-- info: "Stream.Stream<Rational.Rational>" -/
#guard_msgs in
#eval (Generator.typeOf .anonymous
  (Lean.mkApp (Lean.mkConst `Stream'.Seq [.zero]) (Lean.mkConst ``Rat))).run' []

/-- The function whose type the checks write with a named parameter. -/
@[nolint unusedArguments]
def namedFunction : (wavelength : Rat) → Option (Array MarkedStructure) :=
  fun _ ↦ none

/-- The function whose type leaves its parameter unnamed. -/
def unnamedFunction : Rat → Rat :=
  fun wavelength ↦ wavelength

/-- The function whose type takes implicit type parameters. -/
def genericFunction {X Y : Type} (morphism : X → Y) (value : X) : Y :=
  morphism value

/-- info: "(wavelength: Rational.Rational) => Option.Option<ReadonlyArray<MarkedStructure>>" -/
#guard_msgs in
#eval show Lean.MetaM String from do
  (Generator.typeOf .anonymous (← Lean.getConstInfo ``namedFunction).type).run' []

/-- error: `UnmarkedStructure` has no declaration in TypeScript, as the theory never gives it a counterpart in TypeScript. -/
#guard_msgs in
#eval (Generator.typeOf .anonymous (Lean.mkConst ``UnmarkedStructure)).run' []

/-- error: `Nat` has no declaration in TypeScript, as the theory never gives it a counterpart in TypeScript. -/
#guard_msgs in
#eval (Generator.typeOf .anonymous (Lean.mkConst ``Nat)).run' []

/-- info: "readonly [Rational.Rational, ReadonlyArray<Rational.Rational>]" -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  (Generator.typeOf .anonymous (← Lean.Elab.Term.elabType (← `(Rat × List Rat)))).run' []

/-- error: `P x` has no type in TypeScript. -/
#guard_msgs in
#eval show Lean.MetaM String from do
  Lean.Meta.withLocalDeclD `P
      (Lean.mkForall `value .default (Lean.mkConst ``Rat) (Lean.mkSort Lean.Level.one)) fun family ↦ Lean.Meta.withLocalDeclD `x (Lean.mkConst ``Rat) fun value ↦
      (Generator.typeOf .anonymous (Lean.mkApp family value)).run' []

/-- info: "Result.Result<Rational.Rational, string>" -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  (Generator.typeOf .anonymous (← Lean.Elab.Term.elabType (← `(String ⊕ Rat)))).run' []

/-- info: "(a: Rational.Rational) => Rational.Rational" -/
#guard_msgs in
#eval show Lean.MetaM String from do
  (Generator.typeOf .anonymous (← Lean.getConstInfo ``unnamedFunction).type).run' []

/-- info: "<X, Y>(morphism: (a: X) => Y, value: X) => Y" -/
#guard_msgs in
#eval show Lean.MetaM String from do
  (Generator.typeOf .anonymous (← Lean.getConstInfo ``genericFunction).type).run' []

/-- info: "Schema.Option(Schema.Array(MarkedStructure))" -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  (Generator.schemaOf .anonymous
    (← Lean.Elab.Term.elabType (← `(Option (Array MarkedStructure))))).run' []

/-- info: "Schema.Array(Schema.Rational)" -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  (Generator.schemaOf .anonymous (← Lean.Elab.Term.elabType (← `(List Rat)))).run' []

/-- error: `UnmarkedStructure` has no declaration in TypeScript, as the theory never gives it a counterpart in TypeScript. -/
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

attribute [counterpart
  typescript
    r"The structure with type parameters that the checks write, a first value and the function that
    gives a second value from it."
    (first
      r"The first value of the pair.")
    (second
      r"The function that gives the second value from the first.")] Pair

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
