import { describe, expectTypeOf, it } from '@effect/vitest';
import { Effect, Equal, Schema } from 'effect';

import * as Coalgebra from '#src/Coalgebra';
import * as Functor from '#src/Functor';
import * as EffectFunctor from '#src/Functor/EffectFunctor';

/** The axioms of the functor of the effects that fail with a string, with two effects equal where they end with equal exits. */
const axioms = Functor.axioms(EffectFunctor.functor<string, never>(), (self, that) =>
  Equal.equals(Effect.runSyncExit(self), Effect.runSyncExit(that)),
);

describe('EffectFunctor', () => {
  it('gives the coalgebra structure of a coalgebra an effect of the next state', () => {
    const system = Coalgebra.make(EffectFunctor.functor<string, never>())({
      structure: (state: number) =>
        state > 0 ? Effect.succeed(state - 1) : Effect.fail('Exhausted'),
    });

    expectTypeOf(system.structure).returns.toEqualTypeOf<Effect.Effect<number, string>>();
  });

  it.prop(
    'keeps the identity',
    [Schema.Finite, Schema.String, Schema.Boolean],
    ([value, failure, succeeds]) =>
      axioms.map_id(succeeds ? Effect.succeed(value) : Effect.fail(failure)),
  );

  it.prop(
    'keeps the composition',
    [Schema.Finite, Schema.String, Schema.Boolean],
    ([value, failure, succeeds]) =>
      axioms.map_comp(
        (number: number) => number + 1,
        (number: number) => `${number}`,
        succeeds ? Effect.succeed(value) : Effect.fail(failure),
      ),
  );
});
