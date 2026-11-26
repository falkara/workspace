module

public import GeneratorTest.Fixture.Clock
public import Mathlib.Data.Stream.Defs

import Falkara.Counterpart

/-!
# Carillon

The module defines a bundled structure with a type constructor as a parameter that the checks of
the generator write, a carillon, which is a coalgebra of the gear train of the module `Clock` of the
functor of the chimes and the functor of a lawful monad, the identity monad `Id` unless a monad is
given, and which extends the clockwork of that module, the resting functor, the identity functor
of Mathlib as it stands, which labels the identity monad, a belfry, a type constructor that the
checks write as a type lambda of an effect of Effect, a function of a carillon at the identity
monad, whose stream holds objects of the functor of the chimes, a function of two carillons into a
carillon whose state space its definition gives, and a function whose stream holds coproducts of
the type with one value and the chimes.

## Main Definitions

- `restingFunctor`: the resting functor, which moves no state.
- `Belfry`: a belfry, the monad of the peals that read a rope and either fail with a crack or ring.
- `Carillon`: a carillon that rings a chime and moves to its next state in a monad.
- `Carillon.rounds`: the rounds of a carillon, every chime that it rings with the next state.
- `Carillon.pair`: the carillon that rings two carillons side by side.
- `Carillon.tolls`: the tolls of a carillon, a pause before every chime.
-/

@[expose] public section

namespace Geometry

universe u

/-- The resting functor, which moves no state. -/
abbrev restingFunctor := @CategoryTheory.Functor.id

/-- A belfry, the monad of the peals that read a rope of type `R` and either fail with a crack of
type `E` or ring. -/
abbrev Belfry (E R : Type u) : Type u → Type u :=
  ReaderT R (Except E)

/-- A carillon that rings a chime and moves to its next state in a monad. -/
abbrev Carillon (B : Type u) (m : Type u → Type u := Id) [Monad m] [LawfulMonad m] :=
  CategoryTheory.Endofunctor.Coalgebra
    (GearTrain (chimesFunctor.obj B) (CategoryTheory.ofTypeFunctor m))

/-- The rounds of a carillon, every chime that it rings with the next state. -/
def Carillon.rounds {B : Type u} (carillon : Carillon B) (state : carillon.V) :
    Stream' ((chimesFunctor.obj B).obj carillon.V) :=
  Stream'.corec' (fun current ↦
    let step : B × carillon.V := carillon.str current
    (step, step.2)) state

/-- The carillon that rings two carillons side by side and keeps the chime of the first after a
choice, upon the pairs of their states. -/
def Carillon.pair {B : Type u} (first second : Carillon B) (choice : (chime : B) → B) :
    Carillon B where
  V := first.V × second.V
  str := TypeCat.ofHom fun (firstState, secondState) ↦
    let firstStep : B × first.V := first.str firstState
    let secondStep : B × second.V := second.str secondState
    (choice firstStep.1, firstStep.2, secondStep.2)

/-- The tolls of a carillon, a pause before every chime that it rings. -/
def Carillon.tolls {B : Type u} (carillon : Carillon B) (state : carillon.V) :
    Stream' (PUnit ⊕ B) :=
  (carillon.rounds state).map fun round ↦ .inr round.1

attribute [counterpart
  typescript
    r"The resting functor, which moves no state."] restingFunctor

attribute [counterpart
  typescript
    r"A belfry, the monad of the peals that read a rope of type `R` and either fail with a crack of
    type `E` or ring."] Belfry

attribute [counterpart
  typescript
    r"A carillon that rings a chime and moves to its next state in a monad."] Carillon

attribute [counterpart
  typescript
    r"The rounds of a carillon, every chime that it rings with the next state."] Carillon.rounds

attribute [counterpart
  typescript
    r"The carillon that rings two carillons side by side and keeps the chime of the first after a
    choice, upon the pairs of their states."] Carillon.pair

attribute [counterpart
  typescript
    r"The tolls of a carillon, a pause before every chime that it rings."] Carillon.tolls

end Geometry
