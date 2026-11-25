import { Effect } from 'effect';

import * as Functor from '#src/Functor';
import type * as Theory from '#src/Functor/EffectFunctor.theory';

export type { EffectFunctor } from '#src/Functor/EffectFunctor.theory';

/**
 * Gives the `Functor` instance of an `EffectFunctor`.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/ReaderT
 */
export const functor = <E, R>(): Functor.Functor<Theory.EffectFunctor<E, R>> =>
  Functor.make<Theory.EffectFunctor<E, R>>({ map: (f) => Effect.map(f) });
