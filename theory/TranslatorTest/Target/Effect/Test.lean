module

meta import Translator.Target.Effect.Test
meta import Translator.Target.TypeScript.Print

/-!
# Test

The module defines the checks of the tests of Effect that the specifications of the core take: a
property test that draws a system as the table of its structure, a function from a type variable
as a table that a reader reads, a stream as a prefix, skips the values that break a hypothesis,
binds a `have`, and compares two streams by a prefix as long as the stream it draws, and a test of
values without variables, in a file of tests that imports the modules of the package in the order
of their rank.

## Implementation Notes

The checks compare the printed tests with the text that the translator writes by `#guard_msgs` on
`#eval`, as `#guard` emits no message on success, which the linter `linter.hashCommand` of Mathlib
refuses.
-/

open Translator Translator.Effect

/--
info: // A file of tests.
import { describe, expect, it } from '@effect/vitest';
import { Effect, Equal, Rational, Schema, Stream } from 'effect';

import * as Bell from '#src/Bell';
import * as Organ from '#src/Organ';

describe('Fixture/Organ', () => {
/** The tones of an organ. */
it.prop('play_eq', { organTable: Schema.Tuple([Schema.Struct({ tone: Schema.Literals([0, 1, 2]), next: Schema.Tuple([Schema.Literals([0, 1, 2]), Schema.Literals([0, 1, 2]), Schema.Literals([0, 1, 2])]) }), Schema.Struct({ tone: Schema.Literals([0, 1, 2]), next: Schema.Tuple([Schema.Literals([0, 1, 2]), Schema.Literals([0, 1, 2]), Schema.Literals([0, 1, 2])]) }), Schema.Struct({ tone: Schema.Literals([0, 1, 2]), next: Schema.Tuple([Schema.Literals([0, 1, 2]), Schema.Literals([0, 1, 2]), Schema.Literals([0, 1, 2])]) })]), state: Schema.Literals([0, 1, 2]), keys: Schema.NonEmptyArray(Schema.Literals([0, 1, 2])) }, ({ organTable, state, keys }) => {
const organ = Organ.make({ str: (v: 0 | 1 | 2) => ({ tone: organTable[v].tone, next: (key: 0 | 1 | 2) => organTable[v].next[key] }) });
if (Equal.equals(state, keys[0])) {
return;
}
const step = organ.str(state);
const actual = Effect.runSync(Stream.runCollect(Stream.take(Organ.play(organ, state, Stream.fromIterable(keys)), keys.length)));
const expected = Effect.runSync(Stream.runCollect(Stream.take(Bell.peal(step), keys.length)));
expect(actual).toHaveLength(keys.length);
expect(actual).toEqual(expected);
});

/** A value. */
it('origin', () => {
const actual = Rational.fromBigInt(0n);
const expected = Rational.fromBigInt(0n);
expect(actual).toEqual(expected);
});
});
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  let organ : Core.Reference :=
    { declaration := `Organ, module := `Fixture.Organ, words := ["Organ"], takesModuleName := true }
  let play : Core.Reference :=
    { declaration := `Organ.play, module := `Fixture.Organ, words := ["play"] }
  let peal : Core.Reference :=
    { declaration := `Bell.peal, module := `Fixture.Bell, words := ["peal"] }
  let system : Core.Specification := {
    name := "play_eq"
    documentation := { text := "The tones of an organ.", addresses := [] }
    variables :=
      [.system "organ" organ "str"
          (.table "v" (.record [("tone", .values), ("next", .table "key" .values)])),
        .value "state" .values, .stream "keys" .values true]
    hypotheses := [{ equal := false, left := .bound "state", right := .element (.sample "keys") 0 }]
    haves := [("step", .apply (.field (.bound "organ") "str") (.bound "state"))]
    left := .global play [.bound "organ", .bound "state", .bound "keys"]
    right := .global peal [.bound "step"]
    comparison := .prefix (some "keys") true }
  let value : Core.Specification := {
    name := "origin"
    documentation := { text := "A value.", addresses := [] }
    variables := []
    hypotheses := []
    haves := []
    left := .primitive .rationalLiteral [.natural 0]
    right := .primitive .rationalLiteral [.natural 0]
    comparison := .values }
  match [system, value].mapM (lowerSpecification `Fixture) with
  | .ok tests =>
    IO.print (TypeScript.Module.print (testModuleOf "A file of tests." "Fixture/Organ"
      (fun path ↦ if path == "Bell" then 0 else 1) tests))
  | .error refusal => Lean.throwError refusal.render
