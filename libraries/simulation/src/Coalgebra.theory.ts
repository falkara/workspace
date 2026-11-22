// Written by the generator of the theory from `Falkara.Simulation.Coalgebra`, so every change by hand is lost when the generator runs.

import type { HKT } from 'effect';

/**
 * A coalgebra of an endofunctor, a carrier with a structure morphism into the object to which the endofunctor maps the carrier.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Endofunctor.Coalgebra
 */
export interface Coalgebra<in out F extends HKT.TypeLambda, in out V> {
  /** structure morphism of the coalgebra */
  readonly str: (value: V) => HKT.Kind<F, never, never, never, V>;
}

/**
 * Creates a coalgebra of an endofunctor, a carrier with a structure morphism into the object to which the endofunctor maps the carrier.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Endofunctor.Coalgebra
 */
export const coalgebra = <F extends HKT.TypeLambda, V>(fields: Coalgebra<F, V>): Coalgebra<F, V> =>
  fields;
