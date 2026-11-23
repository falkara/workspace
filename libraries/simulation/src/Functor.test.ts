import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import type { HKT } from 'effect';
import * as Functor from '#src/Functor';

/** A type lambda of the choices of a state, the states that may follow it. */
interface ChoicesTypeLambda extends HKT.TypeLambda {
  readonly type: ReadonlyArray<this['Target']>;
}

describe('Functor', () => {
  it('makes a functor of a type lambda that a consumer brings', () => {
    const choices = Functor.functor<ChoicesTypeLambda>({ map: (a, value) => value.map(a) });
    expectTypeOf(choices.map<number, string>).returns.toEqualTypeOf<ReadonlyArray<string>>();
    expect(choices.map((room: number) => `${room}`, [1, 2])).toStrictEqual(['1', '2']);
  });
});
