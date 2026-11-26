/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

import Falkara.Counterpart
import Falkara.References

/-!
# Effect Functor

The module defines the effect functor, the monad of the computations that read requirements of a
type `R` and either fail with a failure of a type `E` or give a value, as the monad transformer
`ReaderT` of Lean over the monad of exceptions `Except` states it.

## Implementation Notes

The effect functor takes in TypeScript the type lambda whose type is `Effect.Effect` of Effect,
which takes the value, the failure, and the requirements in that order, as an effect of Effect
describes a computation that needs its requirements and either fails or succeeds. The theory states
such a computation as a function of its requirements, which runs at once, whereas an effect of
Effect may also wait, which the theory leaves out, as the laws of the monad hold alike.

The failure and the requirements take the type parameters `E` and `R` in TypeScript, as Effect names
them. They vary in TypeScript with the effect, as `Effect.Effect` declares them, whereas the theory
reads its requirements.
-/

public section

namespace Falkara.Simulation

universe u

/-- The effect functor, the monad of the computations that read requirements of type `R` and either
fail with a failure of type `E` or give a value. -/
@[counterpart Mathlib.library ReaderT
  typescript
    r"An effect functor, which maps every type to the effects that need the requirements and either
    fail with the failure or succeed with a value of the type."]
abbrev EffectFunctor (E R : Type u) : Type u → Type u :=
  ReaderT R (Except E)

end Falkara.Simulation
