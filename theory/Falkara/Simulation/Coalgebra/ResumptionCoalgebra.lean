/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.Simulation.Coalgebra.SequenceCoalgebra
public import Falkara.Simulation.Functor.BinaryCoproductFunctor

import Falkara.Counterpart
import Falkara.References

/-!
# Resumption Coalgebra

The module defines the resumption coalgebras, the coalgebras of the binary coproducts of a type of
results with the binary products of a type of outputs, which give from every state either a result
or an output and the next state, the sequence coalgebra that a resumption coalgebra runs as once it
leaves its result out, and their behavior and their steps, which the sequence coalgebra gives.

## Implementation Notes

Jacobs gives the functor no name. The coalgebra cites the section of the sequence coalgebras, whose
functor $1 + (A \times X)$ is the case of the type with one value as the type of results, as
Section 2.2.2 replaces that type by another type $B$ only for trees, whose behavior trees end in
values of $B$. The module names the coalgebras after the coinductive resumptions of Piróg and
Gibbons, the final coalgebras of the functors $X \mapsto B + F X$, of which the functor of the
binary products with the outputs gives the finite and the infinite sequences of outputs that end in
a result where they end.

The result of a resumption coalgebra takes the type parameter `Done` in TypeScript, as Effect names
the value that a channel ends with, and the step takes `Result.Result` of Effect, which succeeds
with an output and the next state and fails with the result, as a coalgebra of the functor either
goes on or ends. The behavior and the steps leave the result out, as Mathlib has no final coalgebra
of the functor, and are those of the sequence coalgebra that the transformation of the coproducts
into the options gives, which keeps every value that goes on and forgets every result. The module
of the package gives besides the channel of Effect at a state, which emits the outputs and ends with
the result.

The coalgebra gives its step in a lawful monad, the identity monad `Id` unless a monad is given, as
`StreamCoalgebra` does, so that a step may take an effect, such as one of `EffectFunctor`.
-/

@[expose] public section

namespace Falkara.Simulation

universe u

/-- A resumption coalgebra, which gives from every state either a result or an output and the next
state in a monad. -/
@[counterpart Jacobs.introductionToCoalgebra "Section 2.2.1"
  typescript
    r"A resumption coalgebra, which gives from every state either a result or an output and the next
    state in a monad."
    (m → "Monad")]
abbrev ResumptionCoalgebra (Output Done : Type u) (m : Type u → Type u := Id) [Monad m]
    [LawfulMonad m] :=
  CategoryTheory.Endofunctor.Coalgebra
    (Functor.comp (Functor.comp (binaryProductFunctor.obj Output) (binaryCoproductFunctor Done))
      (CategoryTheory.ofTypeFunctor m))

/-- The sequence coalgebra that a resumption coalgebra runs as without its result, which gives
nothing where the resumption coalgebra gives a result, upon the state space of the coalgebra. -/
@[counterpart
  typescript
    r"The sequence coalgebra that a resumption coalgebra runs as without its result, which gives
    nothing where the resumption coalgebra gives a result, upon the state space of the coalgebra."]
def ResumptionCoalgebra.toSequenceCoalgebra {Output Done : Type u}
    (coalgebra : ResumptionCoalgebra Output Done) : SequenceCoalgebra Output where
  V := coalgebra.V
  str := TypeCat.ofHom fun state ↦
    (coalgebra.str state : Done ⊕ (Output × coalgebra.V)).getRight?

/-- The behavior of a resumption coalgebra, which gives from every state the sequence of the outputs
that the coalgebra gives from the state on until it gives a result. -/
@[counterpart Jacobs.introductionToCoalgebra "Definition 2.3.1"
  typescript
    r"The behavior of a resumption coalgebra, which gives from every state the sequence of the
    outputs that the coalgebra gives from the state on until it gives a result."]
def ResumptionCoalgebra.behavior {Output Done : Type u}
    (coalgebra : ResumptionCoalgebra Output Done) (state : coalgebra.V) : Stream'.Seq Output :=
  coalgebra.toSequenceCoalgebra.behavior state

/-- The steps of a resumption coalgebra, which gives from every state the sequence of the steps that
the coalgebra takes from the state on until it gives a result, each an output with the next state.
-/
@[counterpart Jacobs.introductionToCoalgebra "Definition 2.3.1"
  typescript
    r"The steps of a resumption coalgebra, which gives from every state the sequence of the steps
    that the coalgebra takes from the state on until it gives a result, each an output with the next
    state."]
def ResumptionCoalgebra.steps {Output Done : Type u}
    (coalgebra : ResumptionCoalgebra Output Done) (state : coalgebra.V) :
    Stream'.Seq ((binaryProductFunctor.obj Output).obj coalgebra.V) :=
  coalgebra.toSequenceCoalgebra.steps state

namespace ResumptionCoalgebra

/-- The behavior of a resumption coalgebra at a state is the sequence of the outputs of its steps.
-/
theorem behavior_eq_map_steps {Output Done : Type u}
    (coalgebra : ResumptionCoalgebra Output Done) (state : coalgebra.V) :
    coalgebra.behavior state = (coalgebra.steps state).map Prod.fst :=
  coalgebra.toSequenceCoalgebra.behavior_eq_map_steps state

end ResumptionCoalgebra

end Falkara.Simulation
