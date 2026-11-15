import Generator.Type
import Lean.Elab.Term

/-!
# Type

The module defines the checks of the types of TypeScript that the types of the theory take: a rational number, an option, an array, a list, a function type, and a declaration marked `export_typescript` take their types, while a declaration without the mark, a type of any other form, such as a product, and a function type with an unnamed parameter take none.
-/

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
#eval Generator.typeOf (Lean.mkConst ``Rat)

/-- info: "ReadonlyArray<Rational.Rational>" -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  Generator.typeOf (← Lean.Elab.Term.elabType (← `(List Rat)))

/-- The function whose type the checks write with a named parameter. -/
def namedFunction : (wavelength : Rat) → Option (Array MarkedStructure) :=
  fun _ => none

/-- The function whose type the checks refuse, as the type leaves its parameter unnamed. -/
def unnamedFunction : Rat → Rat :=
  fun wavelength => wavelength

/-- info: "(wavelength: Rational.Rational) => Option.Option<ReadonlyArray<MarkedStructure>>" -/
#guard_msgs in
#eval show Lean.MetaM String from do
  Generator.typeOf (← Lean.getConstInfo ``namedFunction).type

/-- error: `UnmarkedStructure` has no declaration in TypeScript, as the theory never marks it `export_typescript`. -/
#guard_msgs in
#eval Generator.typeOf (Lean.mkConst ``UnmarkedStructure)

/-- error: `Nat` has no declaration in TypeScript, as the theory never marks it `export_typescript`. -/
#guard_msgs in
#eval Generator.typeOf (Lean.mkConst ``Nat)

/-- error: `Rat × Rat` has no type in TypeScript. -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  Generator.typeOf (← Lean.Elab.Term.elabType (← `(Rat × Rat)))

/-- error: `Rat → Rat` has no type in TypeScript, as TypeScript names every parameter and the theory names none. -/
#guard_msgs in
#eval show Lean.MetaM String from do
  Generator.typeOf (← Lean.getConstInfo ``unnamedFunction).type
