import { Result } from 'effect';

import * as Functor from '#src/Functor';
import type * as Theory from '#src/Functor/BinaryCoproductFunctor.theory';

export type { BinaryCoproductFunctor } from '#src/Functor/BinaryCoproductFunctor.theory';

/**
 * Gives the instance of a functor of binary coproducts, which maps the value of a success.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.ofTypeFunctor
 */
export const functor = <Summand>(): Functor.Functor<Theory.BinaryCoproductFunctor<Summand>> =>
  Functor.make<Theory.BinaryCoproductFunctor<Summand>>({ map: (f) => Result.map(f) });
