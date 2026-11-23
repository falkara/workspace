import { Function } from 'effect';
import { functor, type Functor } from '#src/Functor';
import type * as Theory from '#src/FunctorConst.theory';

/**
 * The curried functor of constant functors, which maps every type $X$ to the functor $Y \mapsto X$.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.const
 */
export type FunctorConst<X> = Theory.FunctorConst<X>;

/**
 * Gives the curried functor of constant functors, which maps every type $X$ to the functor $Y \mapsto X$.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.const
 */
export const functorConst = <X>(): Functor<FunctorConst<X>> =>
  functor<FunctorConst<X>>({ map: () => Function.identity });
