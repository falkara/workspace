/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.References -- shake: keep
public import Mathlib.CategoryTheory.Functor.Basic
import Falkara.ExportTypeScript
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Functor

The module defines the functors as Mathlib [mathlibCommunity2020leanMathematicalLibrary] states
them.

## Main Definitions

- `Functor`: a functor between categories.

## Implementation Notes

The action of a functor on objects takes the type parameter `Endofunctor` in TypeScript, as a
functor on types is an endofunctor, which Jacobs [jacobs2017introductionCoalgebra] writes as a
mapping of sets to sets, and the type lambda stands for the functor as it does in a coalgebra.

The axioms take documentation comments of the theory in TypeScript, as each takes a predicate that
tells whether an instance keeps it, whereas the comments of Mathlib state the axioms of a functor.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- A functor between categories, with its action on objects and its action on morphisms. -/
abbrev Functor := @CategoryTheory.Functor

attribute [cite "CategoryTheory.Functor" mathlibCommunity2020leanMathematicalLibrary] Functor

/-! ### Export -/

attribute [export_typescript
  (obj := "Endofunctor")
  (map_id := "map_id"
    "The predicate that tells whether the instance preserves identity morphisms.")
  (map_comp := "map_comp" "The predicate that tells whether the instance preserves composition.")]
  Functor

end Falkara.Simulation
