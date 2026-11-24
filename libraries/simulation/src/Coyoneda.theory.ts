// Written by the generator of the theory from `Falkara.Simulation.Coyoneda`, so every change by hand is lost when the generator runs.
import type { HKT } from 'effect';

import type * as Module from '#src/Coyoneda';
import type { Functor } from '#src/Functor.theory';

/**
 * An exponent functor, which maps every type to the functions from the exponent into the type.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.coyoneda
 */
export interface Coyoneda<in Exponent> extends HKT.TypeLambda {
  readonly type: (exponent: Exponent) => this['Target'];
}

/** A contract of the functions of the theory that the module `Coyoneda` of the package implements. */
interface Contract {
  /**
   * Gives the `Functor` instance of a `Coyoneda`.
   *
   * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.coyoneda
   */
  readonly coyoneda: <Exponent>() => Functor<Coyoneda<Exponent>>;
}

/** A check of the module `Coyoneda` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
