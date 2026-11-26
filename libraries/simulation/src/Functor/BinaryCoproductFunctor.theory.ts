// Written by the generator of the theory from `Falkara.Simulation.Functor.BinaryCoproductFunctor`, so every change by hand is lost when the generator runs.
import type { HKT, Result } from 'effect';

import type * as Functor from '#src/Functor.theory';
import type * as Module from '#src/Functor/BinaryCoproductFunctor';

/**
 * A functor of binary coproducts, which maps every type to its binary coproduct with the summand.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.ofTypeFunctor
 */
export interface BinaryCoproductFunctor<out Summand> extends HKT.TypeLambda {
  readonly type: Result.Result<this['Target'], Summand>;
}

/** A contract of the functions of the theory that the module `Functor/BinaryCoproductFunctor` of the package implements. */
interface Contract {
  /**
   * Gives the instance of a functor of binary coproducts, which maps the value of a success.
   *
   * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.ofTypeFunctor
   */
  readonly functor: <Summand>() => Functor.Functor<BinaryCoproductFunctor<Summand>>;
}

/** A check of the module `Functor/BinaryCoproductFunctor` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
