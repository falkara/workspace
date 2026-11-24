// Written by the generator of the theory from `Falkara.Simulation.Functor`, so every change by hand is lost when the generator runs.
import { Function, type HKT } from 'effect';

import type * as Module from '#src/Functor';

/**
 * An endofunctor, with its action on objects as its type parameter and its action on morphisms.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor
 */
export interface Functor<
  in out Endofunctor extends HKT.TypeLambda,
> extends HKT.TypeClass<Endofunctor> {
  /** The action of a functor on morphisms. */
  readonly map: <X, Y>(
    f: (x: X) => Y,
  ) => (
    value: HKT.Kind<Endofunctor, never, never, never, X>,
  ) => HKT.Kind<Endofunctor, never, never, never, Y>;
}

/**
 * Creates a `Functor` from its field `map`.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor
 */
export const functor = <Endofunctor extends HKT.TypeLambda>(fields: Functor<Endofunctor>) => fields;

/**
 * Gives the axioms of a `Functor` as predicates of an instance.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor
 */
export const functorAxioms = <Endofunctor extends HKT.TypeLambda>(
  instance: Functor<Endofunctor>,
  equivalence: <X>(
    self: HKT.Kind<Endofunctor, never, never, never, X>,
    that: HKT.Kind<Endofunctor, never, never, never, X>,
  ) => boolean,
) => ({
  /** The predicate that tells whether the instance preserves identity morphisms. */
  map_id: <X>(value: HKT.Kind<Endofunctor, never, never, never, X>): boolean =>
    equivalence<X>(
      instance.map<X, X>(Function.identity<X>)(value),
      (Function.identity<HKT.Kind<Endofunctor, never, never, never, X>>)(value),
    ),
  /** The predicate that tells whether the instance preserves composition. */
  map_comp: <X, Y, Z>(
    f: (x: X) => Y,
    g: (y: Y) => Z,
    value: HKT.Kind<Endofunctor, never, never, never, X>,
  ): boolean =>
    equivalence<Z>(
      instance.map<X, Z>(Function.flow(f, g))(value),
      Function.flow(instance.map<X, Y>(f), instance.map<Y, Z>(g))(value),
    ),
});

/**
 * A composite of two endofunctors, which applies the first endofunctor and then the second endofunctor.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.comp
 */
export interface FunctorComp<
  in out FirstEndofunctor extends HKT.TypeLambda,
  out SecondEndofunctor extends HKT.TypeLambda,
>
  extends HKT.TypeLambda {
  readonly type: HKT.Kind<
    SecondEndofunctor,
    never,
    never,
    never,
    HKT.Kind<FirstEndofunctor, never, never, never, this['Target']>
  >;
}

/**
 * A constant functor, which maps every type to the constant.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.const
 */
export interface FunctorConst<out Constant> extends HKT.TypeLambda {
  readonly type: Constant;
}

/** A contract of the functions of the theory that the module `Functor` of the package implements. */
interface Contract {
  /**
   * Gives the `Functor` instance of a `FunctorComp`.
   *
   * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.comp
   */
  readonly functorComp: <
    FirstEndofunctor extends HKT.TypeLambda,
    SecondEndofunctor extends HKT.TypeLambda,
  >(
    firstEndofunctor: Functor<FirstEndofunctor>,
    secondEndofunctor: Functor<SecondEndofunctor>,
  ) => Functor<FunctorComp<FirstEndofunctor, SecondEndofunctor>>;
  /**
   * Gives the `Functor` instance of a `FunctorConst`.
   *
   * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor.const
   */
  readonly functorConst: <Constant>() => Functor<FunctorConst<Constant>>;
}

/** A check of the module `Functor` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
