module

public meta import Falkara.Translation
meta import Translator.Lean.Elaborate.Type

/-!
# Type

The module defines the checks of the translation of trees into the core: a list as an array, a sum
with its summands in their order, a computation that reads requirements as an effect, a morphism
whose domain is a type parameter as a function whose parameter takes the name of the parameter, an
unnamed parameter whose type is a morphism as `f`, an implicit type as a type parameter of the
function that follows it, an object of a functor whose declaration names its fields as a presented
product, the arguments of a declaration in the order a target takes them, every one translated
though a trailing one at its default is left out, the options and the identity monad as type
constructors, and the schema of an option of an array of a declaration of
data, while a constant without a counterpart, a function type whose result depends on its
parameter, and a declaration that is no type of data refuse with the reason.

## Implementation Notes

The checks compare the translations with their expected values by `#guard_msgs` on `#eval`, as
`#guard` emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

public section

open Translator Translator.Lean

/-- The rules of the formers that the checks read, as the list of the rules of the translator gives
them. -/
meta def formers : List Falkara.Translation.Rule :=
  [(`Rat, 0, .rational), (`String, 0, .string), (`Bool, 0, .boolean), (`Option, 1, .option),
      (`Array, 1, .array), (`List, 1, .array), (`Sum, 2, .sum), (`ReaderT, 3, .reader),
      (`Except, 2, .except), (`Id, 1, .identity)].map
    fun (constant, arity, former) ↦ { constant, arity, domain := none, action := .type former }

/-- info: some (Translator.Core.TypeTerm.array (Translator.Core.TypeTerm.rational)) -/
#guard_msgs in
#eval (Tree.toType { rules := formers, identity := none }
  (.constant `List [.constant `Rat [] (.const `Rat [])] (.const `List []))).toOption

/--
info: some (Translator.Core.TypeTerm.sum (Translator.Core.TypeTerm.string) (Translator.Core.TypeTerm.rational))
-/
#guard_msgs in
#eval (Tree.toType { rules := formers, identity := none }
  (.constant `Sum [.constant `String [] (.const `String []), .constant `Rat [] (.const `Rat [])]
    (.const `Sum []))).toOption

/--
info: some (Translator.Core.TypeTerm.effect
  (Translator.Core.TypeTerm.parameter "Success")
  (Translator.Core.TypeTerm.parameter "Failure")
  (Translator.Core.TypeTerm.parameter "Requirements"))
-/
#guard_msgs in
#eval (Tree.toType { rules := formers, identity := none }
  (.constant `ReaderT
    [.parameter "Requirements" (.const `R []),
      .constant `Except [.parameter "Failure" (.const `E [])] (.const `Except []),
      .parameter "Success" (.const `A [])]
    (.const `ReaderT []))).toOption

/--
info: some (Translator.Core.TypeTerm.function
  []
  [Translator.Core.NamedType.mk "state" (Translator.Core.TypeTerm.parameter "State")]
  (Translator.Core.TypeTerm.parameter "Output"))
-/
#guard_msgs in
#eval (Tree.toType { rules := formers, identity := none }
  (.morphism (.parameter "State" (.const `State [])) (.parameter "Output" (.const `Output []))
    (.const `Quiver.Hom []))).toOption

/--
info: some (Translator.Core.TypeTerm.function
  ["X"]
  [Translator.Core.NamedType.mk
     "f"
     (Translator.Core.TypeTerm.function
       []
       [Translator.Core.NamedType.mk "value" (Translator.Core.TypeTerm.rational)]
       (Translator.Core.TypeTerm.parameter "X")),
   Translator.Core.NamedType.mk "a" (Translator.Core.TypeTerm.parameter "X")]
  (Translator.Core.TypeTerm.boolean))
