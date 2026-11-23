import type * as Theory from '#src/BinaryProductFunctor.theory';
import { functor, type Functor } from '#src/Functor';

export type { BinaryProductFunctor } from '#src/BinaryProductFunctor.theory';

/**
 * Gives the curried functor of binary products, which maps every type $X$ to the functor $Y \mapsto X \times Y$.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Limits.Types.binaryProductFunctor
 */
export const binaryProductFunctor = <X>(): Functor<Theory.BinaryProductFunctor<X>> =>
  functor<Theory.BinaryProductFunctor<X>>({ map: (a) => (value) => [value[0], a(value[1])] });
