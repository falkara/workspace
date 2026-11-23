// Written by the generator of the theory from `Falkara.Simulation.BinaryProductFunctor`, so every change by hand is lost when the generator runs.

import type { HKT } from 'effect';

import type { Functor } from '#src/Functor.theory';
import type * as Module from '#src/BinaryProductFunctor';

/**
 * The curried functor of binary products, which maps every type $X$ to the functor $Y \mapsto X \times Y$.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Limits.Types.binaryProductFunctor
 */
export interface BinaryProductFunctor<out X> extends HKT.TypeLambda {
  readonly type: readonly [X, this['Target']];
}

/** The functions of the theory that the module `BinaryProductFunctor` of the package implements. */
interface Contract {
  /**
   * Gives the curried functor of binary products, which maps every type $X$ to the functor $Y \mapsto X \times Y$.
   *
   * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Limits.Types.binaryProductFunctor
   */
  readonly binaryProductFunctor: <X>() => Functor<BinaryProductFunctor<X>>;
}

/** The module `BinaryProductFunctor` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
