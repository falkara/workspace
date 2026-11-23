import { Function } from 'effect';
import type * as Theory from '#src/Coyoneda.theory';
import { functor, type Functor } from '#src/Functor';

export type { Coyoneda } from '#src/Coyoneda.theory';

/**
 * Gives the coyoneda embedding, which maps every type $k$ to the functor $Y \mapsto (k \to Y)$.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.coyoneda
 */
export const coyoneda = <k>(): Functor<Theory.Coyoneda<k>> =>
  functor<Theory.Coyoneda<k>>({ map: (a) => (value) => Function.flow(value, a) });
