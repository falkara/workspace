import { Function } from 'effect';

import { functor, type Functor } from '#src/Functor';
import type * as Theory from '#src/Functor/Coyoneda.theory';

export type { Coyoneda } from '#src/Functor/Coyoneda.theory';

/**
 * Gives the `Functor` instance of a `Coyoneda`.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.coyoneda
 */
export const coyoneda = <Exponent>(): Functor<Theory.Coyoneda<Exponent>> =>
  functor<Theory.Coyoneda<Exponent>>({ map: (a) => (value) => Function.flow(value, a) });
