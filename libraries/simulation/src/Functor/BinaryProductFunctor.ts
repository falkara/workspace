import * as Functor from '#src/Functor';
import type * as Theory from '#src/Functor/BinaryProductFunctor.theory';

export type { BinaryProductFunctor } from '#src/Functor/BinaryProductFunctor.theory';

/**
 * Gives the `Functor` instance of a `BinaryProductFunctor`.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Limits.Types.binaryProductFunctor
 */
export const functor = <Factor>(): Functor.Functor<Theory.BinaryProductFunctor<Factor>> =>
  Functor.make<Theory.BinaryProductFunctor<Factor>>({
    map: (a) => (value) => [value[0], a(value[1])],
  });
