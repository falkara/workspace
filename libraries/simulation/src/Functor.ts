import { Function, type HKT } from 'effect';

import * as Theory from '#src/Functor.theory';

export {
  type Functor,
  functor,
  functorAxioms,
  type FunctorComp,
  type FunctorConst,
} from '#src/Functor.theory';

/**
 * Gives the `Functor` instance of a `FunctorComp`.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.comp
 */
export const functorComp = <
  FirstEndofunctor extends HKT.TypeLambda,
  SecondEndofunctor extends HKT.TypeLambda,
>(
  firstEndofunctor: Theory.Functor<FirstEndofunctor>,
  secondEndofunctor: Theory.Functor<SecondEndofunctor>,
): Theory.Functor<Theory.FunctorComp<FirstEndofunctor, SecondEndofunctor>> =>
  Theory.functor<Theory.FunctorComp<FirstEndofunctor, SecondEndofunctor>>({
    map: (a) => secondEndofunctor.map(firstEndofunctor.map(a)),
  });

/**
 * Gives the `Functor` instance of a `FunctorConst`.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.const
 */
export const functorConst = <Constant>(): Theory.Functor<Theory.FunctorConst<Constant>> =>
  Theory.functor<Theory.FunctorConst<Constant>>({ map: () => Function.identity });
