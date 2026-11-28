module

meta import Translator.Target.Effect.Type
meta import Translator.Target.TypeScript.Print

/-!
# Type

The module defines the checks of the types of Effect that the types of the core take: the
primitive types, an option of an array, a sequence, a stream with the channels `E` and `R`, whose
elements carry none, a tuple and a record, a sum with the right summand first, an effect, the
object of a type constructor that is a parameter at the object of a type lambda, a declaration of
the module being written and one of another module with their arguments, the type lambdas of the
options and of the identity functor, and a generic function.

## Implementation Notes

The checks compare the printed types with the text that the translator writes by `#guard_msgs` on
`#eval`, as `#guard` emits no message on success, which the linter `linter.hashCommand` of Mathlib
refuses.
-/

open Translator Translator.Effect

/--
info: Rational.Rational
string
boolean
void
Option.Option<ReadonlyArray<Output>>
Stream.Stream<Rational.Rational>
Stream.Stream<Stream.Stream<Output>, E, R>
-/
#guard_msgs in
#eval
  let context : Effect.Context :=
    { theory := .anonymous, mainModule := `Functor, channels := false }
  IO.print ("\n".intercalate
    ([lowerType context .rational, lowerType context .string, lowerType context .boolean,
        lowerType context .unit,
        lowerType context (.option (.array (.parameter "Output"))),
        lowerType context (.sequence .rational),
        lowerType { context with channels := true } (.stream (.stream (.parameter "Output")))].map
      (·.print)))

/--
info: readonly [Rational.Rational, string]
{ readonly output: Output; readonly next: this['Target'] }
Result.Result<Rational.Rational, string>
Effect.Effect<Success, Failure, Requirements>
HKT.Kind<Monad, never, never, never, this['Target']>
-/
#guard_msgs in
#eval
  let context : Effect.Context :=
    { theory := .anonymous, mainModule := `Functor, channels := false }
  IO.print ("\n".intercalate
    ([lowerType context (.product none [.mk "fst" .rational, .mk "snd" .string]),
        lowerType context
          (.product
            (some
              { declaration := `binaryProductFunctor
                module := `Functor
                words := ["BinaryProductFunctor"] })
            [.mk "output" (.parameter "Output"), .mk "next" .target]),
        lowerType context (.sum .string .rational),
        lowerType context
          (.effect (.parameter "Success") (.parameter "Failure") (.parameter "Requirements")),
        lowerType context (.apply (.parameter "Monad") .target)].map
      (·.print)))

/--
info: Comp<Endofunctor, Option.OptionTypeLambda>
Coalgebra.Coalgebra<Functor.Id, State>
<X, Y>(f: (x: X) => Y, value: X) => Y
-/
#guard_msgs in
#eval
  let context : Effect.Context :=
    { theory := .anonymous, mainModule := `Functor, channels := false }
  IO.print ("\n".intercalate
    ([lowerType context
          (.named { declaration := `Functor.comp, module := `Functor, words := ["Comp"] }
            [.constructor (.parameter "Endofunctor"), .constructor .option] []),
        lowerType context
          (.named { declaration := `Coalgebra, module := `Coalgebra, words := ["Coalgebra"] }
            [.constructor
                (.identity
                  { declaration := `Functor.id
                    module := `Simulation.Functor
                    words := ["Id"] }),
              .type (.parameter "State")] []),
        lowerType context
          (.function ["X", "Y"]
            [.mk "f" (.function [] [.mk "x" (.parameter "X")] (.parameter "Y")),
              .mk "value" (.parameter "X")]
            (.parameter "Y"))].map
      (·.print)))
