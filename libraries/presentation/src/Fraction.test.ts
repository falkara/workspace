import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Exit, Option, pipe, Schema, SchemaIssue } from 'effect';

import * as Fraction from '#src/Fraction';

/** A schema of a ratio of two positive whole numbers, not reduced, from which property tests draw their inputs. */
const PositiveRatio = Schema.Struct({
  numerator: Schema.BigInt.check(Schema.isGreaterThanBigInt(0n)),
  denominator: Schema.BigInt.check(Schema.isGreaterThanBigInt(0n)),
});

/** A schema of a ratio of two positive whole numbers that a number holds exactly, so that dividing them as numbers rounds once, as IEEE 754 rounds. */
const ExactRatio = Schema.Struct({
  numerator: Schema.BigInt.check(Schema.isBetweenBigInt({ minimum: 1n, maximum: 2n ** 53n })),
  denominator: Schema.BigInt.check(Schema.isBetweenBigInt({ minimum: 1n, maximum: 2n ** 53n })),
});

describe('Fraction', () => {
  it('is not written by hand, as only its constructors and the schema bring a ratio to lowest terms', () => {
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

  it('refuses a ratio that is not in lowest terms as a fraction made otherwise than by decoding', () => {
    expect(Schema.is(Fraction.Fraction)({ numerator: 2n, denominator: 4n })).toBe(false);
  });

  it.prop(
    'decodes every ratio of two positive whole numbers into a fraction of equal value in lowest terms',
    [PositiveRatio],
    ([ratio]) => {
      const exit = Schema.decodeExit(Fraction.Fraction)(ratio);
      const fraction = Exit.isSuccess(exit) ? exit.value : undefined;

      expect(fraction !== undefined && Schema.is(Fraction.Fraction)(fraction)).toBe(true);
      expect(
        fraction !== undefined &&
          ratio.numerator * fraction.denominator === fraction.numerator * ratio.denominator,
      ).toBe(true);
    },
  );
});

describe('make', () => {
  it('reduces the ratio to lowest terms', () => {
    const exit = Fraction.make(12n, 10n);

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual({
      numerator: 6n,
      denominator: 5n,
    });
  });

  it('rejects a numerator and a denominator that are not positive, each with the reason', () => {
    const exit = Fraction.make(-6n, 0n);

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['numerator'],
        message:
          'Expected a positive numerator, so that every operation on the fraction keeps it positive',
      },
      {
        path: ['denominator'],
        message:
          'Expected a positive denominator, so that every operation on the fraction keeps it positive',
      },
    ]);
  });

  it('rejects a numerator of 0 over a denominator of 0 instead of a fraction nothing can divide', () => {
    const exit = Fraction.make(0n, 0n);

    expect(Exit.isFailure(exit)).toBe(true);
  });

  it.prop('agrees with makeUnsafe on positive whole numbers', [PositiveRatio], ([ratio]) => {
    const exit = Fraction.make(ratio.numerator, ratio.denominator);

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual(
      Fraction.makeUnsafe(ratio.numerator, ratio.denominator),
    );
  });
});

describe('makeUnsafe', () => {
  it('refuses a literal that is not positive as the code is written', () => {
    // @ts-expect-error A negative numerator is refused by its type.
    const negative = () => Fraction.makeUnsafe(-1n, 2n);
    // @ts-expect-error A denominator of 0 is refused by its type.
    const zero = () => Fraction.makeUnsafe(1n, 0n);

    expect([negative, zero]).toHaveLength(2);
  });

  it('reduces the ratio to lowest terms', () => {
    expect(Fraction.makeUnsafe(12n, 10n)).toEqual({ numerator: 6n, denominator: 5n });
  });

  it('keeps a ratio already in lowest terms', () => {
    expect(Fraction.makeUnsafe(6n, 5n)).toEqual({ numerator: 6n, denominator: 5n });
  });

  it('reduces whole numbers of thousands of digits', () => {
    const fraction = Fraction.makeUnsafe(2n * 833n ** 1600n, 2n * 832n ** 1600n);

    expect(fraction).toEqual(Fraction.pow(Fraction.makeUnsafe(833n, 832n), 1600n));
  });
});

