module

meta import Translator.Main
import Falkara.Translation.Rules

import all TranslatorTest.Fixture.Bell
import all TranslatorTest.Fixture.Carillon
import all TranslatorTest.Fixture.Clock
import all TranslatorTest.Fixture.Coordinate
import all TranslatorTest.Fixture.Organ
import all TranslatorTest.Fixture.Point

/-!
# Theorem

The module defines the checks of the tests of TypeScript that the theorems of the theory take. The
file of tests of a module is checked whole: a theorem with a constructor and an option takes a
property test, and a theorem with a hypothesis takes a property test that skips the values breaking
the hypothesis. A theorem of a system takes a property test that draws the system as the table of
its structure, a state and every other type variable at three values, a function as a table, and a
stream as a prefix, which has a first element where the theorem takes the first element of the
stream, and that compares two streams by a prefix of each, as long as the stream it draws or of 6
elements where it draws none. A product takes a record where the functor of the system names its
fields and a tuple otherwise, a pair takes the record that the type of its equation names although
Lean infers it as a product, and a `have` takes a statement of its own. A table of a test is a
`tableOf` of the schema of its value, which the file declares once. The module defines as well
a check of every theorem that the translator refuses, with the reason.
-/

open Translator

/--
info: // Written by the translator from `TranslatorTest.Fixture.Point`, so every change by hand is lost when the translator runs.
import { describe, expect, it } from '@effect/vitest';
import { Equal, Option } from 'effect';

import * as Coordinate from '#src/Fixture/Coordinate';
import * as Point from '#src/Fixture/Point';

