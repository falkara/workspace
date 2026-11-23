import type * as Theory from '#src/BinaryProductFunctor.theory';

/**
 * The curried functor of binary products, which maps every type $X$ to the functor $Y \mapsto X \times Y$.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Limits.Types.binaryProductFunctor
 */
export type BinaryProductFunctor<X> = Theory.BinaryProductFunctor<X>;
