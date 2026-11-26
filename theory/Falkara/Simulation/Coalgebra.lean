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
-/

public section

namespace Falkara.Simulation

/-- A coalgebra of an endofunctor, a carrier with a structure morphism into the object to which the
endofunctor maps the carrier. -/
@[counterpart Mathlib.library CategoryTheory.Endofunctor.Coalgebra
  typescript
    r"A system that gives from every state its next step, in the shape that its endofunctor sets."
    (F → "Endofunctor")
    (V → "State")
    (str → "structure"
      r"The function that gives the next step of the system from a state.")]
abbrev Coalgebra := @CategoryTheory.Endofunctor.Coalgebra

end Falkara.Simulation
