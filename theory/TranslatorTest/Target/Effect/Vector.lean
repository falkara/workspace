module

meta import Translator.Target.Effect.Vector
meta import Translator.Target.TypeScript.Print

/-!
# Vector

The module defines the checks of the tests of Effect that the vectors of the primitives take: a
value compares with its initializer and a stream with the initializers of its first elements, which
`Stream.take` collects, each with the statement that its rule assumes.

## Implementation Notes

The checks compare the printed tests with their expected text by `#guard_msgs` on `#eval`, as
`#guard` emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

open Translator Translator.Effect

/--
info: /** Checks that `Rational.sum(x, y)` is `x + y`. */
it('rationalAdd', () => {
const actual = Rational.sum(Rational.fromBigInt(2n), Rational.fromBigInt(3n));
const expected = Rational.fromBigInt(5n);
expect(actual).toEqual(expected);
});

/** Checks that `Stream.zip(s, t)` pairs the elements of `s` and `t`, in order. */
it('streamZip', () => {
const actual = Effect.runSync(Stream.runCollect(Stream.take(Stream.zip(s, t), 3)));
const expected = [[Rational.fromBigInt(1n), Rational.makeUnsafe(1n, 2n)]];
expect(actual).toEqual(expected);
});
-/
#guard_msgs in
#eval show Lean.MetaM Unit from do
  let vectors : List Core.Vector :=
    [{ primitive := .rationalAdd
       term := .primitive .rationalAdd
        [.primitive .rationalLiteral [.natural 2], .primitive .rationalLiteral [.natural 3]]
       expected := .value (.rational 5 1) },
      { primitive := .streamZip
        term := .primitive .streamZip [.bound "s", .bound "t"]
        expected := .prefix [.pair (.rational 1 1) (.rational 1 2)] }]
  match vectors.mapM lowerVector with
  | .ok tests => IO.print (TypeScript.Statement.printBlock tests)
  | .error refusal => Lean.throwError refusal.render