describe('one', () => {
  it('is a valid fraction', () => {
    expect(Schema.is(Fraction.Fraction)(Fraction.one)).toBe(true);
  });

  it('is 1/1', () => {
    expect(Fraction.one).toEqual({ numerator: 1n, denominator: 1n });
  });
});

describe('sum', () => {
  it.prop(
    'agrees in its data-last form, as pipe calls it',
    [Fraction.Fraction, Fraction.Fraction],
    ([a, b]) => {
      expect(pipe(a, Fraction.sum(b))).toEqual(Fraction.sum(a, b));
    },
  );

  it('adds two fractions in lowest terms', () => {
    expect(Fraction.sum(Fraction.makeUnsafe(1n, 6n), Fraction.makeUnsafe(1n, 3n))).toEqual(
      Fraction.makeUnsafe(1n, 2n),
    );
  });

  it('adds two fractions whose denominators share a divisor in lowest terms', () => {
    expect(Fraction.sum(Fraction.makeUnsafe(1n, 6n), Fraction.makeUnsafe(1n, 10n))).toEqual(
      Fraction.makeUnsafe(4n, 15n),
    );
  });

  it.prop(
    'keeps every sum a fraction in lowest terms',
    [Fraction.Fraction, Fraction.Fraction],
    ([a, b]) => {
      expect(Schema.is(Fraction.Fraction)(Fraction.sum(a, b))).toBe(true);
    },
  );

  it.prop('is commutative', [Fraction.Fraction, Fraction.Fraction], ([a, b]) => {
    expect(Fraction.sum(a, b)).toEqual(Fraction.sum(b, a));
  });

  it.prop(
    'is associative',
    [Fraction.Fraction, Fraction.Fraction, Fraction.Fraction],
    ([a, b, c]) => {
      expect(Fraction.sum(Fraction.sum(a, b), c)).toEqual(Fraction.sum(a, Fraction.sum(b, c)));
    },
  );
});

describe('subtract', () => {
  it.prop(
    'agrees in its data-last form, as pipe calls it',
    [Fraction.Fraction, Fraction.Fraction],
    ([a, b]) => {
      expect(pipe(a, Fraction.subtract(b))).toEqual(Fraction.subtract(a, b));
    },
  );

  it('subtracts the second fraction from the first in lowest terms', () => {
    const exit = Fraction.subtract(Fraction.makeUnsafe(1n, 2n), Fraction.makeUnsafe(1n, 6n));

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual(Fraction.makeUnsafe(1n, 3n));
  });

  it('rejects a second fraction equal to the first, with the reason', () => {
    const exit = Fraction.subtract(Fraction.makeUnsafe(1n, 2n), Fraction.makeUnsafe(1n, 2n));

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['numerator'],
        message:
          'Expected a positive numerator, so that every operation on the fraction keeps it positive',
      },
    ]);
  });

  it('rejects a second fraction larger than the first', () => {
    const exit = Fraction.subtract(Fraction.makeUnsafe(1n, 6n), Fraction.makeUnsafe(1n, 2n));

    expect(Exit.isFailure(exit)).toBe(true);
  });

  it.prop(
    'fails exactly when the second fraction is not smaller than the first',
    [Fraction.Fraction, Fraction.Fraction],
    ([a, b]) => {
      expect(Exit.isSuccess(Fraction.subtract(a, b))).toBe(Fraction.isGreaterThan(a, b));
    },
  );
});

