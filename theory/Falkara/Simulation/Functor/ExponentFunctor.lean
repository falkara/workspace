/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Mathlib.CategoryTheory.Yoneda

import Falkara.ExportTypeScript
import Falkara.References

/-!
# Exponent Functor

The module defines the exponent functor, which maps every type $k$ to the functor
$Y \mapsto (k \to Y)$, the exponent $Y^k$ of Jacobs [jacobs2017introductionCoalgebra], as the
coyoneda embedding of Mathlib [mathlibCommunity2020leanMathematicalLibrary] states it.

## Main Definitions

- `exponentFunctor`: the exponent functor.

## Implementation Notes

The type that the exponent functor maps takes the type parameter `Exponent` in TypeScript, as the
type is the exponent of $Y^k$. The exponent functor takes a documentation comment of the theory in
TypeScript, which writes it as the type of the functor it gives at an exponent, a type whose comment
opens with an article and names the exponent as the type parameter does.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- The exponent functor, which maps every type $k$ to the functor $Y \mapsto (k \to Y)$. -/
@[export_typescript /-- An exponent functor, which maps every type to the functions from the
    exponent into the type. -/
  (k := "Exponent")]
abbrev exponentFunctor := @CategoryTheory.coyoneda

attribute [cite "CategoryTheory.coyoneda" mathlibCommunity2020leanMathematicalLibrary]
  exponentFunctor

end Falkara.Simulation
