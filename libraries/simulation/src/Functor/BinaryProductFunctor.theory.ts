// Written by the generator of the theory from `Falkara.Simulation.Functor.BinaryProductFunctor`, so every change by hand is lost when the generator runs.
import type { HKT } from 'effect';

import type * as Functor from '#src/Functor.theory';
import type * as Module from '#src/Functor/BinaryProductFunctor';

/** A binary product of an output and the next state, which a coalgebra of the functor gives from every state. */
export interface Product<out Output, out Next> {
  /** The output that the coalgebra gives from the state. */
  readonly output: Output;
  /** The state that follows the state. */
  readonly next: Next;
}

/**
 * A functor of binary products, which maps every type to its binary product with the factor.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Limits.Types.binaryProductFunctor
 */
export interface BinaryProductFunctor<out Factor> extends HKT.TypeLambda {
  readonly type: Product<Factor, this['Target']>;
}

/** A contract of the functions of the theory that the module `Functor/BinaryProductFunctor` of the package implements. */
interface Contract {
  /**
   * Gives the instance of a functor of binary products, which maps the next state of a product.
   *
   * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Limits.Types.binaryProductFunctor
   */
  readonly functor: <Factor>() => Functor.Functor<BinaryProductFunctor<Factor>>;
}

/** A check of the module `Functor/BinaryProductFunctor` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