describe('subtractUnsafe', () => {
  it.prop(
    'agrees in its data-last form, as pipe calls it',
    [Fraction.Fraction, Fraction.Fraction],
    ([a, b]) => {
      expect(pipe(a, Fraction.subtractUnsafe(b))).toEqual(Fraction.subtractUnsafe(a, b));
    },
  );

  it('subtracts the second fraction from the first in lowest terms', () => {
    expect(
      Fraction.subtractUnsafe(Fraction.makeUnsafe(1n, 2n), Fraction.makeUnsafe(1n, 6n)),
    ).toEqual(Fraction.makeUnsafe(1n, 3n));
  });

  it('subtracts two fractions whose denominators share a divisor in lowest terms', () => {
    expect(
      Fraction.subtractUnsafe(Fraction.makeUnsafe(3n, 10n), Fraction.makeUnsafe(1n, 6n)),
    ).toEqual(Fraction.makeUnsafe(2n, 15n));
  });

  it('agrees with subtract on a smaller second fraction', () => {
    const exit = Fraction.subtract(Fraction.makeUnsafe(7n, 4n), Fraction.makeUnsafe(5n, 6n));

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual(
      Fraction.subtractUnsafe(Fraction.makeUnsafe(7n, 4n), Fraction.makeUnsafe(5n, 6n)),
    );
  });

  it.prop('undoes a sum, in lowest terms', [Fraction.Fraction, Fraction.Fraction], ([a, b]) => {
    expect(Fraction.subtractUnsafe(Fraction.sum(a, b), b)).toEqual(a);
  });

  it.prop(
    'agrees with subtract on every smaller second fraction',
    [Fraction.Fraction, Fraction.Fraction],
    ([a, b]) => {
      const exit = Fraction.subtract(Fraction.sum(a, b), b);

      expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual(
        Fraction.subtractUnsafe(Fraction.sum(a, b), b),
      );
    },
  );
});

describe('multiply', () => {
  it.prop(
    'agrees in its data-last form, as pipe calls it',
    [Fraction.Fraction, Fraction.Fraction],
    ([a, b]) => {
      expect(pipe(a, Fraction.multiply(b))).toEqual(Fraction.multiply(a, b));
    },
  );

  it('multiplies two fractions in lowest terms', () => {
    expect(Fraction.multiply(Fraction.makeUnsafe(6n, 5n), Fraction.makeUnsafe(5n, 4n))).toEqual(
      Fraction.makeUnsafe(3n, 2n),
    );
  });

  it('cancels each numerator against the other denominator', () => {
    expect(Fraction.multiply(Fraction.makeUnsafe(4n, 9n), Fraction.makeUnsafe(3n, 8n))).toEqual(
      Fraction.makeUnsafe(1n, 6n),
    );
  });

  it.prop(
    'keeps every product a fraction in lowest terms',
    [Fraction.Fraction, Fraction.Fraction],
    ([a, b]) => {
      expect(Schema.is(Fraction.Fraction)(Fraction.multiply(a, b))).toBe(true);
    },
  );

  it.prop('is commutative', [Fraction.Fraction, Fraction.Fraction], ([a, b]) => {
    expect(Fraction.multiply(a, b)).toEqual(Fraction.multiply(b, a));
  });

  it.prop(
    'is associative',
    [Fraction.Fraction, Fraction.Fraction, Fraction.Fraction],
    ([a, b, c]) => {
      expect(Fraction.multiply(Fraction.multiply(a, b), c)).toEqual(
        Fraction.multiply(a, Fraction.multiply(b, c)),
      );
    },
  );

  it.prop(
    'distributes over a sum',
    [Fraction.Fraction, Fraction.Fraction, Fraction.Fraction],
    ([a, b, c]) => {
      expect(Fraction.multiply(a, Fraction.sum(b, c))).toEqual(
        Fraction.sum(Fraction.multiply(a, b), Fraction.multiply(a, c)),
      );
    },
  );
});

describe('divide', () => {
  it.prop(
    'agrees in its data-last form, as pipe calls it',
    [Fraction.Fraction, Fraction.Fraction],
    ([a, b]) => {
      expect(pipe(a, Fraction.divide(b))).toEqual(Fraction.divide(a, b));
    },
  );

  it('divides two fractions in lowest terms', () => {
    expect(Fraction.divide(Fraction.makeUnsafe(5n, 4n), Fraction.makeUnsafe(6n, 5n))).toEqual(
      Fraction.makeUnsafe(25n, 24n),
    );
  });

  it('cancels the numerators and the denominators against each other', () => {
    expect(Fraction.divide(Fraction.makeUnsafe(4n, 9n), Fraction.makeUnsafe(8n, 3n))).toEqual(
      Fraction.makeUnsafe(1n, 6n),
    );
  });

  it.prop(
    'keeps every quotient a fraction in lowest terms',
    [Fraction.Fraction, Fraction.Fraction],
    ([a, b]) => {
      expect(Schema.is(Fraction.Fraction)(Fraction.divide(a, b))).toBe(true);
    },
  );

  it.prop('undoes a product', [Fraction.Fraction, Fraction.Fraction], ([a, b]) => {
    expect(Fraction.divide(Fraction.multiply(a, b), b)).toEqual(a);
  });

  it.prop(
    'multiplies by the inverse of the divisor',
    [Fraction.Fraction, Fraction.Fraction],
    ([a, b]) => {
      expect(Fraction.divide(a, b)).toEqual(Fraction.multiply(a, Fraction.pow(b, -1n)));
    },
  );
});

