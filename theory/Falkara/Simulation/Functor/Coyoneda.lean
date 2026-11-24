/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.References -- shake: keep
public import Mathlib.CategoryTheory.Yoneda
import Falkara.ExportTypeScript
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Coyoneda

The module defines the coyoneda embedding as Mathlib [mathlibCommunity2020leanMathematicalLibrary]
states it.

## Main Definitions

- `coyoneda`: the coyoneda embedding.

## Implementation Notes

The type that the coyoneda embedding maps takes the type parameter `Exponent` in TypeScript, as
the functor $Y \mapsto (k \to Y)$ is the exponent $Y^k$ of Jacobs [jacobs2017introductionCoalgebra],
whose exponent the type is. The coyoneda embedding takes a documentation comment of the theory in
TypeScript, which writes it as the type of the functor it gives at an exponent, a type whose comment
opens with an article and names the exponent as the type parameter does.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- The coyoneda embedding, which maps every type $k$ to the functor $Y \mapsto (k \to Y)$. -/
abbrev coyoneda := @CategoryTheory.coyoneda

attribute [cite "CategoryTheory.coyoneda" mathlibCommunity2020leanMathematicalLibrary] coyoneda

/-! ### Export -/

attribute [export_typescript
  "An exponent functor, which maps every type to the functions from the exponent into the type."
  (k := "Exponent")] coyoneda

end Falkara.Simulation
