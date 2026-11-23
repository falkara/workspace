import type { HKT } from 'effect';
import * as Theory from '#src/Functor.theory';

/**
 * A functor between categories, with its action on objects and its action on morphisms.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor
 */
export type Functor<F extends HKT.TypeLambda> = Theory.Functor<F>;

/**
 * Creates a functor between categories, with its action on objects and its action on morphisms.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor
 */
export const functor = Theory.functor;

/**
 * Gives the axioms of a functor between categories, with its action on objects and its action on morphisms.
 *
 * @see https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor
 */
export const functorAxioms = Theory.functorAxioms;
