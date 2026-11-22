import type { HKT } from 'effect';
import * as Theory from '#src/Coalgebra.theory';

/**
 * A coalgebra of an endofunctor, a carrier with a structure morphism into the object to which the endofunctor maps the carrier.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Endofunctor.Coalgebra
 */
export type Coalgebra<F extends HKT.TypeLambda, V> = Theory.Coalgebra<F, V>;

/**
 * Creates a coalgebra of an endofunctor, a carrier with a structure morphism into the object to which the endofunctor maps the carrier.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Endofunctor.Coalgebra
 */
export const coalgebra = Theory.coalgebra;
