import type { HKT } from 'effect';
import { functor, type Functor } from '#src/Functor';
import type * as Theory from '#src/FunctorComp.theory';

export type { FunctorComp } from '#src/FunctorComp.theory';

/**
 * Gives the composite of two functors, which applies the functor $F$ and then the functor $G$.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.comp
 */
export const functorComp = <F extends HKT.TypeLambda, G extends HKT.TypeLambda>(
  F: Functor<F>,
  G: Functor<G>,
): Functor<Theory.FunctorComp<F, G>> =>
  functor<Theory.FunctorComp<F, G>>({ map: (a) => G.map(F.map(a)) });
