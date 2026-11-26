import { describe, expectTypeOf, it } from '@effect/vitest';
import { Equal, type HKT, Option, Schema } from 'effect';

import * as Coalgebra from '#src/Coalgebra';
import * as Functor from '#src/Functor';
import * as BinaryProductFunctor from '#src/Functor/BinaryProductFunctor';
import * as ExponentFunctor from '#src/Functor/ExponentFunctor';

/** A type lambda of the choices of a state, the states that may follow it. */
interface ChoicesTypeLambda extends HKT.TypeLambda {
  readonly type: ReadonlyArray<this['Target']>;
}

/** The functor of the choices that a consumer brings. */
const choices = Functor.make<ChoicesTypeLambda>({ map: (a) => (value) => value.map(a) });

/** The axioms of the functor of the choices, with the choices equal where they hold equal states. */
const axioms = Functor.axioms(
  choices,
  (self, that) =>
    self.length === that.length && self.every((state, index) => state === that[index]),
);

/** The functor of the options of Effect, which takes the action on morphisms that Effect gives. */
const option = Functor.make<Option.OptionTypeLambda>({ map: Option.map });

/** The axioms of the functor of the options, with the options equal where Effect tells them equal. */
const optionAxioms = Functor.axioms(option, Equal.equals);

/** The axioms of the functor of the Mealy machines, with two functions equal where they give equal products at an input. */
const mealyAxiomsAt = (input: string) =>
  Functor.axioms(
    Functor.comp(BinaryProductFunctor.functor<string>(), ExponentFunctor.functor<string>()),
    (self, that) =>
      self(input).output === that(input).output && self(input).next === that(input).next,
  );

/** The axioms of the constant functor at the strings, with two strings equal where they are the same. */
const constAxioms = Functor.axioms(Functor.const<string>(), (self, that) => self === that);

describe('Functor', () => {
  it('makes a functor of a type lambda that a consumer brings', () => {
    expectTypeOf(choices.map((room: number) => `${room}`)).returns.toEqualTypeOf<
      ReadonlyArray<string>
    >();
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

  it('makes a functor of a type lambda of Effect', () => {
    expectTypeOf(option.map((room: number) => `${room}`)).returns.toEqualTypeOf<
      Option.Option<string>
    >();
  });

  it.prop(
    'keeps the identity of the functor of the options',
    [Schema.Option(Schema.Finite)],
    ([room]) => optionAxioms.map_id(room),
  );

  it.prop(
    'keeps the composition of the functor of the options',
    [Schema.Option(Schema.Finite)],
    ([room]) =>
      optionAxioms.map_comp(
        (value: number) => value + 1,
        (value: number) => `${value}`,
        room,
      ),
  );
});

describe('Functor.Comp', () => {
  it('gives the coalgebra structure of a coalgebra an output and the next state upon every input', () => {
    /** The functor of the Mealy machines with inputs and outputs in the strings, a function from an input to an output and the next state. */
    const mealy = Functor.comp(
      BinaryProductFunctor.functor<string>(),
      ExponentFunctor.functor<string>(),
    );

    const system = Coalgebra.make(mealy)({
      structure: (state: number) => (input) => ({ output: `${state}`, next: state + input.length }),
    });

    expectTypeOf(system.structure).returns.toEqualTypeOf<
      (input: string) => BinaryProductFunctor.Product<string, number>
    >();
  });

  it.prop('keeps the identity', [Schema.Finite, Schema.String], ([offset, input]) =>
    mealyAxiomsAt(input).map_id((value: string) => ({
      output: value,
      next: value.length + offset,
    })),
  );

  it.prop('keeps the composition', [Schema.Finite, Schema.String], ([offset, input]) =>
    mealyAxiomsAt(input).map_comp(
      (value: number) => value + 1,
      (value: number) => `${value}`,
      (value: string) => ({ output: value, next: value.length + offset }),
    ),
  );
});

describe('Functor.Const', () => {
  it('gives the coalgebra structure of a coalgebra an output and no next state', () => {
    const system = Coalgebra.make(Functor.const<string>())({
      structure: (state: number) => `${state}`,
    });

    expectTypeOf(system.structure).returns.toEqualTypeOf<string>();
  });

  it.prop('keeps the identity', [Schema.String], ([output]) => constAxioms.map_id(output));

  it.prop('keeps the composition', [Schema.String], ([output]) =>
    constAxioms.map_comp(
      (value: number) => value + 1,
      (value: number) => `${value}`,
      output,
    ),
  );
});

describe('Functor.Id', () => {
  /** The axioms of the identity functor, with two values equal where they are the same. */
  const axioms = Functor.axioms(Functor.id(), (self, that) => Object.is(self, that));

  it('gives the coalgebra structure of a coalgebra the next state alone', () => {
    const system = Coalgebra.make(Functor.id())({ structure: (state: number) => state + 1 });

    expectTypeOf(system.structure).returns.toEqualTypeOf<number>();
  });

  it.prop('keeps the identity', [Schema.Finite], ([value]) => axioms.map_id(value));

  it.prop('keeps the composition', [Schema.Finite], ([value]) =>
    axioms.map_comp(
      (number: number) => number + 1,
      (number: number) => `${number}`,
      value,
    ),
  );
});
