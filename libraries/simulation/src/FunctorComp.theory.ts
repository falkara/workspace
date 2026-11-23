// Written by the generator of the theory from `Falkara.Simulation.FunctorComp`, so every change by hand is lost when the generator runs.

import type { HKT } from 'effect';

import type { Functor } from '#src/Functor.theory';
import type * as Module from '#src/FunctorComp';

/**
 * The composite of two functors, which applies the functor $F$ and then the functor $G$.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.comp
 */
export interface FunctorComp<in out F extends HKT.TypeLambda, in out G extends HKT.TypeLambda>
  extends HKT.TypeLambda {
  readonly type: HKT.Kind<G, never, never, never, HKT.Kind<F, never, never, never, this['Target']>>;
}

/** The functions of the theory that the module `FunctorComp` of the package implements. */
interface Contract {
  /**
   * Gives the composite of two functors, which applies the functor $F$ and then the functor $G$.
   *
   * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.comp
   */
  readonly functorComp: <F extends HKT.TypeLambda, G extends HKT.TypeLambda>(
    F: Functor<F>,
    G: Functor<G>,
  ) => Functor<FunctorComp<F, G>>;
}

/** The module `FunctorComp` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
