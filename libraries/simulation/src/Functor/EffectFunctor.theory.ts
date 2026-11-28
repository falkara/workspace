// Written by the translator from `Falkara.Simulation.Functor.EffectFunctor`, so every change by hand is lost when the translator runs.
import type { Effect, HKT } from 'effect';

import type * as Functor from '#src/Functor.theory';
import type * as Module from '#src/Functor/EffectFunctor';

/**
 * An effect functor, which maps every type to the effects that need the requirements and either fail with the failure or succeed with a value of the type.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/ReaderT
 */
export interface EffectFunctor<out E, out R> extends HKT.TypeLambda {
  readonly type: Effect.Effect<this['Target'], E, R>;
}

/** A contract of the functions of the theory that the module `Functor/EffectFunctor` of the package implements. */
interface Contract {
  /**
   * Gives the instance of an effect functor, which maps the value that an effect succeeds with.
   *
   * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/ReaderT
   */
  readonly functor: <E, R>() => Functor.Functor<EffectFunctor<E, R>>;
}

/** A check of the module `Functor/EffectFunctor` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