-/
#guard_msgs in
#eval (Tree.toType { rules := formers, identity := none }
  (.generic `X
    (.function
      [.mk (Lean.addMacroScope `test `a 1)
          (.morphism (.constant `Rat [] (.const `Rat [])) (.parameter "X" (.const `X []))
            (.const `Quiver.Hom []))
          (.const `function []),
        .mk `a (.parameter "X" (.const `X [])) (.const `function [])]
      (.constant `Bool [] (.const `Bool []))
      (.const `function []))
    (.const `generic []))).toOption

/--
info: some (Translator.Core.TypeTerm.product
  (some { declaration := `binaryProductFunctor,
     module := `Functor,
     words := ["BinaryProductFunctor"],
     takesModuleName := false })
  [Translator.Core.NamedType.mk "output" (Translator.Core.TypeTerm.parameter "Output"),
   Translator.Core.NamedType.mk "next" (Translator.Core.TypeTerm.target)])
-/
#guard_msgs in
#eval (Tree.toType { rules := formers, identity := none }
  (.record
    { declaration := `binaryProductFunctor
      module := `Functor
      words := ["BinaryProductFunctor"] }
    [.mk "output" (.parameter "Output" (.const `Output [])), .mk "next" (.target (.const `T []))]
    (.const `record []))).toOption

/--
info: some (Translator.Core.TypeTerm.named
  { declaration := `StreamCoalgebra,
    module := `StreamCoalgebra,
    words := ["StreamCoalgebra"],
    takesModuleName := false }
  [Translator.Core.Argument.type (Translator.Core.TypeTerm.parameter "Output"),
   Translator.Core.Argument.type (Translator.Core.TypeTerm.parameter "State")]
  [[true], [true, false]])
-/
#guard_msgs in
#eval (Tree.toType
  { rules := formers
    identity := some { declaration := `Functor.id, module := `Functor, words := ["Id"] } }
  (.declared
    { declaration := `StreamCoalgebra
      module := `StreamCoalgebra
      words := ["StreamCoalgebra"] }
    false
    [.mk (.parameter "Output" (.const `Output [])) false .required [true],
      .mk (.constant `Id [] (.const `Id [])) true (.defaulted true) [true],
      .mk (.parameter "State" (.const `State [])) false .extra [true, false]]
    (.const `StreamCoalgebra []))).toOption

/--
info: (some (Translator.Core.Constructor.option),
 some (Translator.Core.Constructor.identity
   { declaration := `Functor.id, module := `Functor, words := ["Id"], takesModuleName := false }))
-/
#guard_msgs in
#eval
  let context : Elaborate.Context := {
    rules := formers
    identity := some { declaration := `Functor.id, module := `Functor, words := ["Id"] } }
  ((Tree.toConstructor context (.constant `Option [] (.const `Option []))).toOption,
    (Tree.toConstructor context (.constant `Id [] (.const `Id []))).toOption)

/--
info: some (Translator.Core.Schema.option
  (Translator.Core.Schema.array
    (Translator.Core.Schema.named
      { declaration := `Point, module := `Point, words := ["Point"], takesModuleName := false })))
-/
#guard_msgs in
#eval (Tree.toSchema { rules := formers, identity := none }
  (.constant `Option
    [.constant `Array
      [.declared { declaration := `Point, module := `Point, words := ["Point"] } true []
        (.const `Point [])]
      (.const `Array [])]
    (.const `Option []))).toOption

/--
error: `Nat` has no declaration in TypeScript, as the theory never gives it a counterpart in TypeScript.
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  if let .error refusal := Tree.toType { rules := formers, identity := none } (.constant `Nat [] (.const `Nat [])) then
    Lean.throwError refusal.render

/-- error: `dependent` has no type in TypeScript, as its result depends on its parameter `x`. -/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  if let .error refusal := Tree.toType { rules := formers, identity := none } (.dependent `x (.const `dependent []))
  then
    Lean.throwError refusal.render

/--
error: `Pair` has no schema in TypeScript, as it is neither a structure whose every field takes a schema nor a refinement.
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  if let .error refusal := Tree.toSchema { rules := formers, identity := none }
      (.declared { declaration := `Pair, module := `Pair, words := ["Pair"] } false []
        (.const `Pair []))
  then
    Lean.throwError refusal.render
