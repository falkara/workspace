import { Exit, Order, Schema, SchemaGetter } from 'effect';

/** The greatest common divisor, found in a loop rather than by recursion, so that whole numbers of any size never exhaust the call stack. */
const greatestCommonDivisor = (a: bigint, b: bigint): bigint => {
  let [dividend, divisor] = [a, b];
  while (divisor !== 0n) {
    [dividend, divisor] = [divisor, dividend % divisor];
  }
  return dividend;
};

/** A schema of a ratio of two positive whole numbers, held as big integers so that no arithmetic on it overflows, and decoded in lowest terms so that equal ratios have equal fields and every operation here keeps them so. */
export const Fraction = Schema.Struct({
  numerator: Schema.BigInt.pipe(
    Schema.check(
      Schema.isGreaterThanBigInt(0n, {
        message:
          'Expected a positive numerator, so that every operation on the fraction keeps it positive',
      }),
    ),
  ),
  denominator: Schema.BigInt.pipe(
    Schema.check(
      Schema.isGreaterThanBigInt(0n, {
        message:
          'Expected a positive denominator, so that every operation on the fraction keeps it positive',
      }),
    ),
  ),
}).pipe(
  Schema.decode({
    decode: SchemaGetter.transform((fraction) => ({
      numerator:
        fraction.numerator / greatestCommonDivisor(fraction.numerator, fraction.denominator),
      denominator:
        fraction.denominator / greatestCommonDivisor(fraction.numerator, fraction.denominator),
    })),
    encode: SchemaGetter.passthrough(),
  }),
  Schema.brand('Fraction'),
);

/** A ratio of two positive whole numbers in lowest terms, which stays positive and in lowest terms under every operation here, so that none of them can fail. */
export type Fraction = typeof Fraction.Type;

/** The fraction of the numerator over the denominator in lowest terms, or a failure with the reason when either is not positive. */
export const make = (
  numerator: bigint,
  denominator: bigint,
): Exit.Exit<Fraction, Schema.SchemaError> =>
  Schema.decodeExit(Fraction)({ numerator, denominator }, { errors: 'all' });

/** The fraction of a numerator and a denominator known to be positive, such as the constants of this library, in lowest terms. A literal that is not positive is refused by its type as the code is written, but nothing is checked as it runs, so a computed numerator or denominator that is not positive gives a value that breaks every promise of the type; `make` checks them. */
export const makeUnsafe = <Numerator extends bigint, Denominator extends bigint>(
  numerator: `${Numerator}` extends `-${string}` | '0' ? never : Numerator,
  denominator: `${Denominator}` extends `-${string}` | '0' ? never : Denominator,
): Fraction => {
  const divisor = greatestCommonDivisor(numerator, denominator);
  return (
    divisor === 0n
      ? { numerator, denominator }
      : { numerator: numerator / divisor, denominator: denominator / divisor }
  ) as Fraction;
};

/** The fraction 1. */
export const one = makeUnsafe(1n, 1n);

/** The sum of two fractions in lowest terms, reduced only by the common divisor of the denominators, as Knuth gives it, so that no divisor is sought between two large products. */
export const sum = (self: Fraction, that: Fraction): Fraction => {
  const divisor = greatestCommonDivisor(self.denominator, that.denominator);
  const numerator =
    self.numerator * (that.denominator / divisor) + that.numerator * (self.denominator / divisor);
  const remainingDivisor = greatestCommonDivisor(numerator, divisor);
  return {
    numerator: numerator / remainingDivisor,
    denominator: (self.denominator / divisor) * (that.denominator / remainingDivisor),
  } as Fraction;
};

/** The difference of the first fraction less the second in lowest terms, or a failure with the reason when the second is not smaller, as a difference that is not positive is no fraction. */
export const subtract = (self: Fraction, that: Fraction): Exit.Exit<Fraction, Schema.SchemaError> =>
  make(
    self.numerator * that.denominator - that.numerator * self.denominator,
    self.denominator * that.denominator,
  );

/** The difference of a fraction less one known to be smaller, such as a factor of this library less 1, in lowest terms, reduced only by the common divisor of the denominators, as Knuth gives it. Nothing is checked as it runs, so a second fraction that is not smaller gives a value that breaks every promise of the type; `subtract` checks it. */
export const subtractUnsafe = (self: Fraction, that: Fraction): Fraction => {
  const divisor = greatestCommonDivisor(self.denominator, that.denominator);
  const numerator =
    self.numerator * (that.denominator / divisor) - that.numerator * (self.denominator / divisor);
  const remainingDivisor = greatestCommonDivisor(numerator, divisor);
  return {
    numerator: numerator / remainingDivisor,
    denominator: (self.denominator / divisor) * (that.denominator / remainingDivisor),
  } as Fraction;
};