describe('pow', () => {
  it.prop(
    'agrees in its data-last form, as pipe calls it',
    [Fraction.Fraction, Schema.BigInt.check(Schema.isBetweenBigInt({ minimum: -8n, maximum: 8n }))],
    ([a, exponent]) => {
      expect(pipe(a, Fraction.pow(exponent))).toEqual(Fraction.pow(a, exponent));
    },
  );

  it('raises a fraction to a positive exponent', () => {
    expect(Fraction.pow(Fraction.makeUnsafe(6n, 5n), 2n)).toEqual(Fraction.makeUnsafe(36n, 25n));
  });

  it('inverts a fraction raised to a negative exponent', () => {
    expect(Fraction.pow(Fraction.makeUnsafe(6n, 5n), -2n)).toEqual(Fraction.makeUnsafe(25n, 36n));
  });

  it('gives 1 for an exponent of 0', () => {
    expect(Fraction.pow(Fraction.makeUnsafe(6n, 5n), 0n)).toEqual(Fraction.one);
  });

  it('stays exact beyond the integers a number holds exactly', () => {
    const power = Fraction.pow(Fraction.makeUnsafe(5n, 1n), 24n);

    expect(power.numerator).toBe(59_604_644_775_390_625n);
  });

  it.prop(
    'keeps every power a fraction in lowest terms',
    [Fraction.Fraction, Schema.BigInt.check(Schema.isBetweenBigInt({ minimum: -8n, maximum: 8n }))],
    ([a, exponent]) => {
      expect(Schema.is(Fraction.Fraction)(Fraction.pow(a, exponent))).toBe(true);
    },
  );

  it.prop(
    'gives 1 for a power times the power of the negated exponent',
    [Fraction.Fraction, Schema.BigInt.check(Schema.isBetweenBigInt({ minimum: -8n, maximum: 8n }))],
    ([a, exponent]) => {
      expect(Fraction.multiply(Fraction.pow(a, exponent), Fraction.pow(a, -exponent))).toEqual(
        Fraction.one,
      );
    },
  );
});

describe('Order', () => {
  it('orders fractions by value', () => {
    expect(Fraction.Order(Fraction.makeUnsafe(6n, 5n), Fraction.makeUnsafe(5n, 4n))).toBe(-1);
  });

  it('finds fractions of equal value equal', () => {
    expect(Fraction.Order(Fraction.makeUnsafe(12n, 10n), Fraction.makeUnsafe(6n, 5n))).toBe(0);
  });

  it.prop('is antisymmetric', [Fraction.Fraction, Fraction.Fraction], ([a, b]) => {
    expect(Fraction.Order(a, b)).toBe(-Fraction.Order(b, a) || 0);
  });

  it.prop(
    'finds a fraction equal only to itself',
    [Fraction.Fraction, Fraction.Fraction],
    ([a, b]) => {
      expect(Fraction.Order(a, b) === 0).toBe(
        a.numerator === b.numerator && a.denominator === b.denominator,
      );
    },
  );
});

describe('Equivalence', () => {
  it('finds fractions of equal value equal', () => {
    expect(Fraction.Equivalence(Fraction.makeUnsafe(12n, 10n), Fraction.makeUnsafe(6n, 5n))).toBe(
      true,
    );
  });

  it('finds fractions of different value different', () => {
    expect(Fraction.Equivalence(Fraction.makeUnsafe(6n, 5n), Fraction.makeUnsafe(5n, 4n))).toBe(
      false,
    );
  });

  it.prop(
    'agrees with the order on which fractions are equal',
    [Fraction.Fraction, Fraction.Fraction],
    ([a, b]) => {
      expect(Fraction.Equivalence(a, b)).toBe(Fraction.Order(a, b) === 0);
    },
  );
});

