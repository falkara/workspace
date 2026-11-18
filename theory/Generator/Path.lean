/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Mathlib.Init -- shake: keep

/-!
# Path

The module defines the path of TypeScript that a module of the theory of a package takes: the
words of the name of the module after the namespace of the theory, joined by slashes, such as
`Colorimetry/Tristimulus` for `Falkara.Presentation.Colorimetry.Tristimulus` in the theory
`Falkara.Presentation`.

## Main Definitions

- `pathOf`: gives the path of TypeScript of a module of the theory of a package, the words of its
  name after the namespace of the theory, joined by slashes.

## Implementation Notes

The path leaves out the namespace of the theory rather than the first word of the name, as every
theory of a package lies under the namespace `Falkara`, which the source of the package has no
directory for.
-/

public section

namespace Generator

/-- Gives the path of TypeScript of a module of the theory of a package, the words of its name
after the namespace of the theory, joined by slashes. -/
def pathOf (theory module : Lean.Name) : String :=
  (module.replacePrefix theory .anonymous).toString.replace "." "/"

end Generator
