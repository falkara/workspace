import { describe, expectTypeOf, it } from '@effect/vitest';
import { Equal, Result, Schema } from 'effect';

import * as Coalgebra from '#src/Coalgebra';
import * as Functor from '#src/Functor';
import * as BinaryCoproductFunctor from '#src/Functor/BinaryCoproductFunctor';

/** The axioms of the functor of binary coproducts with summands in the strings, with two coproducts equal where Effect finds them equal. */
const axioms = Functor.axioms(BinaryCoproductFunctor.functor<string>(), Equal.equals);

describe('BinaryCoproductFunctor', () => {
  it('gives the coalgebra structure of a coalgebra either the next state or a value of the summand', () => {
    const system = Coalgebra.make<BinaryCoproductFunctor.BinaryCoproductFunctor<string>, number>({
      structure: (state) => (state > 0 ? Result.succeed(state - 1) : Result.fail('Done')),
    });

    expectTypeOf(system.structure).returns.toEqualTypeOf<Result.Result<number, string>>();
  });

  it.prop(
    'keeps the identity',
    [Schema.Finite, Schema.String, Schema.Boolean],
    ([value, summand, succeeds]) =>
      axioms.map_id(succeeds ? Result.succeed(value) : Result.fail(summand)),
  );

  it.prop(
    'keeps the composition',
    [Schema.Finite, Schema.String, Schema.Boolean],
    ([value, summand, succeeds]) =>
      axioms.map_comp(
        (number: number) => number + 1,
        (number: number) => `${number}`,
        succeeds ? Result.succeed(value) : Result.fail(summand),
      ),
  );
});
