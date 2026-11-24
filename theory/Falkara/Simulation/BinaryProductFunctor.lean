/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.References -- shake: keep
public import Mathlib.CategoryTheory.Limits.Types.Products
import Falkara.ExportTypeScript
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Binary Product Functor

The module defines the curried functor of binary products as Mathlib
[mathlibCommunity2020leanMathematicalLibrary] states it.

## Main Definitions

- `binaryProductFunctor`: the curried functor of binary products.

## Implementation Notes

The type that the curried functor maps takes the type parameter `Factor` in TypeScript, as Jacobs
[jacobs2017introductionCoalgebra] builds a polynomial functor as a product of functors, whose
factor the type is. The curried functor takes a documentation comment of the theory in TypeScript,
which writes it as the type of the functor it gives at a factor, a type whose comment opens with an
article and names the factor as the type parameter does.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- The curried functor of binary products, which maps every type $X$ to the functor
$Y \mapsto X \times Y$. -/
abbrev binaryProductFunctor := @CategoryTheory.Limits.Types.binaryProductFunctor

attribute [cite "CategoryTheory.Limits.Types.binaryProductFunctor"
  mathlibCommunity2020leanMathematicalLibrary] binaryProductFunctor

/-! ### Export -/

attribute [export_typescript
  "A functor of binary products, which maps every type to its binary product with the factor."
  (X := "Factor")] binaryProductFunctor

end Falkara.Simulation
