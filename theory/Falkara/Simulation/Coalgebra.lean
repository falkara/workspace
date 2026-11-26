/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Mathlib.CategoryTheory.Endofunctor.Algebra

import Falkara.Counterpart
import Falkara.References

/-!
# Coalgebra

The module defines the coalgebras of an endofunctor.

## Main Definitions

- `Coalgebra`: a coalgebra of an endofunctor.
-/

public section

namespace Falkara.Simulation

/-- A coalgebra of an endofunctor, a carrier with a structure morphism into the object to which the
endofunctor maps the carrier. -/
@[counterpart Mathlib.library CategoryTheory.Endofunctor.Coalgebra
  typescript
    r"A coalgebra, a state space together with a coalgebra structure on it."
    (F → "Endofunctor")
    (V → "State")
    (str → "structure"
      r"The coalgebra structure on the state space.")]
abbrev Coalgebra := @CategoryTheory.Endofunctor.Coalgebra

end Falkara.Simulation
