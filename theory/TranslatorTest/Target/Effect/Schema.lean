module

meta import Translator.Target.Effect.Schema
meta import Translator.Target.TypeScript.Print

/-!
# Schema

The module defines the checks of the schemas of Effect that the schemas of the core take: the
schemas of the primitive types, an option of an array of a declaration of the module being
written, and a declaration of another module after the namespace of its module.

## Implementation Notes

The checks compare the printed schemas with the text that the translator writes by `#guard_msgs` on
`#eval`, as `#guard` emits no message on success, which the linter `linter.hashCommand` of Mathlib
refuses.
-/

open Translator Translator.Effect

/--
info: Schema.Rational
Schema.String
Schema.Boolean
Schema.Option(Schema.Array(MarkedStructure))
Coordinate.Coordinate
-/
#guard_msgs in
#eval
  let context : Effect.Context := { theory := `Fixture, mainModule := `Point, channels := false }
  IO.print ("\n".intercalate
    ([lowerSchema context .rational, lowerSchema context .string, lowerSchema context .boolean,
        lowerSchema context
          (.option (.array
            (.named
              { declaration := `MarkedStructure
                module := `Point
                words := ["MarkedStructure"] }))),
        lowerSchema context
          (.named
            { declaration := `Coordinate
              module := `Fixture.Coordinate
              words := ["Coordinate"] })].map
      (·.print)))
