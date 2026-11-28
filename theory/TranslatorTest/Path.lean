module

meta import Translator.Path

/-!
# Path

The module defines the checks of the paths that the modules of a theory take in the source of the
package: a module in a folder of the theory takes the folder, and a module at the root of the
theory its name alone.

## Implementation Notes

The checks compare the paths with their expected values by `#guard_msgs` on `#eval`, as `#guard`
emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

/-- info: ["Colorimetry/Tristimulus", "Functor"] -/
#guard_msgs in
#eval [Translator.pathOf `Falkara.Presentation `Falkara.Presentation.Colorimetry.Tristimulus,
  Translator.pathOf `Falkara.Simulation `Falkara.Simulation.Functor]
