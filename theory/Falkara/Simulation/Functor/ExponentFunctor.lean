/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Mathlib.CategoryTheory.Yoneda

import Falkara.Counterpart
import Falkara.References

/-!
# Exponent Functor

The module defines the exponent functor, which maps every type $k$ to the functor
$Y \mapsto (k \to Y)$, the exponent $Y^k$.

## Implementation Notes

The type that the exponent functor maps takes the type parameter `Exponent` in TypeScript, as the
type is the exponent of $Y^k$. The exponent functor takes a documentation comment of the theory in
TypeScript, which writes it as the type of the functor it gives at an exponent, a type whose comment
opens with an article and names the exponent as the type parameter does.
-/

public section

namespace Falkara.Simulation

/-- The exponent functor, which maps every type $k$ to the functor $Y \mapsto (k \to Y)$. -/
@[counterpart Mathlib.library CategoryTheory.coyoneda
  typescript
    r"An exponent functor, which maps every type to the functions from the exponent into the type."
    (k → "Exponent")]
abbrev exponentFunctor := @CategoryTheory.coyoneda

end Falkara.Simulation
