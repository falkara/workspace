import { Function } from 'effect';
import { functor, type Functor } from '#src/Functor';
import type * as Theory from '#src/FunctorConst.theory';

export type { FunctorConst } from '#src/FunctorConst.theory';

/**
 * Gives the curried functor of constant functors, which maps every type $X$ to the functor $Y \mapsto X$.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.const
 */
export const functorConst = <X>(): Functor<Theory.FunctorConst<X>> =>
  functor<Theory.FunctorConst<X>>({ map: () => Function.identity });
