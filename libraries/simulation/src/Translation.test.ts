// Written by the translator from the vectors of its rules, so every change by hand is lost when the translator runs.
import { describe, expect, it } from '@effect/vitest';
import { Effect, Rational, Stream } from 'effect';

describe('Translation', () => {
  /** Checks that `Rational.fromBigInt(n)` is the rational number `n`. */
  it('rationalLiteral', () => {
    const actual = Rational.fromBigInt(7n);
    const expected = Rational.fromBigInt(7n);
    expect(actual).toEqual(expected);
  });

  /** Checks that `Rational.negate(x)` is `-x`. */
  it('rationalNegate', () => {
    const actual = Rational.negate(Rational.fromBigInt(3n));
    const expected = Rational.fromBigInt(-3n);
    expect(actual).toEqual(expected);
  });

  /** Checks that `Rational.sum(x, y)` is `x + y`. */
  it('rationalAdd', () => {
    const actual = Rational.sum(Rational.fromBigInt(2n), Rational.fromBigInt(3n));
    const expected = Rational.fromBigInt(5n);
    expect(actual).toEqual(expected);
  });

  /** Checks that `Rational.subtract(x, y)` is `x - y`. */
  it('rationalSubtract', () => {
    const actual = Rational.subtract(Rational.fromBigInt(2n), Rational.fromBigInt(5n));
    const expected = Rational.fromBigInt(-3n);
    expect(actual).toEqual(expected);
  });

  /** Checks that `Rational.multiply(x, y)` is `x * y`. */
  it('rationalMultiply', () => {
    const actual = Rational.multiply(
      Rational.fromBigInt(2n),
      Rational.negate(Rational.fromBigInt(3n)),
    );
    const expected = Rational.fromBigInt(-6n);
    expect(actual).toEqual(expected);
  });

  /** Checks that `Stream.map(s, f)` gives `f` of every element of `s`, in order. */
  it('streamMap', () => {
    const actual = Effect.runSync(
      Stream.runCollect(
        Stream.take(
          Stream.map(
            Stream.zip(
              Stream.prepend(Stream.forever(Stream.succeed(Rational.fromBigInt(2n))), [
                Rational.fromBigInt(1n),
              ]),
              Stream.prepend(Stream.forever(Stream.succeed(Rational.fromBigInt(3n))), [
                Rational.fromBigInt(5n),
              ]),
            ),
            (value) => value[1],
          ),
          3,
        ),
      ),
    );
    const expected = [Rational.fromBigInt(5n), Rational.fromBigInt(3n), Rational.fromBigInt(3n)];
    expect(actual).toEqual(expected);
  });

  /** Checks that `Stream.map(s, f)` gives `f` of every element of the sequence `s`, in order. */
  it('sequenceMap', () => {
    const actual = Effect.runSync(
      Stream.runCollect(
        Stream.take(
          Stream.map(
            Stream.prepend(
              Stream.prepend(Stream.empty, [[Rational.fromBigInt(3n), Rational.fromBigInt(4n)]]),
              [[Rational.fromBigInt(1n), Rational.fromBigInt(2n)]],
            ),
            (value) => value[1],
          ),
          3,
        ),
      ),
    );
    const expected = [Rational.fromBigInt(2n), Rational.fromBigInt(4n)];
    expect(actual).toEqual(expected);
  });

  /** Checks that `Stream.zip(s, t)` pairs the elements of `s` and `t`, in order. */
  it('streamZip', () => {
    const actual = Effect.runSync(
      Stream.runCollect(
        Stream.take(
          Stream.zip(
            Stream.prepend(Stream.forever(Stream.succeed(Rational.fromBigInt(2n))), [
              Rational.fromBigInt(1n),
            ]),
            Stream.forever(Stream.succeed(Rational.fromBigInt(3n))),
          ),
          3,
        ),
      ),
    );
    const expected = [
      [Rational.fromBigInt(1n), Rational.fromBigInt(3n)],
      [Rational.fromBigInt(2n), Rational.fromBigInt(3n)],
      [Rational.fromBigInt(2n), Rational.fromBigInt(3n)],
    ];
    expect(actual).toEqual(expected);
  });

  /** Checks that `Stream.prepend(s, [x])` is `x` followed by `s`. */
  it('streamCons', () => {
    const actual = Effect.runSync(
      Stream.runCollect(
        Stream.take(
          Stream.prepend(Stream.forever(Stream.succeed(Rational.fromBigInt(2n))), [
            Rational.fromBigInt(1n),
          ]),
          3,
        ),
      ),
    );
    const expected = [Rational.fromBigInt(1n), Rational.fromBigInt(2n), Rational.fromBigInt(2n)];
    expect(actual).toEqual(expected);
  });

  /** Checks that `Stream.drop(s, 1)` is `s` after its first element. */
  it('streamTail', () => {
    const actual = Effect.runSync(
      Stream.runCollect(
        Stream.take(
          Stream.drop(
            Stream.prepend(
              Stream.prepend(Stream.forever(Stream.succeed(Rational.fromBigInt(2n))), [
                Rational.fromBigInt(4n),
              ]),
              [Rational.fromBigInt(1n)],
            ),
            1,
          ),
          3,
        ),
      ),
    );
    const expected = [Rational.fromBigInt(4n), Rational.fromBigInt(2n), Rational.fromBigInt(2n)];
    expect(actual).toEqual(expected);
  });

  /** Checks that `Stream.forever(Stream.succeed(x))` repeats `x`. */
  it('streamConst', () => {
    const actual = Effect.runSync(
      Stream.runCollect(Stream.take(Stream.forever(Stream.succeed(Rational.fromBigInt(2n))), 3)),
    );
    const expected = [Rational.fromBigInt(2n), Rational.fromBigInt(2n), Rational.fromBigInt(2n)];
    expect(actual).toEqual(expected);
  });

  /** Checks that `Stream.prepend(s, [x])` is the sequence `x` followed by `s`. */
  it('sequenceCons', () => {
    const actual = Effect.runSync(
      Stream.runCollect(
        Stream.take(
          Stream.prepend(Stream.prepend(Stream.empty, [Rational.fromBigInt(2n)]), [
            Rational.fromBigInt(1n),
          ]),
          3,
        ),
      ),
    );
    const expected = [Rational.fromBigInt(1n), Rational.fromBigInt(2n)];
    expect(actual).toEqual(expected);
  });
});
