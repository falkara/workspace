// Written by the generator of the theory from `Falkara.Simulation.Coyoneda`, so every change by hand is lost when the generator runs.

import type { HKT } from 'effect';

import type { Functor } from '#src/Functor.theory';
import type * as Module from '#src/Coyoneda';

/**
 * The coyoneda embedding, which maps every type $k$ to the functor $Y \mapsto (k \to Y)$.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.coyoneda
 */
export interface Coyoneda<in k> extends HKT.TypeLambda {
  readonly type: (value: k) => this['Target'];
}

/** The functions of the theory that the module `Coyoneda` of the package implements. */
interface Contract {
  /**
   * Gives the coyoneda embedding, which maps every type $k$ to the functor $Y \mapsto (k \to Y)$.
   *
   * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.coyoneda
   */
  readonly coyoneda: <k>() => Functor<Coyoneda<k>>;
}

/** The module `Coyoneda` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
