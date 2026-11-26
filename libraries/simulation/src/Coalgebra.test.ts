import { describe, expectTypeOf, it } from '@effect/vitest';
import { type HKT, Option } from 'effect';

import * as Coalgebra from '#src/Coalgebra';
import * as Functor from '#src/Functor';

/** The functor of the options of Effect, which takes the action on morphisms that Effect gives. */
const option = Functor.make<Option.OptionTypeLambda>({ map: Option.map });

describe('Coalgebra', () => {
  it('takes the coalgebra structure from the state space into the form of the endofunctor', () => {
    const system = Coalgebra.make(option)({
      structure: (state: number) => (state > 0 ? Option.some(state - 1) : Option.none()),
    });

    expectTypeOf(system.structure).parameter(0).toEqualTypeOf<number>();
    expectTypeOf(system.structure).returns.toEqualTypeOf<Option.Option<number>>();
  });

  it('refuses a coalgebra structure that gives another form than the endofunctor', () => {
    Coalgebra.make(option)({
      // @ts-expect-error The coalgebra structure gives an option of the state.
      structure: (state: number) => state,
    });
  });

  it('is covariant in its endofunctor, as a coalgebra of a functor is one of every functor that includes it', () => {
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
});
