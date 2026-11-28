module

meta import Translator.Target.Effect.Shape
meta import Translator.Target.TypeScript.Print

/-!
# Shape

The module defines the checks of the idioms of Effect that a declaration of the core takes beyond
its types: the variance of a type parameter that a function takes, that a function gives, that it
both takes and gives, that a declaration takes at the variances it declares, and that occurs
nowhere; a type parameter that is a functor with its default value; and the signature of a function
as a type alias, as an interface that pipes a stream into the function with the channels `E` and
`R`, and as an interface without its first parameter, as `Function.dual` of Effect gives it, where
the function is an operation on a type.

## Implementation Notes

The checks compare the variances and the printed declarations with their expected values by
`#guard_msgs` on `#eval`, as `#guard` emits no message on success, which the linter
`linter.hashCommand` of Mathlib refuses.
-/

open Translator Translator.Effect

/-- info: ["in", "out", "in out", "in out", ""] -/
#guard_msgs in
#eval
  let printed := fun (variance : TypeScript.Variance) ↦ match variance with
    | .contravariant => "in"
    | .covariant => "out"
    | .invariant => "in out"
    | .inferred => ""
  let function : Core.TypeTerm :=
    .function [] [.mk "input" (.parameter "Input")] (.parameter "Output")
  let pair : Core.TypeTerm :=
    .named { declaration := `Pair, module := `Pair, words := ["Pair"] }
      [.type (.parameter "First")] [[true, false]]
  (["Input", "Output", "State"].map fun parameter ↦
    printed (varianceOf parameter
      [function, .function [] [.mk "state" (.parameter "State")] (.parameter "State")])) ++
    [printed (varianceOf "First" [pair]), printed (varianceOf "Other" [function])]

/-- info: "Monad extends HKT.TypeLambda = Functor.Id" -/
#guard_msgs in
#eval
  (typeParameterOf { theory := .anonymous, mainModule := `Kind, channels := false } .inferred
    { name := "Monad", kind := .functor
      default := some (.constructor (.identity
        { declaration := `Functor.id, module := `Functor, words := ["Id"] })) }).print

/--
info: /** Gives the outputs of a system. */
export interface Outputs {
<Input, Output, E = never, R = never>(system: System, inputs: Stream.Stream<Input, E, R>): Stream.Stream<Output, E, R>;
<Input, Output>(system: System): <E = never, R = never>(inputs: Stream.Stream<Input, E, R>) => Stream.Stream<Output, E, R>;
}

/** Shifts a coordinate by an offset. */
export interface Shift {
<X>(coordinate: Coordinate<X>, offset: X): Coordinate<X>;
<X>(offset: X): (coordinate: Coordinate<X>) => Coordinate<X>;
}

/** Tells whether a value is positive. */
export type IsPositive = (value: Rational.Rational) => boolean;
-/
#guard_msgs in
#eval
  let context : Context := { theory := .anonymous, mainModule := `System, channels := false }
  let system : Core.TypeTerm :=
    .named { declaration := `System, module := `System, words := ["System"] } [] []
  let coordinate : Core.TypeTerm :=
    .named { declaration := `Coordinate, module := `System, words := ["Coordinate"] }
      [.type (.parameter "X")] [[true]]
  IO.print (TypeScript.Statement.printBlock
    [functionStatementOf context { text := "Gives the outputs of a system.", addresses := [] }
        "Outputs" ["Input", "Output"]
        (.function []
          [.mk "system" system, .mk "inputs" (.stream (.parameter "Input"))]
          (.stream (.parameter "Output"))),
      functionStatementOf context { text := "Shifts a coordinate by an offset.", addresses := [] }
        "Shift" ["X"]
        (.function [] [.mk "coordinate" coordinate, .mk "offset" (.parameter "X")] coordinate),
      functionStatementOf context { text := "Tells whether a value is positive.", addresses := [] }
        "IsPositive" [] (.function [] [.mk "value" .rational] .boolean)])
