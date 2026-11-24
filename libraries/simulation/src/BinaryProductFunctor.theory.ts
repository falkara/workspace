// Written by the generator of the theory from `Falkara.Simulation.BinaryProductFunctor`, so every change by hand is lost when the generator runs.
import type { HKT } from 'effect';

import type * as Module from '#src/BinaryProductFunctor';
import type { Functor } from '#src/Functor.theory';

/**
 * A functor of binary products, which maps every type to its binary product with the factor.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Limits.Types.binaryProductFunctor
 */
export interface BinaryProductFunctor<out Factor> extends HKT.TypeLambda {
  readonly type: readonly [Factor, this['Target']];
}

/** A contract of the functions of the theory that the module `BinaryProductFunctor` of the package implements. */
interface Contract {
  /**
   * Gives the `Functor` instance of a `BinaryProductFunctor`.
   *
   * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Limits.Types.binaryProductFunctor
   */
  readonly binaryProductFunctor: <Factor>() => Functor<BinaryProductFunctor<Factor>>;
}

/** A check of the module `BinaryProductFunctor` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
