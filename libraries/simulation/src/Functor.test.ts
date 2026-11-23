import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { type HKT, Schema } from 'effect';
import * as Functor from '#src/Functor';

/** A type lambda of the choices of a state, the states that may follow it. */
interface ChoicesTypeLambda extends HKT.TypeLambda {
  readonly type: ReadonlyArray<this['Target']>;
}

/** The functor of the choices that a consumer brings. */
const choices = Functor.functor<ChoicesTypeLambda>({ map: (a) => (value) => value.map(a) });

/** The axioms of the functor of the choices, with the choices equal where they hold equal states. */
const axioms = Functor.functorAxioms(
  choices,
  (self, that) =>
    self.length === that.length && self.every((state, index) => state === that[index]),
);

describe('Functor', () => {
  it('makes a functor of a type lambda that a consumer brings', () => {
    expectTypeOf(choices.map((room: number) => `${room}`)).returns.toEqualTypeOf<
      ReadonlyArray<string>
    >();
    expect(choices.map((room: number) => `${room}`)([1, 2])).toStrictEqual(['1', '2']);
  });

  it.prop(
    'keeps the identity of the functor of the choices',
    [Schema.Array(Schema.Finite)],
    ([rooms]) => axioms.map_id(rooms),
  );

  it.prop(
    'keeps the composition of the functor of the choices',
    [Schema.Array(Schema.Finite)],
    ([rooms]) =>
      axioms.map_comp(
        (room: number) => room + 1,
        (room: number) => `${room}`,
        rooms,
      ),
  );
});
