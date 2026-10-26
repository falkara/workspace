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

/** The order of fractions by value, compared through cross products, so that no division rounds them. */
export const order: Order.Order<Fraction> = Order.make((self, that) =>
  Order.Number(self.numerator * that.denominator, that.numerator * self.denominator),
);

/** The value of the fraction as a number, rounded to the nearest one that JavaScript can hold. */
export const toNumber = (self: Fraction): number => self.numerator / self.denominator;
