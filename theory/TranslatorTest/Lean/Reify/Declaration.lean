module

meta import Translator.Lean.Reify.Declaration
import Falkara.Translation.Rules
import all TranslatorTest.Fixture.Clock
import all TranslatorTest.Fixture.Coordinate

/-!
# Declaration

The module defines the checks of the trees that the reading gives the declarations of a module of
the theory: a structure of data, a value that builds it, and a function, and the declarations of a
module of functors, bundled structures with their type parameters, a functor, a curried functor
with the type parameter of the type it maps, and a class of functors with the functor it binds and
its laws, every functor followed by its instance of the class of functors, each in the order of
their lines. The checks compare as well the value that a value of a structure of data takes, as
the module `Evaluate` gives it, whose checks compare every other value.

## Implementation Notes

The checks compare the shapes of the trees with their expected values rather than the trees
themselves, as a tree carries the expressions of Lean it was read from, by `#guard_msgs` on
`#eval`, as `#guard` emits no message on success, which the linter `linter.hashCommand` of Mathlib
refuses.
-/

open Translator Translator.Lean

/--
info: [("Coordinate", "data"), ("unit", "value"), ("shift", "function")]
-/
#guard_msgs in
#eval show Lean.MetaM (List (String × String)) from do
  let module ← reifyModule `Geometry `TranslatorTest.Fixture.Coordinate
  return module.declarations.map fun declaration ↦
    let (reference, kind) : Core.Reference × String := match declaration with
      | .data reference .. => (reference, "data")
      | .refinement reference .. => (reference, "refinement")
      | .structure reference .. => (reference, "structure")
      | .bundle reference .. => (reference, "bundle")
      | .lambda reference .. => (reference, "lambda")
      | .curried reference .. => (reference, "curried")
      | .functorClass reference .. => (reference, "functorClass")
      | .alias reference .. => (reference, "alias")
      | .function reference .. => (reference, "function")
      | .value reference .. => (reference, "value")
      | .instance reference .. => (reference, "instance")
    ("".intercalate reference.words, kind)

/--
info: [("Clock", "bundle", ["V"]), ("ChimingClock", "bundle", ["B", "V"]), ("Clockwork", "bundle", ["F", "V"]),
  ("ChimeFunctor", "lambda", ["B"]), ("ChimeFunctor", "instance", ["B"]), ("chimesFunctor", "curried", ["X"]),
  ("chimesFunctor", "instance", ["X"]), ("dialsFunctor", "curried", ["Setting"]),
  ("dialsFunctor", "instance", ["Setting"]), ("Gear", "functorClass", ["Motion", "map_id", "map_comp"]),
  ("GearTrain", "lambda", ["Driver", "Follower"]), ("GearTrain", "instance", ["Driver", "Follower"])]
-/
#guard_msgs in
#eval show Lean.MetaM (List (String × String × List String)) from do
  let module ← reifyModule `Geometry `TranslatorTest.Fixture.Clock
  return module.declarations.map fun declaration ↦
    let names := fun (parameters : List (Core.TypeParameter Tree)) ↦ parameters.map (·.name)
    let (reference, kind, parameters) : Core.Reference × String × List String :=
      match declaration with
      | .structure reference _ _ typeParameters _ => (reference, "structure", names typeParameters)
      | .bundle reference _ _ typeParameters .. => (reference, "bundle", names typeParameters)
      | .lambda reference _ typeParameters _ => (reference, "lambda", names typeParameters)
      | .curried reference _ typeParameters parameter .. =>
        (reference, "curried", names typeParameters ++ [parameter])
      | .functorClass reference _ _ _ functor _ laws =>
        (reference, "functorClass", functor :: laws.map (·.name))
      | .instance reference _ typeParameters => (reference, "instance", names typeParameters)
      | .data reference .. | .refinement reference .. | .alias reference .. | .function reference ..
      | .value reference .. => (reference, "other", [])
    ("".intercalate reference.words, kind, parameters)

/--
info: [Translator.Core.Value.structure
   { declaration := `Geometry.Coordinate,
     module := `TranslatorTest.Fixture.Coordinate,
     words := ["Coordinate"],
     takesModuleName := true }
   [("value", Translator.Core.Value.rational 1 1)]]
-/
#guard_msgs in
#eval show Lean.MetaM (List Core.Value) from do
  return (← reifyDeclaration `Geometry ``Geometry.unit).filterMap fun
    | .value _ _ _ value => some value
    | _ => none
