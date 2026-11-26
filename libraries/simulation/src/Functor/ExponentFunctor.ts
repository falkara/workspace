import { Function } from 'effect';

import * as Functor from '#src/Functor';
import type * as Theory from '#src/Functor/ExponentFunctor.theory';

export type { ExponentFunctor } from '#src/Functor/ExponentFunctor.theory';

/**
 * Gives the instance of an exponent functor, which maps the result of a function.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.coyoneda
 */
export const functor = <Exponent>(): Functor.Functor<Theory.ExponentFunctor<Exponent>> =>
  Functor.make<Theory.ExponentFunctor<Exponent>>({
    map: (a) => (value) => Function.flow(value, a),
  });
