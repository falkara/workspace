/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Mathlib.Init -- shake: keep

/-!
# Reference

The module defines a reference to a declaration of the theory that the translation names: the
declaration, the module of the theory that declares it, and the words of the name that a target
takes for it, such as `behavior` for `StreamCoalgebra.behavior` in the module `StreamCoalgebra`.

## Implementation Notes

A reference holds the words of a name rather than a name of a target, so every target joins the
same words by its own conventions, and the module of the declaration, so every target tells a
declaration of the module that it writes apart from a declaration of another module.
-/

public section

namespace Translator.Core

/-- A reference to a declaration of the theory. -/
structure Reference where
  /-- The declaration. -/
  declaration : Lean.Name
  /-- The module of the theory that declares the declaration. -/
  module : Lean.Name
  /-- The words of the name that a target takes for the declaration. -/
  words : List String
  /-- Whether the declaration takes the name of its module, as the structure `StreamCoalgebra`
  does in the module `StreamCoalgebra`, so that its words are those of its module. -/
  takesModuleName : Bool := false
  deriving Repr, DecidableEq

end Translator.Core
