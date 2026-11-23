import type { HKT } from 'effect';
import { functor, type Functor } from '#src/Functor';
import type * as Theory from '#src/FunctorComp.theory';

/**
 * The composite of two functors, which applies the functor $F$ and then the functor $G$.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.comp
 */
export type FunctorComp<F extends HKT.TypeLambda, G extends HKT.TypeLambda> = Theory.FunctorComp<
  F,
  G
>;

/**
 * Gives the composite of two functors, which applies the functor $F$ and then the functor $G$.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.comp
 */
export const functorComp = <F extends HKT.TypeLambda, G extends HKT.TypeLambda>(
  F: Functor<F>,
  G: Functor<G>,
): Functor<FunctorComp<F, G>> => functor<FunctorComp<F, G>>({ map: (a) => G.map(F.map(a)) });