/** The product of two fractions in lowest terms, each numerator cancelled against the other denominator before they multiply, so that no divisor is sought between two large products. */
export const multiply = (self: Fraction, that: Fraction): Fraction => {
  const selfDivisor = greatestCommonDivisor(self.numerator, that.denominator);
  const thatDivisor = greatestCommonDivisor(that.numerator, self.denominator);
  return {
    numerator: (self.numerator / selfDivisor) * (that.numerator / thatDivisor),
    denominator: (self.denominator / thatDivisor) * (that.denominator / selfDivisor),
  } as Fraction;
};

/** The quotient of two fractions in lowest terms, the numerators and the denominators cancelled against each other before they multiply, so that no divisor is sought between two large products. */
export const divide = (self: Fraction, that: Fraction): Fraction => {
  const numeratorDivisor = greatestCommonDivisor(self.numerator, that.numerator);
  const denominatorDivisor = greatestCommonDivisor(self.denominator, that.denominator);
  return {
    numerator: (self.numerator / numeratorDivisor) * (that.denominator / denominatorDivisor),
    denominator: (self.denominator / denominatorDivisor) * (that.numerator / numeratorDivisor),
  } as Fraction;
};

/** The fraction raised to a whole exponent, negative exponents inverting it, in lowest terms as the powers of numbers without a common divisor have none. */
export const pow = (self: Fraction, exponent: bigint): Fraction =>
  (exponent < 0n
    ? { numerator: self.denominator ** -exponent, denominator: self.numerator ** -exponent }
    : {
        numerator: self.numerator ** exponent,
        denominator: self.denominator ** exponent,
      }) as Fraction;

/** The order of fractions by value, compared through cross products, so that no division rounds them. */
export const order: Order.Order<Fraction> = Order.make((self, that) =>
  Order.BigInt(self.numerator * that.denominator, that.numerator * self.denominator),
);

/** Whether the first fraction is greater than the second. */
export const isGreaterThan = Order.isGreaterThan(order);

/** Whether the first fraction is greater than or equal to the second. */
export const isGreaterThanOrEqualTo = Order.isGreaterThanOrEqualTo(order);

/** Whether the first fraction is less than or equal to the second. */
export const isLessThanOrEqualTo = Order.isLessThanOrEqualTo(order);

/** The fraction written as its numerator over its denominator, such as 6/5, or as its numerator alone when it is whole. */
export const format = (self: Fraction): string =>
  self.denominator === 1n ? `${self.numerator}` : `${self.numerator}/${self.denominator}`;

/** A schema check that a fraction is greater than the given one. */
export const isGreaterThanFraction = Schema.makeIsGreaterThan({ order, formatter: format });

/** A schema check that a fraction is greater than or equal to the given one. */
export const isGreaterThanOrEqualToFraction = Schema.makeIsGreaterThanOrEqualTo({
  order,
  formatter: format,
});

/** A schema check that a fraction is less than or equal to the given one. */
export const isLessThanOrEqualToFraction = Schema.makeIsLessThanOrEqualTo({
  order,
  formatter: format,
});

/** The value of the fraction as the nearest number JavaScript can hold, ties to even, rounded once on whole numbers, so that fractions of any size convert exactly as IEEE 754 rounds. */
export const toNumber = (self: Fraction): number => {
  // The fraction lies between 2 to the power of the exponent less 1 and 2 to the power of the exponent plus 1.
  const exponent = self.numerator.toString(2).length - self.denominator.toString(2).length;
  // The power of two that brings the quotient to the 53 bits of a number, or to the grid of the smallest subnormal number.
  const shift = Math.min(
    (
      exponent >= 0
        ? self.numerator >= self.denominator << BigInt(exponent)
        : self.numerator << BigInt(-exponent) >= self.denominator
    )
      ? 52 - exponent
      : 53 - exponent,
    1074,
  );
  const scaledNumerator = shift >= 0 ? self.numerator << BigInt(shift) : self.numerator;
  const scaledDenominator = shift >= 0 ? self.denominator : self.denominator << BigInt(-shift);
  const quotient = scaledNumerator / scaledDenominator;
  const twiceRemainder = (scaledNumerator % scaledDenominator) * 2n;
  return (
    Number(
      twiceRemainder > scaledDenominator ||
        (twiceRemainder === scaledDenominator && quotient % 2n === 1n)
        ? quotient + 1n
        : quotient,
    ) *
    2 ** -shift
  );
};
