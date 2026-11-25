import { describe, expectTypeOf, it } from '@effect/vitest';
import { type HKT, Option } from 'effect';

import * as Coalgebra from '#src/Coalgebra';

describe('Coalgebra', () => {
  it('takes the coalgebra structure from the state space into the form of the endofunctor', () => {
    const system = Coalgebra.make<Option.OptionTypeLambda, number>({
      structure: (state) => (state > 0 ? Option.some(state - 1) : Option.none()),
    });

    expectTypeOf(system.structure).parameter(0).toEqualTypeOf<number>();
    expectTypeOf(system.structure).returns.toEqualTypeOf<Option.Option<number>>();
  });

  it('refuses a coalgebra structure that gives another form than the endofunctor', () => {
    Coalgebra.make<Option.OptionTypeLambda, number>({
      // @ts-expect-error The coalgebra structure gives an option of the state.
      structure: (state) => state,
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
