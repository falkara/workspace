// Written by the generator of the theory from `Falkara.Simulation.FunctorConst`, so every change by hand is lost when the generator runs.

import type { HKT } from 'effect';

import type { Functor } from '#src/Functor.theory';
import type * as Module from '#src/FunctorConst';

/**
 * The curried functor of constant functors, which maps every type $X$ to the functor $Y \mapsto X$.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.const
 */
export interface FunctorConst<out X> extends HKT.TypeLambda {
  readonly type: X;
}

/** The functions of the theory that the module `FunctorConst` of the package implements. */
interface Contract {
  /**
   * Gives the curried functor of constant functors, which maps every type $X$ to the functor $Y \mapsto X$.
   *
   * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.const
   */
  readonly functorConst: <X>() => Functor<FunctorConst<X>>;
}

/** The module `FunctorConst` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
