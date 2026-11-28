module

meta import Translator.Target.Effect.Contract
meta import Translator.Target.TypeScript.Print

/-!
# Contract

The module defines the checks of the contract of a module of the core: a module with a function and
an instance takes the declaration of the function and the contract after it, which names the
function and then the instance under the name of the class of functors, as the functor takes the
name of its module, and the check of the module of the package, while a module without a function
and an instance takes no contract.

## Implementation Notes

The checks compare the printed declarations with the text that the translator writes by
`#guard_msgs` on `#eval`, as `#guard` emits no message on success, which the linter
`linter.hashCommand` of Mathlib refuses.
-/

open Translator Translator.Effect

/--
info: /** Gives the next state of a chime. */
export type Next = (state: Rational.Rational) => Rational.Rational;

/** A contract of the functions of the theory that the module `Chime` of the package implements. */
interface Contract {
/** Gives the next state of a chime. */
readonly next: Next;
/** The instance of the functor of the chimes. */
readonly functor: <B, F extends HKT.TypeLambda>(f: Functor.Functor<F>) => Functor.Functor<Chime<B, F>>;
}

/** A check of the module `Chime` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
-/
#guard_msgs in
#eval
  let context : Context := { theory := `Fixture, mainModule := `Fixture.Chime, channels := false }
  let documentation := fun (text : String) ↦ ({ text, addresses := [] } : Core.Documentation)
  let chime : Core.Reference :=
    { declaration := `Chime, module := `Fixture.Chime, words := ["Chime"], takesModuleName := true }
  let module : Core.Module Core.TypeTerm Core.Argument Core.Schema := {
    module := `Fixture.Chime
    declarations :=
      [.instance chime (documentation "The instance of the functor of the chimes.")
          [{ name := "B", kind := .type, default := none },
            { name := "F", kind := .functor, default := none }],
        .function { declaration := `Chime.next, module := `Fixture.Chime, words := ["Next"] }
          (documentation "Gives the next state of a chime.") [] []
          (.function [] [.mk "state" .rational] .rational)]
    functorClass :=
      some { declaration := `Functor, module := `Fixture.Functor, words := ["Functor"] } }
  IO.print (TypeScript.Statement.printBlock (lowerModule context "Chime" module))

/-- info: 0 -/
#guard_msgs in
#eval
  (contractOf { theory := `Fixture, mainModule := `Fixture.Shelf, channels := false } "Shelf"
    { module := `Fixture.Shelf, declarations := [], functorClass := none }).length
