/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Mathlib.CategoryTheory.Types.Basic
public import Mathlib.Control.Basic

import Falkara.ExportTypeScript
import Falkara.References

/-!
# Binary Coproduct Functor

The module defines the functor of binary coproducts with a summand, which maps every type $Y$ to
the binary coproduct $B + Y$, as the functor of the type constructor `Sum B`, whose lawful functor
Mathlib [mathlibCommunity2020leanMathematicalLibrary] states, gives it.

## Main Definitions

- `binaryCoproductFunctor`: the functor of binary coproducts with a summand.

## Implementation Notes

Mathlib states the binary coproducts of types as colimits and gives no functor of them on types, so
the module takes the functor of the type constructor `Sum B`, whose objects are the coproducts of
Jacobs [jacobs2017introductionCoalgebra], a value of the summand or a value of the type.

The functor takes in TypeScript the type lambda whose type is `Result.Result` of Effect, a success
of a value of the type or a failure of a value of the summand, as a coalgebra of the functor either
goes on with a value or ends with one of the summand. The summand takes the type parameter
`Summand`, as the factor of `binaryProductFunctor` takes `Factor`.
-/

@[expose] public section

namespace Falkara.Simulation

universe u

/-! ### Definitions -/

/-- The functor of binary coproducts with a summand $B$, which maps every type $Y$ to the binary
coproduct $B + Y$. -/
abbrev binaryCoproductFunctor (Summand : Type u) : CategoryTheory.Functor (Type u) (Type u) :=
  CategoryTheory.ofTypeFunctor (Sum Summand)

attribute [cite "CategoryTheory.ofTypeFunctor" mathlibCommunity2020leanMathematicalLibrary]
  binaryCoproductFunctor

/-! ### Export -/

attribute [export_typescript
  "A functor of binary coproducts, which maps every type to its binary coproduct with the summand."]
  binaryCoproductFunctor

end Falkara.Simulation
