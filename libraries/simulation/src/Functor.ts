import { Function, type HKT } from 'effect';

import * as Theory from '#src/Functor.theory';

export { axioms, type Comp, type Const, type Functor, type Id, make } from '#src/Functor.theory';

/**
 * Gives the `Functor` instance of a `Functor.Id`.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.id
 */
export const id = (): Theory.Functor<Theory.Id> =>
  Theory.make<Theory.Id>({ map: Function.identity });

/**
 * Gives the `Functor` instance of a `Functor.Comp`.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.comp
 */
export const comp = <
  FirstEndofunctor extends HKT.TypeLambda,
  SecondEndofunctor extends HKT.TypeLambda,
>(
  firstEndofunctor: Theory.Functor<FirstEndofunctor>,
  secondEndofunctor: Theory.Functor<SecondEndofunctor>,
): Theory.Functor<Theory.Comp<FirstEndofunctor, SecondEndofunctor>> =>
  Theory.make<Theory.Comp<FirstEndofunctor, SecondEndofunctor>>({
    map: (a) => secondEndofunctor.map(firstEndofunctor.map(a)),
  });

/**
 * Gives the `Functor` instance of a `Functor.Const`.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.const
 */
const const_ = <Constant>(): Theory.Functor<Theory.Const<Constant>> =>
  Theory.make<Theory.Const<Constant>>({ map: () => Function.identity });

export { const_ as const };
