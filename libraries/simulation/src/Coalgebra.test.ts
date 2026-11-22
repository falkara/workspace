import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Option } from 'effect';
import * as Coalgebra from '#src/Coalgebra';

describe('Coalgebra', () => {
  it('makes the structure morphism give what the endofunctor makes of the carrier', () => {
    const countdown = Coalgebra.coalgebra<Option.OptionTypeLambda, number>({
      str: (value) => (value > 0 ? Option.some(value - 1) : Option.none()),
    });
    expectTypeOf(countdown.str).returns.toEqualTypeOf<Option.Option<number>>();
    expect(countdown.str(1)).toStrictEqual(Option.some(0));
    expect(countdown.str(0)).toStrictEqual(Option.none());
  });
});
