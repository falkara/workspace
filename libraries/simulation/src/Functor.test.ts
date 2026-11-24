import { describe, expectTypeOf, it } from '@effect/vitest';
import { Equal, type HKT, Option, Schema } from 'effect';

import * as Coalgebra from '#src/Coalgebra';
import * as Functor from '#src/Functor';
import { type BinaryProductFunctor, binaryProductFunctor } from '#src/Functor/BinaryProductFunctor';
import { type Coyoneda, coyoneda } from '#src/Functor/Coyoneda';

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

/** The functor of the options of Effect, which takes the action on morphisms that Effect gives. */
const option = Functor.functor<Option.OptionTypeLambda>({ map: Option.map });

/** The axioms of the functor of the options, with the options equal where Effect tells them equal. */
const optionAxioms = Functor.functorAxioms(option, Equal.equals);

/** The axioms of the functor of the Mealy machines, with two functions equal where they give equal pairs at an input. */
const mealyAxiomsAt = (input: string) =>
  Functor.functorAxioms(
    Functor.functorComp(binaryProductFunctor<string>(), coyoneda<string>()),
    (self, that) => {
      const [selfOutput, selfState] = self(input);
      const [thatOutput, thatState] = that(input);
      return selfOutput === thatOutput && selfState === thatState;
    },
  );

/** The axioms of the constant functor at the strings, with two strings equal where they are the same. */
const constAxioms = Functor.functorAxioms(
  Functor.functorConst<string>(),
  (self, that) => self === that,
);

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

describe('FunctorComp', () => {
  it('gives the coalgebra structure of a coalgebra an output and the next state upon every input', () => {
    /** A functor of the Mealy machines with inputs and outputs in the strings, a function from an input to an output and the next state. */
    type Mealy = Functor.FunctorComp<BinaryProductFunctor<string>, Coyoneda<string>>;

    const counter = Coalgebra.coalgebra<Mealy>()({
      structure: (state: number) => (input) => [`${state}`, state + input.length],
    });

    expectTypeOf(counter.structure).returns.toEqualTypeOf<
      (input: string) => readonly [string, number]
    >();
  });

  it.prop('keeps the identity', [Schema.Finite, Schema.String], ([offset, input]) =>
    mealyAxiomsAt(input).map_id((value: string) => [value, value.length + offset]),
  );

  it.prop('keeps the composition', [Schema.Finite, Schema.String], ([offset, input]) =>
    mealyAxiomsAt(input).map_comp(
      (value: number) => value + 1,
      (value: number) => `${value}`,
      (value: string) => [value, value.length + offset],
    ),
  );
});

describe('FunctorConst', () => {
  it('gives the coalgebra structure of a coalgebra an output and no next state', () => {
    const display = Coalgebra.coalgebra<Functor.FunctorConst<string>>()({
      structure: (state: number) => `${state}`,
    });

    expectTypeOf(display.structure).returns.toEqualTypeOf<string>();
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
