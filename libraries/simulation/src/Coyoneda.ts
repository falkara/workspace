import { Function } from 'effect';

import type * as Theory from '#src/Coyoneda.theory';
import { functor, type Functor } from '#src/Functor';

export type { Coyoneda } from '#src/Coyoneda.theory';

/**
 * Gives the `Functor` instance of a `Coyoneda`.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.coyoneda
 */
export const coyoneda = <Exponent>(): Functor<Theory.Coyoneda<Exponent>> =>
  functor<Theory.Coyoneda<Exponent>>({ map: (a) => (value) => Function.flow(value, a) });
