import { Order, Schema } from 'effect';

/** A schema of a ratio of two whole numbers, with a positive denominator. */
export const Fraction = Schema.Struct({
  numerator: Schema.Int,
  denominator: Schema.Int.pipe(Schema.check(Schema.isGreaterThan(0))),
});

/** A ratio of two whole numbers, with a positive denominator. */
export type Fraction = typeof Fraction.Type;

const greatestCommonDivisor = (a: number, b: number): number =>
  b === 0 ? Math.abs(a) : greatestCommonDivisor(b, a % b);

/** The fraction of the numerator over the denominator, in lowest terms with a positive denominator, so that equal ratios have equal fields. */
export const make = (numerator: number, denominator: number): Fraction => {
  const divisor = greatestCommonDivisor(numerator, denominator) * Math.sign(denominator);
  return Schema.decodeSync(Fraction)({
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  });
};

/** The fraction of a number over 1. */
export const fromNumber = (value: number): Fraction => make(value, 1);

/** The fraction 1. */
export const one = fromNumber(1);

/** The product of two fractions. */
export const multiply = (self: Fraction, that: Fraction): Fraction =>
  make(self.numerator * that.numerator, self.denominator * that.denominator);

/** The quotient of two fractions, which throws when the divisor is zero. */
export const divide = (self: Fraction, that: Fraction): Fraction =>
  make(self.numerator * that.denominator, self.denominator * that.numerator);

/** The fraction raised to a whole exponent, negative exponents inverting it. */
export const pow = (self: Fraction, exponent: number): Fraction =>
  exponent < 0
    ? make(self.denominator ** -exponent, self.numerator ** -exponent)
    : make(self.numerator ** exponent, self.denominator ** exponent);

/** The order of fractions by value, compared through cross products, so that no division rounds them. */
export const order: Order.Order<Fraction> = Order.make((self, that) =>
  Order.Number(self.numerator * that.denominator, that.numerator * self.denominator),
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

/** The value of the fraction as a number, rounded to the nearest one that JavaScript can hold. */
export const toNumber = (self: Fraction): number => self.numerator / self.denominator;