describe('isGreaterThan', () => {
  it('holds for a larger fraction', () => {
    expect(Fraction.isGreaterThan(Fraction.makeUnsafe(5n, 4n), Fraction.makeUnsafe(6n, 5n))).toBe(
      true,
    );
  });

  it('fails for an equal fraction', () => {
    expect(Fraction.isGreaterThan(Fraction.makeUnsafe(6n, 5n), Fraction.makeUnsafe(6n, 5n))).toBe(
      false,
    );
  });
});

describe('isGreaterThanOrEqualTo', () => {
  it('holds for an equal fraction', () => {
    expect(
      Fraction.isGreaterThanOrEqualTo(Fraction.makeUnsafe(6n, 5n), Fraction.makeUnsafe(6n, 5n)),
    ).toBe(true);
  });

  it('fails for a smaller fraction', () => {
    expect(
      Fraction.isGreaterThanOrEqualTo(Fraction.makeUnsafe(6n, 5n), Fraction.makeUnsafe(5n, 4n)),
    ).toBe(false);
  });
});

describe('isLessThanOrEqualTo', () => {
  it('holds for an equal fraction', () => {
    expect(
      Fraction.isLessThanOrEqualTo(Fraction.makeUnsafe(6n, 5n), Fraction.makeUnsafe(6n, 5n)),
    ).toBe(true);
  });

  it('fails for a larger fraction', () => {
    expect(
      Fraction.isLessThanOrEqualTo(Fraction.makeUnsafe(5n, 4n), Fraction.makeUnsafe(6n, 5n)),
    ).toBe(false);
  });
});

describe('format', () => {
  it('writes the numerator over the denominator', () => {
    expect(Fraction.format(Fraction.makeUnsafe(6n, 5n))).toBe('6/5');
  });

  it('writes a whole fraction as its numerator alone', () => {
    expect(Fraction.format(Fraction.makeUnsafe(4n, 2n))).toBe('2');
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
    expect(Fraction.toNumber(Fraction.makeUnsafe(6n, 5n))).toBe(1.2);
  });

  it('rounds a tie to the even number', () => {
    expect(Fraction.toNumber(Fraction.makeUnsafe(2n ** 53n + 1n, 1n))).toBe(2 ** 53);
    expect(Fraction.toNumber(Fraction.makeUnsafe(2n ** 53n + 3n, 1n))).toBe(2 ** 53 + 4);
  });

  it('converts a fraction whose fields are beyond the numbers JavaScript can hold', () => {
    expect(Fraction.toNumber(Fraction.makeUnsafe(10n ** 400n + 1n, 10n ** 400n))).toBe(1);
  });

  it('rounds to the grid of the subnormal numbers', () => {
    expect(Fraction.toNumber(Fraction.makeUnsafe(1n, 2n ** 1074n))).toBe(Number.MIN_VALUE);
    expect(Fraction.toNumber(Fraction.makeUnsafe(3n, 2n ** 1076n))).toBe(Number.MIN_VALUE);
    expect(Fraction.toNumber(Fraction.makeUnsafe(1n, 2n ** 1075n))).toBe(0);
  });

  it('rounds to the largest number or beyond it to infinity', () => {
    expect(Fraction.toNumber(Fraction.makeUnsafe(2n ** 1024n - 2n ** 971n, 1n))).toBe(
      Number.MAX_VALUE,
    );
    expect(Fraction.toNumber(Fraction.makeUnsafe(2n ** 1024n - 2n ** 970n, 1n))).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  it.prop(
    'rounds as IEEE 754 divides whole numbers a number holds exactly',
    [ExactRatio],
    ([ratio]) => {
      expect(Fraction.toNumber(Fraction.makeUnsafe(ratio.numerator, ratio.denominator))).toBe(
        Number(ratio.numerator) / Number(ratio.denominator),
      );
    },
  );
});
