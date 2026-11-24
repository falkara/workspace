import { Function } from 'effect';

import { functor, type Functor } from '#src/Functor';
import type * as Theory from '#src/FunctorConst.theory';

export type { FunctorConst } from '#src/FunctorConst.theory';

/**
 * Gives the `Functor` instance of a `FunctorConst`.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.const
 */
export const functorConst = <Constant>(): Functor<Theory.FunctorConst<Constant>> =>
  functor<Theory.FunctorConst<Constant>>({ map: () => Function.identity });
