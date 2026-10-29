import { Order, Schema } from 'effect';

/** A schema of a ratio of two positive whole numbers, held as big integers so that no arithmetic on it overflows. */
export const Fraction = Schema.Struct({
  numerator: Schema.BigInt.pipe(Schema.check(Schema.isGreaterThanBigInt(0n))),
  denominator: Schema.BigInt.pipe(Schema.check(Schema.isGreaterThanBigInt(0n))),
});

/** A ratio of two positive whole numbers, which stays positive under every operation here, so that none of them can fail. */
export type Fraction = typeof Fraction.Type;

const greatestCommonDivisor = (a: bigint, b: bigint): bigint =>
  b === 0n ? a : greatestCommonDivisor(b, a % b);

/** The fraction of the numerator over the denominator in lowest terms, so that equal ratios have equal fields. Its fields are positive as long as the numerator and the denominator are, which the schema checks wherever a fraction comes from outside. */
export const make = (numerator: bigint, denominator: bigint): Fraction => {
  const divisor = greatestCommonDivisor(numerator, denominator);
  return divisor === 0n
    ? { numerator, denominator }
    : { numerator: numerator / divisor, denominator: denominator / divisor };
};

/** The fraction 1. */
export const one = make(1n, 1n);

/** The sum of two fractions. */
export const sum = (self: Fraction, that: Fraction): Fraction =>
  make(
    self.numerator * that.denominator + that.numerator * self.denominator,
    self.denominator * that.denominator,
  );

/** The product of two fractions. */
export const multiply = (self: Fraction, that: Fraction): Fraction =>
  make(self.numerator * that.numerator, self.denominator * that.denominator);

/** The quotient of two fractions. */
export const divide = (self: Fraction, that: Fraction): Fraction =>
  make(self.numerator * that.denominator, self.denominator * that.numerator);

/** The fraction raised to a whole exponent, negative exponents inverting it. */
export const pow = (self: Fraction, exponent: bigint): Fraction =>
  exponent < 0n
    ? make(self.denominator ** -exponent, self.numerator ** -exponent)
    : make(self.numerator ** exponent, self.denominator ** exponent);

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

/** The fraction written as its numerator over its denominator, such as 6/5. */
export const format = (self: Fraction): string => `${self.numerator}/${self.denominator}`;

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

/** The value of the fraction as a number, rounded to the nearest one that JavaScript can hold. */
export const toNumber = (self: Fraction): number =>
  Number(self.numerator) / Number(self.denominator);
