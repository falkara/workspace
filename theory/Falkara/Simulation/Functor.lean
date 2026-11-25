/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Mathlib.CategoryTheory.Functor.Const

import Falkara.ExportTypeScript
import Falkara.References

/-!
# Functor

The module defines the functors, the identity functor, the composition of functors, and the curried
functor of constant functors as Mathlib [mathlibCommunity2020leanMathematicalLibrary] states them.

## Main Definitions

- `Functor`: a functor between categories.
- `Functor.id`: the identity functor.
- `Functor.comp`: the composite of two functors.
- `Functor.const`: the curried functor of constant functors.

## Implementation Notes

The action of a functor on objects takes the type parameter `Endofunctor` in TypeScript, as a
functor on types is an endofunctor, which Jacobs [jacobs2017introductionCoalgebra] writes as a
mapping of sets to sets, and the type lambda stands for the functor as it does in a coalgebra.

The functor and its axioms take documentation comments of the theory in TypeScript. The functor is
an endofunctor there, whose action on objects is its type parameter, whereas the comment of Mathlib
states a functor between categories with both actions, and each axiom takes a predicate that tells
whether an instance keeps it, whereas the comments of Mathlib state the axioms of a functor.

The identity functor takes in TypeScript the type lambda `Functor.Id`, which every kind of system
takes as the default of its monad, as the functor of the identity monad `Id` of Lean maps every type
to itself, so that a system without effects writes its steps as values alone.

The two functors of a composite take the type parameters `FirstEndofunctor` and `SecondEndofunctor`
in TypeScript, as Mathlib states that the composite applies the functor `F` first and then the
functor `G`. The type that the curried functor of constant functors maps takes the type parameter
`Constant`, as Jacobs calls the functor that maps every set to the same set a constant functor. The
composite and the curried functor take documentation comments of the theory in TypeScript, which
writes them as types, whose comments open with an article and name the endofunctors and the
constant as the type parameters do.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- A functor between categories, with its action on objects and its action on morphisms. -/
abbrev Functor := @CategoryTheory.Functor

attribute [cite "CategoryTheory.Functor" mathlibCommunity2020leanMathematicalLibrary] Functor

/-- The identity functor of a category, which maps every object and every morphism to itself. -/
abbrev Functor.id := @CategoryTheory.Functor.id

attribute [cite "CategoryTheory.Functor.id" mathlibCommunity2020leanMathematicalLibrary]
  Functor.id

/-- The composite of two functors, which applies the functor $F$ and then the functor $G$. -/
abbrev Functor.comp := @CategoryTheory.Functor.comp

attribute [cite "CategoryTheory.Functor.comp" mathlibCommunity2020leanMathematicalLibrary]
  Functor.comp

/-- The curried functor of constant functors, which maps every type $X$ to the functor
$Y \mapsto X$. -/
abbrev Functor.const := @CategoryTheory.Functor.const

attribute [cite "CategoryTheory.Functor.const" mathlibCommunity2020leanMathematicalLibrary]
  Functor.const

/-! ### Export -/

attribute [export_typescript
  "An endofunctor, with its action on objects as its type parameter and its action on morphisms."
  (obj := "Endofunctor")
  (map_id := "map_id"
    "The predicate that tells whether the instance preserves identity morphisms.")
  (map_comp := "map_comp" "The predicate that tells whether the instance preserves composition.")]
  Functor

attribute [export_typescript "An identity functor, which maps every type to itself."] Functor.id

attribute [export_typescript
  "A composite of two endofunctors, which applies the first endofunctor and then the second \
    endofunctor."
  (F := "FirstEndofunctor")
  (G := "SecondEndofunctor")] Functor.comp

attribute [export_typescript
  "A constant functor, which maps every type to the constant."
  (X := "Constant")] Functor.const

end Falkara.Simulation
