import type { HKT } from 'effect';

import { functor, type Functor } from '#src/Functor';
import type * as Theory from '#src/FunctorComp.theory';

export type { FunctorComp } from '#src/FunctorComp.theory';

/**
 * Gives the `Functor` instance of a `FunctorComp`.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.comp
 */
export const functorComp = <
  FirstEndofunctor extends HKT.TypeLambda,
  SecondEndofunctor extends HKT.TypeLambda,
>(
  firstEndofunctor: Functor<FirstEndofunctor>,
  secondEndofunctor: Functor<SecondEndofunctor>,
): Functor<Theory.FunctorComp<FirstEndofunctor, SecondEndofunctor>> =>
  functor<Theory.FunctorComp<FirstEndofunctor, SecondEndofunctor>>({
    map: (a) => secondEndofunctor.map(firstEndofunctor.map(a)),
  });
