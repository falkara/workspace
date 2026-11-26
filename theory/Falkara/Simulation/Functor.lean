/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Mathlib.CategoryTheory.Functor.Const

import Falkara.Counterpart
import Falkara.References

/-!
# Functor

The module defines the functors, the identity functor, the composition of functors, and the curried
functor of constant functors.

## Implementation Notes

The action of a functor on objects takes the type parameter `Endofunctor` in TypeScript, as a
functor on types is an endofunctor, which Jacobs writes as a mapping of sets to sets, and the type
lambda stands for the functor as it does in a coalgebra.

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

public section

namespace Falkara.Simulation

/-- A functor between categories, with its action on objects and its action on morphisms. -/
@[counterpart Mathlib.library CategoryTheory.Functor
  typescript
    r"An endofunctor, with its action on objects as its type parameter and its action on morphisms."
    (obj → "Endofunctor")
    (map
      r"The action of a functor on morphisms.")
    (map_id
      r"The predicate that tells whether the instance preserves identity morphisms.")
    (map_comp
      r"The predicate that tells whether the instance preserves composition.")
    constructor
      r"Creates an instance of an endofunctor from its action on morphisms."
    axioms
      r"Gives the predicates that tell whether an instance preserves identity morphisms and
      composition, comparing the values of its endofunctor by the given equivalence."]
abbrev Functor := @CategoryTheory.Functor

/-- The identity functor of a category, which maps every object and every morphism to itself. -/
@[counterpart Mathlib.library CategoryTheory.Functor.id
  typescript
    r"An identity functor, which maps every type to itself."
    instance
      r"Gives the instance of the identity functor."]
abbrev Functor.id := @CategoryTheory.Functor.id

/-- The composite of two functors, which applies the functor $F$ and then the functor $G$. -/
@[counterpart Mathlib.library CategoryTheory.Functor.comp
  typescript
    r"A composite of two endofunctors, which applies the first endofunctor and then the second
    endofunctor."
    (F → "FirstEndofunctor")
    (G → "SecondEndofunctor")
    instance
      r"Gives the instance of a composite from the instances of its two endofunctors."]
abbrev Functor.comp := @CategoryTheory.Functor.comp

/-- The curried functor of constant functors, which maps every type $X$ to the functor
$Y \mapsto X$. -/
@[counterpart Mathlib.library CategoryTheory.Functor.const
  typescript
    r"A constant functor, which maps every type to the constant."
    (X → "Constant")
    instance
      r"Gives the instance of a constant functor."]
abbrev Functor.const := @CategoryTheory.Functor.const

end Falkara.Simulation
