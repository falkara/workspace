// Written by the generator of the theory from `Falkara.Simulation.FunctorComp`, so every change by hand is lost when the generator runs.
import type { HKT } from 'effect';

import type { Functor } from '#src/Functor.theory';
import type * as Module from '#src/FunctorComp';

/**
 * A composite of two endofunctors, which applies the first endofunctor and then the second endofunctor.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.comp
 */
export interface FunctorComp<
  in out FirstEndofunctor extends HKT.TypeLambda,
  out SecondEndofunctor extends HKT.TypeLambda,
>
  extends HKT.TypeLambda {
  readonly type: HKT.Kind<
    SecondEndofunctor,
    never,
    never,
    never,
    HKT.Kind<FirstEndofunctor, never, never, never, this['Target']>
  >;
}

/** A contract of the functions of the theory that the module `FunctorComp` of the package implements. */
interface Contract {
  /**
   * Gives the `Functor` instance of a `FunctorComp`.
   *
   * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.comp
   */
  readonly functorComp: <
    FirstEndofunctor extends HKT.TypeLambda,
    SecondEndofunctor extends HKT.TypeLambda,
  >(
    firstEndofunctor: Functor<FirstEndofunctor>,
    secondEndofunctor: Functor<SecondEndofunctor>,
  ) => Functor<FunctorComp<FirstEndofunctor, SecondEndofunctor>>;
}

/** A check of the module `FunctorComp` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
