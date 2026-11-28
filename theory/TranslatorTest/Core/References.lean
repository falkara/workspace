module

meta import Translator.Core.References

/-!
# References

The module defines the checks of the declarations that a module of the core names: the schemas of
the fields of a structure of data, the types of a function and the structure that a value builds,
each declaration once, in the order in which the module first names it, while a declaration names
neither itself nor a type parameter.

## Implementation Notes

The checks compare the declarations with their expected values by `#guard_msgs` on `#eval`, as
`#guard` emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

open Translator.Core

/-- info: [`Geometry.Coordinate, `Geometry.Point] -/
#guard_msgs in
#eval
  let coordinate : Reference :=
    { declaration := `Geometry.Coordinate, module := `Fixture.Coordinate, words := ["Coordinate"] }
  let point : Reference :=
    { declaration := `Geometry.Point, module := `Fixture.Point, words := ["Point"] }
  let documentation : Documentation := { text := "A declaration.", addresses := [] }
  let module : Module TypeTerm Argument Schema := {
    module := `Fixture.Point
    declarations :=
      [.data point documentation documentation documentation
          [{ name := "first", documentation, type := .named coordinate }],
        .function { point with declaration := `Geometry.pointAt, words := ["PointAt"] }
          documentation ["X"] []
          (.function []
            [.mk "coordinate" (.named coordinate [] []), .mk "value" (.parameter "X")]
            (.option (.named point [] []))),
        .value { point with declaration := `Geometry.origin, words := ["Origin"] } documentation
          (.named point [] []) (.structure point [("first", .rational 0 1)])]
    functorClass := none }
  module.references.map (·.declaration)
