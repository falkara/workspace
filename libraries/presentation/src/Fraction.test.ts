import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Exit, Schema } from 'effect';

import * as Fraction from '#src/Fraction';

describe('Fraction', () => {
  it('is not written by hand, as only make and the schema bring a ratio to lowest terms', () => {
    expectTypeOf<{ numerator: bigint; denominator: bigint }>().not.toExtend<Fraction.Fraction>();
  });

  it('accepts a ratio of two positive whole numbers', () => {
    const exit = Schema.decodeExit(Fraction.Fraction)({ numerator: 6n, denominator: 5n });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('decodes a ratio in lowest terms', () => {
    const exit = Schema.decodeExit(Fraction.Fraction)({ numerator: 12n, denominator: 10n });

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual({
      numerator: 6n,
      denominator: 5n,
    });
  });

  it('rejects a numerator of 0', () => {
    const exit = Schema.decodeExit(Fraction.Fraction)({ numerator: 0n, denominator: 5n });

    expect(Exit.isFailure(exit)).toBe(true);
  });

  it('rejects a denominator of 0', () => {
    const exit = Schema.decodeExit(Fraction.Fraction)({ numerator: 6n, denominator: 0n });

    expect(Exit.isFailure(exit)).toBe(true);
  });
});

describe('make', () => {
  it('reduces the ratio to lowest terms', () => {
    expect(Fraction.make(12n, 10n)).toEqual({ numerator: 6n, denominator: 5n });
  });

  it('keeps a ratio already in lowest terms', () => {
    expect(Fraction.make(6n, 5n)).toEqual({ numerator: 6n, denominator: 5n });
  });

  it('does not throw for a zero numerator and a zero denominator', () => {
    expect(() => Fraction.make(0n, 0n)).not.toThrow();
  });

  it('reduces whole numbers of thousands of digits', () => {
    const fraction = Fraction.make(2n * 833n ** 1600n, 2n * 832n ** 1600n);

    expect(fraction).toEqual(Fraction.pow(Fraction.make(833n, 832n), 1600n));
  });
});

describe('one', () => {
  it('is 1/1', () => {
    expect(Fraction.one).toEqual({ numerator: 1n, denominator: 1n });
  });
});

describe('sum', () => {
  it('adds two fractions in lowest terms', () => {
    expect(Fraction.sum(Fraction.make(1n, 6n), Fraction.make(1n, 3n))).toEqual(
      Fraction.make(1n, 2n),
    );
  });

  it('adds two fractions whose denominators share a divisor in lowest terms', () => {
    expect(Fraction.sum(Fraction.make(1n, 6n), Fraction.make(1n, 10n))).toEqual(
      Fraction.make(4n, 15n),
    );
  });
});

describe('multiply', () => {
  it('multiplies two fractions in lowest terms', () => {
    expect(Fraction.multiply(Fraction.make(6n, 5n), Fraction.make(5n, 4n))).toEqual(
      Fraction.make(3n, 2n),
    );
  });

  it('cancels each numerator against the other denominator', () => {
    expect(Fraction.multiply(Fraction.make(4n, 9n), Fraction.make(3n, 8n))).toEqual(
      Fraction.make(1n, 6n),
    );
  });
});

describe('divide', () => {
  it('divides two fractions in lowest terms', () => {
    expect(Fraction.divide(Fraction.make(5n, 4n), Fraction.make(6n, 5n))).toEqual(
      Fraction.make(25n, 24n),
    );
  });

  it('cancels the numerators and the denominators against each other', () => {
    expect(Fraction.divide(Fraction.make(4n, 9n), Fraction.make(8n, 3n))).toEqual(
      Fraction.make(1n, 6n),
    );
  });
});

describe('pow', () => {
  it('raises a fraction to a positive exponent', () => {
    expect(Fraction.pow(Fraction.make(6n, 5n), 2n)).toEqual(Fraction.make(36n, 25n));
  });

  it('inverts a fraction raised to a negative exponent', () => {
    expect(Fraction.pow(Fraction.make(6n, 5n), -2n)).toEqual(Fraction.make(25n, 36n));
  });

  it('gives 1 for an exponent of 0', () => {
    expect(Fraction.pow(Fraction.make(6n, 5n), 0n)).toEqual(Fraction.one);
  });

  it('stays exact beyond the integers a number holds exactly', () => {
    const power = Fraction.pow(Fraction.make(5n, 1n), 24n);

    expect(power.numerator).toBe(59_604_644_775_390_625n);
  });
});

describe('order', () => {
  it('orders fractions by value', () => {
    expect(Fraction.order(Fraction.make(6n, 5n), Fraction.make(5n, 4n))).toBe(-1);
  });

  it('finds fractions of equal value equal', () => {
    expect(Fraction.order(Fraction.make(12n, 10n), Fraction.make(6n, 5n))).toBe(0);
  });
});

describe('isGreaterThan', () => {
  it('holds for a larger fraction', () => {
    expect(Fraction.isGreaterThan(Fraction.make(5n, 4n), Fraction.make(6n, 5n))).toBe(true);
  });

  it('fails for an equal fraction', () => {
    expect(Fraction.isGreaterThan(Fraction.make(6n, 5n), Fraction.make(6n, 5n))).toBe(false);
  });
});

describe('isGreaterThanOrEqualTo', () => {
  it('holds for an equal fraction', () => {
    expect(Fraction.isGreaterThanOrEqualTo(Fraction.make(6n, 5n), Fraction.make(6n, 5n))).toBe(
      true,
    );
  });

  it('fails for a smaller fraction', () => {
    expect(Fraction.isGreaterThanOrEqualTo(Fraction.make(6n, 5n), Fraction.make(5n, 4n))).toBe(
      false,
    );
  });
});

describe('isLessThanOrEqualTo', () => {
  it('holds for an equal fraction', () => {
    expect(Fraction.isLessThanOrEqualTo(Fraction.make(6n, 5n), Fraction.make(6n, 5n))).toBe(true);
  });

  it('fails for a larger fraction', () => {
    expect(Fraction.isLessThanOrEqualTo(Fraction.make(5n, 4n), Fraction.make(6n, 5n))).toBe(false);
  });
});

describe('format', () => {
  it('writes the numerator over the denominator', () => {
    expect(Fraction.format(Fraction.make(6n, 5n))).toBe('6/5');
  });

  it('writes a whole fraction as its numerator alone', () => {
    expect(Fraction.format(Fraction.make(4n, 2n))).toBe('2');
  });
});

describe('isGreaterThanFraction', () => {
  it('accepts a larger fraction', () => {
    const exit = Schema.decodeExit(
      Fraction.Fraction.pipe(Schema.check(Fraction.isGreaterThanFraction(Fraction.one))),
    )({ numerator: 6n, denominator: 5n });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects an equal fraction', () => {
    const exit = Schema.decodeExit(
      Fraction.Fraction.pipe(Schema.check(Fraction.isGreaterThanFraction(Fraction.one))),
    )({ numerator: 1n, denominator: 1n });

    expect(Exit.isFailure(exit)).toBe(true);
  });
});

describe('isGreaterThanOrEqualToFraction', () => {
  it('accepts an equal fraction', () => {
    const exit = Schema.decodeExit(
      Fraction.Fraction.pipe(Schema.check(Fraction.isGreaterThanOrEqualToFraction(Fraction.one))),
    )({ numerator: 1n, denominator: 1n });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a smaller fraction', () => {
    const exit = Schema.decodeExit(
      Fraction.Fraction.pipe(Schema.check(Fraction.isGreaterThanOrEqualToFraction(Fraction.one))),
    )({ numerator: 5n, denominator: 6n });

    expect(Exit.isFailure(exit)).toBe(true);
  });
});

describe('isLessThanOrEqualToFraction', () => {
  it('accepts an equal fraction', () => {
    const exit = Schema.decodeExit(
      Fraction.Fraction.pipe(Schema.check(Fraction.isLessThanOrEqualToFraction(Fraction.one))),
    )({ numerator: 1n, denominator: 1n });

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a larger fraction', () => {
    const exit = Schema.decodeExit(
      Fraction.Fraction.pipe(Schema.check(Fraction.isLessThanOrEqualToFraction(Fraction.one))),
    )({ numerator: 6n, denominator: 5n });

    expect(Exit.isFailure(exit)).toBe(true);
  });
});

describe('toNumber', () => {
  it('gives the value of the fraction as a number', () => {
    expect(Fraction.toNumber(Fraction.make(6n, 5n))).toBe(1.2);
  });

  it('rounds a tie to the even number', () => {
    expect(Fraction.toNumber(Fraction.make(2n ** 53n + 1n, 1n))).toBe(2 ** 53);
    expect(Fraction.toNumber(Fraction.make(2n ** 53n + 3n, 1n))).toBe(2 ** 53 + 4);
  });

  it('converts a fraction whose fields are beyond the numbers JavaScript can hold', () => {
    expect(Fraction.toNumber(Fraction.make(10n ** 400n + 1n, 10n ** 400n))).toBe(1);
  });

  it('rounds to the grid of the subnormal numbers', () => {
    expect(Fraction.toNumber(Fraction.make(1n, 2n ** 1074n))).toBe(Number.MIN_VALUE);
    expect(Fraction.toNumber(Fraction.make(3n, 2n ** 1076n))).toBe(Number.MIN_VALUE);
    expect(Fraction.toNumber(Fraction.make(1n, 2n ** 1075n))).toBe(0);
  });

  it('rounds to the largest number or beyond it to infinity', () => {
    expect(Fraction.toNumber(Fraction.make(2n ** 1024n - 2n ** 971n, 1n))).toBe(Number.MAX_VALUE);
    expect(Fraction.toNumber(Fraction.make(2n ** 1024n - 2n ** 970n, 1n))).toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});