describe('Fixture/Point', () => {
/** The point at a coordinate is the point whose first coordinate it is. */
it.prop('pointAt_first', { coordinate: Coordinate.Coordinate }, ({ coordinate }) => {
const actual = Point.pointAt(coordinate);
const expected = Option.some(Point.make({ first: coordinate }));
expect(actual).toEqual(expected);
});

/** The points at two equal coordinates are equal. */
it.prop('pointAt_eq', { first: Coordinate.Coordinate, second: Coordinate.Coordinate }, ({ first, second }) => {
if (!Equal.equals(first, second)) {
return;
}
const actual = Point.pointAt(first);
const expected = Point.pointAt(second);
expect(actual).toEqual(expected);
});
});
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← testFileOf `TranslatorTest `TranslatorTest.Fixture.Point `Geometry
    [``Geometry.pointAt_first, ``Geometry.pointAt_eq])

/--
info: // Written by the translator from `TranslatorTest.Fixture.Organ`, so every change by hand is lost when the translator runs.
import { describe, expect, it } from '@effect/vitest';
import { Effect, Schema, Stream } from 'effect';

import * as Bell from '#src/Fixture/Bell';
import * as Organ from '#src/Fixture/Organ';

describe('Fixture/Organ', () => {
/** A schema of the table of a function from three values, its value at each of them. */
const tableOf = <Value extends Schema.Constraint>(value: Value) => Schema.Tuple([value, value, value]);

/** The tones of an organ open with the tone upon the first key and go on with the tones at the next state upon the rest of the keys. */
it.prop('Organ.play_eq', { organTable: tableOf(tableOf(Schema.Struct({ tone: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }))), state: Schema.Literals([0, 1, 2]), keys: Schema.NonEmptyArray(Schema.Literals([0, 1, 2])) }, ({ organTable, state, keys }) => {
const organ = Organ.make({ str: (v: 0 | 1 | 2) => (key: 0 | 1 | 2) => organTable[v][key] });
const step = organ.str(state);
const actual = Effect.runSync(Stream.runCollect(Stream.take(Organ.play(organ, state, Stream.fromIterable(keys)), keys.length)));
const expected = Effect.runSync(Stream.runCollect(Stream.take(Stream.prepend(Organ.play(organ, step(keys[0]).next, Stream.drop(Stream.fromIterable(keys), 1)), [step(keys[0]).tone]), keys.length)));
expect(actual).toHaveLength(keys.length);
expect(actual).toEqual(expected);
});

/** The tones of an organ are the tones of its sounds. */
it.prop('Organ.play_eq_map_sounds', { organTable: tableOf(tableOf(Schema.Struct({ tone: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }))), state: Schema.Literals([0, 1, 2]), keys: Schema.Array(Schema.Literals([0, 1, 2])) }, ({ organTable, state, keys }) => {
const organ = Organ.make({ str: (v: 0 | 1 | 2) => (key: 0 | 1 | 2) => organTable[v][key] });
const actual = Effect.runSync(Stream.runCollect(Stream.take(Organ.play(organ, state, Stream.fromIterable(keys)), keys.length)));
const expected = Effect.runSync(Stream.runCollect(Stream.take(Stream.map(Organ.sounds(organ, state, Stream.fromIterable(keys)), (value) => value.tone), keys.length)));
expect(actual).toHaveLength(keys.length);
expect(actual).toEqual(expected);
});

/** The tones of the organ that transposes every tone of an organ are the transposed tones of the organ. */
it.prop('Organ.play_transpose', { organTable: tableOf(tableOf(Schema.Struct({ tone: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }))), interval: tableOf(Schema.Literals([0, 1, 2])), state: Schema.Literals([0, 1, 2]), keys: Schema.Array(Schema.Literals([0, 1, 2])) }, ({ organTable, interval, state, keys }) => {
const organ = Organ.make({ str: (v: 0 | 1 | 2) => (key: 0 | 1 | 2) => organTable[v][key] });
const actual = Effect.runSync(Stream.runCollect(Stream.take(Organ.play(Organ.transpose(organ, (tone: 0 | 1 | 2) => interval[tone]), state, Stream.fromIterable(keys)), keys.length)));
const expected = Effect.runSync(Stream.runCollect(Stream.take(Stream.map(Organ.play(organ, state, Stream.fromIterable(keys)), (tone: 0 | 1 | 2) => interval[tone]), keys.length)));
expect(actual).toHaveLength(keys.length);
expect(actual).toEqual(expected);
});

/** The sound of an organ upon a key is its tone beside its next state. */
it.prop('Organ.sound_eq', { organTable: tableOf(tableOf(Schema.Struct({ tone: Schema.Literals([0, 1, 2]), next: Schema.Literals([0, 1, 2]) }))), state: Schema.Literals([0, 1, 2]), key: Schema.Literals([0, 1, 2]) }, ({ organTable, state, key }) => {
const organ = Organ.make({ str: (v: 0 | 1 | 2) => (key: 0 | 1 | 2) => organTable[v][key] });
const step = organ.str(state);
const actual = step(key);
const expected = { tone: step(key).tone, next: step(key).next };
expect(actual).toEqual(expected);
});

/** The peal of a bell opens with the chime that the bell rings and goes on with the peal at the next state. */
it.prop('Bell.peal_eq', { bellTable: tableOf(Schema.Tuple([Schema.Literals([0, 1, 2]), Schema.Literals([0, 1, 2])])), state: Schema.Literals([0, 1, 2]) }, ({ bellTable, state }) => {
const bell = Bell.make({ str: (v: 0 | 1 | 2) => bellTable[v] });
const actual = Effect.runSync(Stream.runCollect(Stream.take(Bell.peal(bell, state), 6)));
const expected = Effect.runSync(Stream.runCollect(Stream.take(Stream.prepend(Bell.peal(bell, bell.str(state)[1]), [bell.str(state)[0]]), 6)));
expect(actual).toHaveLength(6);
expect(actual).toEqual(expected);
});

/** The answer of a bell pairs every chime it hears with a chime of its peal. */
it.prop('Bell.answer_eq', { bellTable: tableOf(Schema.Tuple([Schema.Literals([0, 1, 2]), Schema.Literals([0, 1, 2])])), state: Schema.Literals([0, 1, 2]), heard: Schema.Array(Schema.Literals([0, 1, 2])) }, ({ bellTable, state, heard }) => {
const bell = Bell.make({ str: (v: 0 | 1 | 2) => bellTable[v] });
const actual = Effect.runSync(Stream.runCollect(Stream.take(Bell.answer(bell, state, Stream.fromIterable(heard)), heard.length)));
const expected = Effect.runSync(Stream.runCollect(Stream.take(Stream.zip(Stream.fromIterable(heard), Bell.peal(bell, state)), heard.length)));
expect(actual).toHaveLength(heard.length);
expect(actual).toEqual(expected);
});

/** The first chimes of the answer of a bell are the chimes that the bell hears. */
it.prop('Bell.map_fst_answer', { bellTable: tableOf(Schema.Tuple([Schema.Literals([0, 1, 2]), Schema.Literals([0, 1, 2])])), state: Schema.Literals([0, 1, 2]), heard: Schema.Array(Schema.Literals([0, 1, 2])) }, ({ bellTable, state, heard }) => {
const bell = Bell.make({ str: (v: 0 | 1 | 2) => bellTable[v] });
const actual = Effect.runSync(Stream.runCollect(Stream.take(Stream.map(Bell.answer(bell, state, Stream.fromIterable(heard)), (value) => value[0]), heard.length)));
const expected = Effect.runSync(Stream.runCollect(Stream.take(Stream.fromIterable(heard), heard.length)));
expect(actual).toHaveLength(heard.length);
expect(actual).toEqual(expected);
});

/** The state that a key leads a music box to is the state that its transition gives upon the key. */
it.prop('MusicBox.snd_str_apply', { boxTable: tableOf(Schema.Struct({ tone: Schema.Literals([0, 1, 2]), next: tableOf(Schema.Literals([0, 1, 2])) })), state: Schema.Literals([0, 1, 2]), key: Schema.Literals([0, 1, 2]) }, ({ boxTable, state, key }) => {
const box = Organ.musicBox({ str: (v: 0 | 1 | 2) => ({ tone: boxTable[v].tone, next: (key: 0 | 1 | 2) => boxTable[v].next[key] }) });
const step = box.str(state);
const actual = [step.tone, step.next(key)][1];
const expected = step.next(key);
expect(actual).toEqual(expected);
});

/** The pair of the parts of the pair of a pause and a toll is the pair of the pause and the toll. */
it.prop('mk_fst_snd_pause_toll', { pause: Schema.Option(Schema.Literals([0, 1, 2])), toll: Schema.Result(Schema.Literals([0, 1, 2]), Schema.Void) }, ({ pause, toll }) => {
const actual = [[pause, toll][0], [pause, toll][1]];
const expected = [pause, toll];
expect(actual).toEqual(expected);
});

/** The first rest before the rests after it gives the rests. */
it.prop('cons_head_tail_rests', { rests: Schema.NonEmptyArray(Schema.Void) }, ({ rests }) => {
const actual = Effect.runSync(Stream.runCollect(Stream.take(Stream.prepend(Stream.drop(Stream.fromIterable(rests), 1), [rests[0]]), rests.length)));
const expected = Effect.runSync(Stream.runCollect(Stream.take(Stream.fromIterable(rests), rests.length)));
expect(actual).toHaveLength(rests.length);
expect(actual).toEqual(expected);
});
});
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  IO.print (← testFileOf `TranslatorTest `TranslatorTest.Fixture.Organ `Geometry
    [``Geometry.Organ.play_eq, ``Geometry.Organ.play_eq_map_sounds,
      ``Geometry.Organ.play_transpose, ``Geometry.Organ.sound_eq, ``Geometry.Bell.peal_eq,
      ``Geometry.Bell.answer_eq,
      ``Geometry.Bell.map_fst_answer, ``Geometry.MusicBox.snd_str_apply,
      ``Geometry.mk_fst_snd_pause_toll, ``Geometry.cons_head_tail_rests])

