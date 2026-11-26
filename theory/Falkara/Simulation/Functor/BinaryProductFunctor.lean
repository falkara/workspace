/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Mathlib.CategoryTheory.Limits.Types.Products

import Falkara.Counterpart
import Falkara.References

/-!
# Binary Product Functor

The module defines the curried functor of binary products as Mathlib [Mathlib.library] states it.

## Main Definitions

- `binaryProductFunctor`: the curried functor of binary products.

## Implementation Notes

The type that the curried functor maps takes the type parameter `Factor` in TypeScript, as Jacobs
[Jacobs.introductionToCoalgebra] builds a polynomial functor as a product of functors, whose
factor the type is. The curried functor takes a documentation comment of the theory in TypeScript,
which writes it as the type of the functor it gives at a factor, a type whose comment opens with an
article and names the factor as the type parameter does.

The product takes in TypeScript the record `Product` with the fields `output` and `next` in place
of a tuple, as every coalgebra of the package gives through the product an output and the next
state, so that TypeScript tells the two apart even where they are of one type.
-/

@[expose] public section

namespace Falkara.Simulation

/-- The curried functor of binary products, which maps every type $X$ to the functor
$Y \mapsto X \times Y$. -/
@[counterpart Mathlib.library CategoryTheory.Limits.Types.binaryProductFunctor
  typescript
    r"A functor of binary products, which maps every type to its binary product with the factor."
    (X → "Factor")
    (Prod → "Product"
      r"A binary product of an output and the next state, which a coalgebra of the functor gives
      from every state.")
    (fst → "output"
      r"The output that the coalgebra gives from the state.")
    (snd → "next"
      r"The state that follows the state.")]
abbrev binaryProductFunctor := @CategoryTheory.Limits.Types.binaryProductFunctor

end Falkara.Simulation
