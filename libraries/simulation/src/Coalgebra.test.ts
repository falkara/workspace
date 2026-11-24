import { describe, expectTypeOf, it } from '@effect/vitest';
import { type HKT, Option } from 'effect';

import * as Coalgebra from '#src/Coalgebra';

describe('Coalgebra', () => {
  it('infers the state space from the coalgebra structure and gives it the form of the endofunctor', () => {
    const countdown = Coalgebra.coalgebra<Option.OptionTypeLambda>()({
      structure: (state: number) => (state > 0 ? Option.some(state - 1) : Option.none()),
    });

    expectTypeOf(countdown).toEqualTypeOf<Coalgebra.Coalgebra<Option.OptionTypeLambda, number>>();
    expectTypeOf(countdown.structure).returns.toEqualTypeOf<Option.Option<number>>();
  });

  it('refuses a coalgebra structure that gives another form than the endofunctor', () => {
    Coalgebra.coalgebra<Option.OptionTypeLambda>()({
      // @ts-expect-error The coalgebra structure gives an option of the state.
      structure: (state: number) => state,
    });
  });

  it('is a coalgebra of every functor that a natural transformation from its functor reaches', () => {
    /** A functor of the options and the arrays, which every option is included in. */
    interface OptionOrArray extends HKT.TypeLambda {
      readonly type: Option.Option<this['Target']> | ReadonlyArray<this['Target']>;
    }

    expectTypeOf<Coalgebra.Coalgebra<Option.OptionTypeLambda, number>>().toExtend<
      Coalgebra.Coalgebra<OptionOrArray, number>
    >();
    expectTypeOf<Coalgebra.Coalgebra<OptionOrArray, number>>().not.toExtend<
      Coalgebra.Coalgebra<Option.OptionTypeLambda, number>
    >();
  });

  it('is a coalgebra of its state space alone', () => {
    expectTypeOf<Coalgebra.Coalgebra<Option.OptionTypeLambda, 1 | 2>>().not.toExtend<
      Coalgebra.Coalgebra<Option.OptionTypeLambda, number>
    >();
    expectTypeOf<Coalgebra.Coalgebra<Option.OptionTypeLambda, number>>().not.toExtend<
      Coalgebra.Coalgebra<Option.OptionTypeLambda, 1 | 2>
    >();
  });
});
