// Written by the translator from `Falkara.Simulation.Functor.ExponentFunctor`, so every change by hand is lost when the translator runs.
import type { HKT } from 'effect';

import type * as Functor from '#src/Functor.theory';
import type * as Module from '#src/Functor/ExponentFunctor';

/**
 * An exponent functor, which maps every type to the functions from the exponent into the type.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.coyoneda
 */
export interface ExponentFunctor<in Exponent> extends HKT.TypeLambda {
  readonly type: (exponent: Exponent) => this['Target'];
}

/** A contract of the functions of the theory that the module `Functor/ExponentFunctor` of the package implements. */
interface Contract {
  /**
   * Gives the instance of an exponent functor, which maps the result of a function.
   *
   * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.coyoneda
   */
  readonly functor: <Exponent>() => Functor.Functor<ExponentFunctor<Exponent>>;
}

/** A check of the module `Functor/ExponentFunctor` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