/--
error: `(bell.peal
    state).head` has no expression in a test of TypeScript, as the first element of a stream that the test does not draw takes an effect.
-/
#guard_msgs in
#eval testOf `TranslatorTest `Geometry ``Geometry.Bell.head_peal

/--
error: `(Stream'.const (bell.peal state)).tail =
  Stream'.const
    (bell.peal
      state)` is no equation that a test can check, as a test compares a prefix of a stream and no stream of streams.
-/
#guard_msgs in
#eval testOf `TranslatorTest `Geometry ``Geometry.Bell.tail_const_peal

/--
error: `m (B × V)` has no schema that a test can draw from, as a test draws a system in the identity monad alone.
-/
#guard_msgs in
#eval testOf `TranslatorTest `Geometry ``Geometry.Carillon.fst_state

/--
error: `B × B → B` has no schema that a test can draw from, as a test draws a function from a type variable alone.
-/
#guard_msgs in
#eval testOf `TranslatorTest `Geometry ``Geometry.choice_mk_fst_snd

/--
error: `Stream'.zip (fun first x ↦ first) heard
  heard` has no expression in a test of TypeScript, as a test zips two streams into pairs alone and `fun first x ↦
  first` is no `Prod.mk`.
-/
#guard_msgs in
#eval testOf `TranslatorTest `Geometry ``Geometry.zip_first

/--
error: `Stream'.map Prod.fst (Stream'.zip Prod.mk first second) =
  first` is no equation that a test can check, as a test compares a prefix as long as the one stream it draws and `Geometry.map_fst_zip` takes several.
-/
#guard_msgs in
#eval testOf `TranslatorTest `Geometry ``Geometry.map_fst_zip

/--
error: `Stream'.Seq.nil.destruct` has no expression in a test of TypeScript, as a stream of Effect gives its first element and the rest only by an effect, which the translator does not write yet.
-/
#guard_msgs in
#eval testOf `TranslatorTest `Geometry ``Geometry.destruct_nil
