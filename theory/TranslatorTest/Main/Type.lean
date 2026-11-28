module

meta import Translator.Main
meta import Lean.Elab.Term
import Batteries.Tactic.Lint.Basic
import Batteries.Tactic.Lint.Misc
import Falkara.Counterpart
import Falkara.Translation.Rules

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
alone. The checks compare as well the roles of the functions that the translator derives from a
structure of data, a structure with type parameters, and a function, and the reason against a
comment under a role whose function the translator never derives, such as the schema of a structure
with type parameters, while a declaration without such a comment takes no reason.
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
#eval Translator.typeOf .anonymous (Lean.mkConst ``Rat)

/-- info: "ReadonlyArray<Rational.Rational>" -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  Translator.typeOf .anonymous (← Lean.Elab.Term.elabType (← `(List Rat)))

-- The checks import no Mathlib, so they name the stream and the sequence of Mathlib alone.
/-- info: "Stream.Stream<Rational.Rational>" -/
#guard_msgs in
#eval Translator.typeOf .anonymous
  (Lean.mkApp (Lean.mkConst `Stream' [.zero]) (Lean.mkConst ``Rat))

/-- info: "Stream.Stream<Rational.Rational>" -/
#guard_msgs in
#eval Translator.typeOf .anonymous
  (Lean.mkApp (Lean.mkConst `Stream'.Seq [.zero]) (Lean.mkConst ``Rat))

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
  Translator.typeOf .anonymous (← Lean.getConstInfo ``namedFunction).type

/-- error: `UnmarkedStructure` has no declaration in TypeScript, as the theory never gives it a counterpart in TypeScript. -/
#guard_msgs in
#eval Translator.typeOf .anonymous (Lean.mkConst ``UnmarkedStructure)

/-- error: `Nat` has no declaration in TypeScript, as the theory never gives it a counterpart in TypeScript. -/
#guard_msgs in
#eval Translator.typeOf .anonymous (Lean.mkConst ``Nat)

/-- info: "readonly [Rational.Rational, ReadonlyArray<Rational.Rational>]" -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  Translator.typeOf .anonymous (← Lean.Elab.Term.elabType (← `(Rat × List Rat)))

/-- error: `P x` has no type in TypeScript. -/
#guard_msgs in
#eval show Lean.MetaM String from do
  Lean.Meta.withLocalDeclD `P
      (Lean.mkForall `value .default (Lean.mkConst ``Rat) (Lean.mkSort Lean.Level.one)) fun family ↦ Lean.Meta.withLocalDeclD `x (Lean.mkConst ``Rat) fun value ↦
      Translator.typeOf .anonymous (Lean.mkApp family value)

/-- info: "Result.Result<Rational.Rational, string>" -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  Translator.typeOf .anonymous (← Lean.Elab.Term.elabType (← `(String ⊕ Rat)))

/-- info: "(a: Rational.Rational) => Rational.Rational" -/
#guard_msgs in
#eval show Lean.MetaM String from do
  Translator.typeOf .anonymous (← Lean.getConstInfo ``unnamedFunction).type

/-- info: "<X, Y>(morphism: (a: X) => Y, value: X) => Y" -/
#guard_msgs in
#eval show Lean.MetaM String from do
  Translator.typeOf .anonymous (← Lean.getConstInfo ``genericFunction).type

/-- info: "Schema.Option(Schema.Array(MarkedStructure))" -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  Translator.schemaOf .anonymous
    (← Lean.Elab.Term.elabType (← `(Option (Array MarkedStructure))))

/-- info: "Schema.Array(Schema.Rational)" -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  Translator.schemaOf .anonymous (← Lean.Elab.Term.elabType (← `(List Rat)))

/-- error: `UnmarkedStructure` has no declaration in TypeScript, as the theory never gives it a counterpart in TypeScript. -/
#guard_msgs in
#eval Translator.schemaOf .anonymous (Lean.mkConst ``UnmarkedStructure)

/-- error: `Rat × Rat` has no schema in TypeScript. -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  Translator.schemaOf .anonymous (← Lean.Elab.Term.elabType (← `(Rat × Rat)))

/-- error: `Rat → Rat` has no schema in TypeScript, as a schema describes data and the type is a function. -/
#guard_msgs in
#eval show Lean.MetaM String from do
  Translator.schemaOf .anonymous (← Lean.getConstInfo ``unnamedFunction).type

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
      r"The function that gives the second value from the first.")
    schema
      r"A schema of a pair, which the checks refuse."
    constructor
      r"Creates a pair from its first value and the function that gives its second value."] Pair

/-- info: "Pair<Rational.Rational, ReadonlyArray<Rational.Rational>>" -/
#guard_msgs in
#eval show Lean.Elab.TermElabM String from do
  Translator.typeOf .anonymous (← Lean.Elab.Term.elabType (← `(Pair Rat (List Rat))))

/-- error: `Pair` has no schema in TypeScript, as it is neither a structure whose every field takes a schema nor a refinement. -/
#guard_msgs in
#eval Translator.schemaOf .anonymous (Lean.mkConst ``Pair)

/-- info: [[true, false], [true]] -/
#guard_msgs in
#eval show Lean.MetaM (List (List Bool)) from do
  Translator.Lean.variancesOf (← Translator.Lean.rulesOf) Translator.Lean.unfoldingDepth ``Pair

/-- info: [["schema", "constructor"], ["constructor"], []] -/
#guard_msgs in
#eval show Lean.MetaM (List (List String)) from do
  return [(Translator.derivedOf (← Translator.Lean.kindOf ``MarkedStructure)).map (·.word),
    (Translator.derivedOf (← Translator.Lean.kindOf ``Pair)).map (·.word),
    (Translator.derivedOf (← Translator.Lean.kindOf ``namedFunction)).map (·.word)]

/-- info: [] -/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  (← Translator.surplusOf ``MarkedStructure).mapM (·.render.toString)

/-- info: ["`Pair` takes no comment under `schema` in its attribute `counterpart`, as the translator derives no schema from the declaration."] -/
#guard_msgs in
#eval show Lean.MetaM (List String) from do
  (← Translator.surplusOf ``Pair).mapM (·.render.toString)
