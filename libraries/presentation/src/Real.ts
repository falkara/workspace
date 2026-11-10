import { BigDecimal, Rational } from 'effect';

/** The bounds of a real number at a precision, a number of bits: two whole numbers over 2 to the precision, the lower at most the number and the upper at least it. */
export interface Bounds {
  readonly lower: bigint;
  readonly upper: bigint;
}

/**
 * An exact real number: bounds at any precision, which narrow toward it as the precision grows, and what is known of it. Every bound is rounded outward, the lower down and the upper up, to whole numbers over 2 to the precision, so that the numbers stay small and every bound still holds. Nothing is claimed about the number that its bounds do not prove, except what `rational` and `irrational` state, each proved where it is set.
 */
export interface Real {
  /** Its bounds at a precision, or none where they cannot yet be given, as for a quotient whose divisor may still be 0 at that precision. */
  readonly bounds: (precision: number) => Bounds | undefined;
  /** Its exact value, when it is known to be rational. */
  readonly rational: Rational.Rational | undefined;
  /** Whether it is known to be irrational, so that it never equals a rational number. */
  readonly irrational: boolean;
}

/** The floor of a quotient of whole numbers, whatever their signs. The divisor is never 0 where it is called. */
const floorDivide = (dividend: bigint, divisor: bigint): bigint => {
  const quotient = dividend / divisor;
  return quotient * divisor !== dividend && dividend < 0n !== divisor < 0n
    ? quotient - 1n
    : quotient;
};

/** The ceiling of a quotient of whole numbers, whatever their signs. The divisor is never 0 where it is called. */
const ceilDivide = (dividend: bigint, divisor: bigint): bigint => -floorDivide(-dividend, divisor);

/** The number of bits of a whole number, 0 for 0. */
const bitLength = (value: bigint): number =>
  value === 0n ? 0 : value.toString(2).length - (value < 0n ? 1 : 0);

/** The floor of the n-th root of a whole number that is not negative, by Newton's method on whole numbers, which decreases from above to the floor and stops there. */
const rootFloor = (value: bigint, n: number): bigint => {
  if (value < 2n) {
    return value;
  }
  const degree = BigInt(n);
  // A start above the root: 2 to the number of bits over n, rounded up.
  let estimate = 1n << BigInt(Math.ceil(bitLength(value) / n));
  for (;;) {
    const next = ((degree - 1n) * estimate + value / estimate ** (degree - 1n)) / degree;
    if (next >= estimate) {
      return estimate;
    }
    estimate = next;
  }
};

/** The ceiling of the n-th root of a whole number that is not negative. */
const rootCeil = (value: bigint, n: number): bigint => {
  const floor = rootFloor(value, n);
  return floor ** BigInt(n) === value ? floor : floor + 1n;
};

/** Whether a rational number that is not negative is the n-th power of a rational number, and which: in lowest terms, it is exactly when its numerator and its denominator are each the n-th power of a whole number. */
const rationalRoot = (value: Rational.Rational, n: number): Rational.Rational | undefined =>
  rootFloor(value.numerator, n) ** BigInt(n) === value.numerator &&
  rootFloor(value.denominator, n) ** BigInt(n) === value.denominator
    ? Rational.makeUnsafe(rootFloor(value.numerator, n), rootFloor(value.denominator, n))
    : undefined;

/** A real number that computes its bounds once for each precision it is asked at, as the same number is often read many times within one expression. */
const make = (
  compute: (precision: number) => Bounds | undefined,
  rational: Rational.Rational | undefined,
  irrational: boolean,
): Real => {
  const known = new Map<number, Bounds | undefined>();
  return {
    bounds: (precision) => {
      if (!known.has(precision)) {
        known.set(precision, compute(precision));
      }
      return known.get(precision);
    },
    rational,
    irrational,
  };
};

/** The bits each operation asks of its operands beyond the precision it gives, so that the rounding of the operands stays below the rounding of the result. */
const guard = 4;

/** A rational number as a real number, its bounds the floor and the ceiling of it at each precision. */
export const fromRational = (value: Rational.Rational): Real =>
  make(
    (precision) => ({
      lower: floorDivide(value.numerator << BigInt(precision), value.denominator),
      upper: ceilDivide(value.numerator << BigInt(precision), value.denominator),
    }),
    value,
    false,
  );

/** The sum of two real numbers: the sum of the lower bounds is at most it and the sum of the upper bounds at least it. Rational when both are; irrational when one is and the other rational. */
export const add = (augend: Real, addend: Real): Real =>
  make(
    (precision) => {
      const first = augend.bounds(precision + guard);
      const second = addend.bounds(precision + guard);
      return first && second
        ? {
            lower: floorDivide(first.lower + second.lower, 1n << BigInt(guard)),
            upper: ceilDivide(first.upper + second.upper, 1n << BigInt(guard)),
          }
        : undefined;
    },
    augend.rational && addend.rational ? Rational.sum(augend.rational, addend.rational) : undefined,
    (augend.irrational && addend.rational !== undefined) ||
      (addend.irrational && augend.rational !== undefined),
  );

/** The negative of a real number: its bounds swapped and negated. */
export const negate = (value: Real): Real =>
  make(
    (precision) => {
      const bounds = value.bounds(precision);
      return bounds && { lower: -bounds.upper, upper: -bounds.lower };
    },
    value.rational && Rational.negate(value.rational),
    value.irrational,
  );

/** The difference of two real numbers. */
export const subtract = (minuend: Real, subtrahend: Real): Real => add(minuend, negate(subtrahend));

/** The product of two real numbers: the least and the greatest of the four products of their bounds bound it, whatever the signs, as a product is linear in each factor. Rational when both are, and 0 when either is 0; irrational when one is irrational and the other rational and not 0. */
export const multiply = (multiplicand: Real, multiplier: Real): Real =>
  make(
    (precision) => {
      const first = multiplicand.bounds(precision + guard);
      const second = multiplier.bounds(precision + guard);
      if (!first || !second) {
        return undefined;
      }
      const products = [
        first.lower * second.lower,
        first.lower * second.upper,
        first.upper * second.lower,
        first.upper * second.upper,
      ];
      const least = products.reduce((a, b) => (b < a ? b : a));
      const greatest = products.reduce((a, b) => (b > a ? b : a));
      return {
        lower: floorDivide(least, 1n << BigInt(precision + 2 * guard)),
        upper: ceilDivide(greatest, 1n << BigInt(precision + 2 * guard)),
      };
    },
    (multiplicand.rational && Rational.isZero(multiplicand.rational)) ||
      (multiplier.rational && Rational.isZero(multiplier.rational))
      ? Rational.fromBigInt(0n)
      : multiplicand.rational && multiplier.rational
        ? Rational.multiply(multiplicand.rational, multiplier.rational)
        : undefined,
    (multiplicand.irrational &&
      multiplier.rational !== undefined &&
      !Rational.isZero(multiplier.rational)) ||
      (multiplier.irrational &&
        multiplicand.rational !== undefined &&
        !Rational.isZero(multiplicand.rational)),
  );

/** The square of a real number: like a product of it with itself, but 0 at least where its bounds hold 0, as no square is negative. */
export const square = (value: Real): Real =>
  make(
    (precision) => {
      const bounds = value.bounds(precision + guard);
      if (!bounds) {
        return undefined;
      }
      const greatest =
        bounds.lower * bounds.lower > bounds.upper * bounds.upper
          ? bounds.lower * bounds.lower
          : bounds.upper * bounds.upper;
      const least =
        bounds.lower <= 0n && bounds.upper >= 0n
          ? 0n
          : bounds.lower * bounds.lower < bounds.upper * bounds.upper
            ? bounds.lower * bounds.lower
            : bounds.upper * bounds.upper;
      return {
        lower: floorDivide(least, 1n << BigInt(precision + 2 * guard)),
        upper: ceilDivide(greatest, 1n << BigInt(precision + 2 * guard)),
      };
    },
    value.rational && Rational.multiply(value.rational, value.rational),
    false,
  );

/** The quotient of two real numbers: where the bounds of the divisor hold no 0, the least and the greatest of the four quotients of their bounds bound it, as a quotient is monotone in each operand away from a divisor of 0; none where they still hold 0. Rational when both are; irrational when one is irrational and the other rational and not 0. */
export const divide = (dividend: Real, divisor: Real): Real =>
  make(
    (precision) => {
      const first = dividend.bounds(precision + guard);
      const second = divisor.bounds(precision + guard);
      if (!first || !second || (second.lower <= 0n && second.upper >= 0n)) {
        return undefined;
      }
      // The bounds of the divisor hold no 0, so no division below divides by 0.
      const lowers = [
        floorDivide(first.lower << BigInt(precision), second.lower),
        floorDivide(first.lower << BigInt(precision), second.upper),
        floorDivide(first.upper << BigInt(precision), second.lower),
        floorDivide(first.upper << BigInt(precision), second.upper),
      ];
      const uppers = [
        ceilDivide(first.lower << BigInt(precision), second.lower),
        ceilDivide(first.lower << BigInt(precision), second.upper),
        ceilDivide(first.upper << BigInt(precision), second.lower),
        ceilDivide(first.upper << BigInt(precision), second.upper),
      ];
      return {
        lower: lowers.reduce((a, b) => (b < a ? b : a)),
        upper: uppers.reduce((a, b) => (b > a ? b : a)),
      };
    },
    dividend.rational && divisor.rational && !Rational.isZero(divisor.rational)
      ? Rational.divideUnsafe(dividend.rational, divisor.rational)
      : undefined,
    (dividend.irrational && divisor.rational !== undefined && !Rational.isZero(divisor.rational)) ||
      (divisor.irrational &&
        dividend.rational !== undefined &&
        !Rational.isZero(dividend.rational)),
  );

/** The n-th root of a real number that is not negative, n a whole number from 2: the root is increasing, so the floor of the root of the lower bound is at most it and the ceiling of the root of the upper bound at least it, each found exactly on whole numbers. A lower bound below 0, which rounding may give a number at 0, counts as 0. A root of 2 to a power is taken as that many square roots in turn, which keeps the numbers small. Rational when the number is the n-th power of a rational number; irrational when it is rational and is not. */
export const root = (value: Real, n: number): Real => {
  const exact = value.rational && rationalRoot(value.rational, n);
  if (n % 2 === 0 && n > 2) {
    // The roots taken in turn cannot tell what the root is, so it is decided at once.
    return {
      ...root(root(value, 2), n / 2),
      rational: exact,
      irrational: value.rational !== undefined && exact === undefined,
    };
  }
  return make(
    (precision) => {
      const bounds = value.bounds(precision + guard);
      // The value at the precision of the root, scaled so that its n-th root is the root at that precision: (bound / 2^(p + guard) · 2^(p n))^(1/n).
      const shift = BigInt(precision * n - precision - guard);
      return bounds
        ? {
            lower: rootFloor((bounds.lower < 0n ? 0n : bounds.lower) << shift, n),
            upper: rootCeil((bounds.upper < 0n ? 0n : bounds.upper) << shift, n),
          }
        : undefined;
    },
    exact,
    value.rational !== undefined && exact === undefined,
  );
};

/** The power of a real number by a whole number, by squaring in turn. */
const wholePower = (value: Real, exponent: bigint): Real =>
  exponent === 1n
    ? value
    : exponent % 2n === 0n
      ? square(wholePower(value, exponent / 2n))
      : multiply(value, square(wholePower(value, exponent / 2n)));

/** A real number that is not negative to a rational power that is positive, x^(p/q) taken as the p-th power of the q-th root. With p and q in lowest terms, x^(p/q) is rational exactly when x^(1/q) is, by Bézout's identity, so it is irrational when x is rational and not the q-th power of a rational number. */
export const power = (value: Real, exponent: Rational.Rational): Real => {
  const base = exponent.denominator === 1n ? value : root(value, Number(exponent.denominator));
  // The squares the power is taken by cannot tell whether it is irrational, so it is carried over from the root.
  return { ...wholePower(base, exponent.numerator), irrational: base.irrational };
};

/** The bits every bound of a logarithm or an exponential asks of the square roots or the squares it is worked out with, beyond its precision, to keep their rounding and the gap of the inequalities below it. */
const transcendentalGuard = 16;

/**
 * The natural logarithm of a positive real number, by the method of Briggs: with s its 2^m-th root, taken by m square roots in turn, 2^m (1 − 1 / s) ≤ ln x ≤ 2^m (s − 1), from x / (1 + x) < ln(1 + x) and ln x ≤ x − 1, whose gap of about (ln x)² / 2^(m + 1) closes as m grows. Each side is increasing in s, so the lower bound of s gives the lower bound and the upper the upper. Irrational when the number is rational and not 1, by the Lindemann–Weierstrass theorem, as e to an algebraic number other than 0 is transcendental; 0 when it is 1.
 *
 * @see https://dlmf.nist.gov/4.5#E1
 * @see https://dlmf.nist.gov/4.5#E4
 */
export const ln = (value: Real): Real =>
  make(
    (precision) => {
      const halvings =
        precision +
        transcendentalGuard +
        2 * bitLength(BigInt(bitLength((value.bounds(8)?.upper ?? 2n) + 1n) + 8));
      const working = precision + halvings + transcendentalGuard;
      const bounds = value.bounds(working);
      if (!bounds || bounds.lower <= 0n) {
        return undefined;
      }
      let lower = bounds.lower;
      let upper = bounds.upper;
      for (let halving = 0; halving < halvings; halving++) {
        lower = rootFloor(lower << BigInt(working), 2);
        upper = rootCeil(upper << BigInt(working), 2);
      }
      return {
        lower: floorDivide(
          (lower - (1n << BigInt(working))) << BigInt(halvings + precision),
          lower,
        ),
        upper: ceilDivide(
          (upper - (1n << BigInt(working))) << BigInt(halvings + precision),
          1n << BigInt(working),
        ),
      };
    },
    value.rational && Rational.equals(value.rational, Rational.fromBigInt(1n))
      ? Rational.fromBigInt(0n)
      : undefined,
    value.rational !== undefined && !Rational.equals(value.rational, Rational.fromBigInt(1n)),
  );

/**
 * The exponential of a real number, by (1 + y/n)^n ≤ e^y ≤ (1 − y/n)^(−n) for |y| < n, from 1 + x < e^x and e^x < 1 / (1 − x) for x < 1, taken at n = 2^m by m squarings, whose gap closes as m grows. Each side is increasing in y, so the lower bound of y gives the lower bound and the upper the upper. Irrational when the number is rational and not 0, by the Lindemann–Weierstrass theorem; 1 when it is 0.
 *
 * @see https://dlmf.nist.gov/4.5#E8
 * @see https://dlmf.nist.gov/4.5#E9
 */
export const exp = (value: Real): Real =>
  make(
    (precision) => {
      const magnitude = bitLength(
        (value.bounds(0)?.upper ?? 0n) > -(value.bounds(0)?.lower ?? 0n)
          ? (value.bounds(0)?.upper ?? 0n) + 1n
          : -(value.bounds(0)?.lower ?? 0n) + 1n,
      );
      const squarings = precision + transcendentalGuard + 2 * magnitude + 2;
      const working = precision + squarings + transcendentalGuard + 2 * magnitude;
      const bounds = value.bounds(working);
      if (!bounds) {
        return undefined;
      }
      const one = 1n << BigInt(working);
      // 1 + y/n and 1 − y/n at the working precision, rounded so that the lower base stays below and the upper base, which is inverted, also stays below.
      let lower = one + floorDivide(bounds.lower, 1n << BigInt(squarings));
      let denominator = one - ceilDivide(bounds.upper, 1n << BigInt(squarings));
      if (lower <= 0n || denominator <= 0n) {
        return undefined;
      }
      for (let squaring = 0; squaring < squarings; squaring++) {
        lower = floorDivide(lower * lower, one);
        denominator = floorDivide(denominator * denominator, one);
      }
      return {
        lower: floorDivide(lower, 1n << BigInt(working - precision)),
        upper: ceilDivide(one << BigInt(precision), denominator),
      };
    },
    value.rational && Rational.isZero(value.rational) ? Rational.fromBigInt(1n) : undefined,
    value.rational !== undefined && !Rational.isZero(value.rational),
  );

/**
 * π, by the method of Archimedes: with c = cos(π / 2^m), found from cos(π / 2) = 0 by the half-angle formula cos(z / 2) = ((1 + cos z) / 2)^(1/2), and s = sin(π / 2^m) = (1 − c²)^(1/2), 2^m s ≤ π ≤ 2^m s / c, from sin x ≤ x ≤ tan x, the perimeters of the polygons of 2^(m + 1) sides inscribed in and circumscribed about the circle. Irrational.
 *
 * @see https://dlmf.nist.gov/4.18#E1
 * @see https://dlmf.nist.gov/4.18#E2
 * @see https://dlmf.nist.gov/4.21#E22
 */
export const pi: Real = make(
  (precision) => {
    const halvings = Math.ceil(precision / 2) + 4;
    const working = precision + 2 * halvings + transcendentalGuard;
    const one = 1n << BigInt(working);
    // cos(π / 2) is 0; each half-angle step is increasing in the cosine, so the bounds carry over.
    let lower = 0n;
    let upper = 0n;
    for (let halving = 1; halving < halvings; halving++) {
      lower = rootFloor((one + lower) << BigInt(working - 1), 2);
      upper = rootCeil((one + upper) << BigInt(working - 1), 2);
    }
    // The sine is decreasing in the cosine here, so the upper cosine gives the lower sine.
    const sineLower = rootFloor((one * one - upper * upper) << 0n, 2);
    const sineUpper = rootCeil((one * one - lower * lower) << 0n, 2);
    return {
      lower: floorDivide(sineLower << BigInt(halvings + precision), one),
      upper: ceilDivide(sineUpper << BigInt(halvings + precision), lower),
    };
  },
  undefined,
  true,
);

/** The cosine and the sine of an angle in radians at a precision, computed together. */
const cosineAndSine = (angle: Real) => {
  const known = new Map<number, readonly [Bounds, Bounds] | undefined>();
  return (precision: number): readonly [Bounds, Bounds] | undefined => {
    if (!known.has(precision)) {
      known.set(precision, computeCosineAndSine(angle, precision));
    }
    return known.get(precision);
  };
};

/**
 * The bounds of the cosine and the sine of an angle in radians: the angle taken to [0, 2π) by a whole number of turns, which changes neither, halved m times to a small angle φ, bounded there, and doubled back m times. For 0 ≤ φ ≤ 1, φ − φ³/2 ≤ sin φ ≤ φ, from sin x ≤ x and cos x ≤ sin x / x with cos x ≥ 1 − x²/2; and 1 − φ²/2 ≤ cos φ ≤ 1 − 2 (φ/2 − (φ/2)³/2)², from cos φ = 1 − 2 sin²(φ/2) and the bounds of the sine. Doubling takes cos 2φ = 2 cos² φ − 1 and sin 2φ = 2 sin φ cos φ in interval arithmetic.
 */
const computeCosineAndSine = (
  angle: Real,
  precision: number,
): readonly [Bounds, Bounds] | undefined => {
  const halvings = precision + transcendentalGuard;
  const working = 3 * precision + 3 * transcendentalGuard;
  const one = 1n << BigInt(working);
  const turnBounds = pi.bounds(working);
  const angleBounds = angle.bounds(working);
  if (!turnBounds || !angleBounds) {
    return undefined;
  }
  // A whole number of turns, small enough that the reduced angle is not negative: the lower bound of the angle over the upper bound of a turn.
  const turns = floorDivide(angleBounds.lower, 2n * turnBounds.upper);
  // The reduced angle θ − 2πk, its lower bound using the upper bound of π where k is positive and the lower where it is negative, and the reverse for the upper.
  const reducedLower =
    angleBounds.lower - 2n * turns * (turns > 0n ? turnBounds.upper : turnBounds.lower);
  const reducedUpper =
    angleBounds.upper - 2n * turns * (turns > 0n ? turnBounds.lower : turnBounds.upper);
  // The small angle φ, not negative, as the reduced angle is not.
  const phiLower = reducedLower < 0n ? 0n : floorDivide(reducedLower, 1n << BigInt(halvings));
  const phiUpper = ceilDivide(reducedUpper, 1n << BigInt(halvings));
  const cube = (value: bigint): bigint => floorDivide(value * value * value, one * one);
  // φ − φ³/2 is increasing for φ ≤ 1, so the lower φ gives the lower sine; the upper is φ itself.
  let sineLower = phiLower - ceilDivide(phiLower * phiLower * phiLower, 2n * one * one);
  let sineUpper = phiUpper;
  // 1 − φ²/2 is decreasing, so the upper φ gives the lower cosine; the upper cosine uses the lower φ.
  let cosineLower = one - ceilDivide(phiUpper * phiUpper, 2n * one);
  const halfLower = phiLower / 2n - ceilDivide(cube(phiLower / 2n + 1n), 2n);
  let cosineUpper = one - floorDivide(2n * (halfLower < 0n ? 0n : halfLower) ** 2n, one);
  for (let doubling = 0; doubling < halvings; doubling++) {
    const squareOfLower = cosineLower * cosineLower;
    const squareOfUpper = cosineUpper * cosineUpper;
    const squareUpper = squareOfLower > squareOfUpper ? squareOfLower : squareOfUpper;
    const squareLower =
      cosineLower <= 0n && cosineUpper >= 0n
        ? 0n
        : squareOfLower < squareOfUpper
          ? squareOfLower
          : squareOfUpper;
    const products = [
      sineLower * cosineLower,
      sineLower * cosineUpper,
      sineUpper * cosineLower,
      sineUpper * cosineUpper,
    ];
    const productLower = products.reduce((a, b) => (b < a ? b : a));
    const productUpper = products.reduce((a, b) => (b > a ? b : a));
    cosineLower = floorDivide(2n * squareLower, one) - one;
    cosineUpper = ceilDivide(2n * squareUpper, one) - one;
    sineLower = floorDivide(2n * productLower, one);
    sineUpper = ceilDivide(2n * productUpper, one);
    // Every cosine and sine lies in [−1, 1].
    cosineLower = cosineLower < -one ? -one : cosineLower;
    cosineUpper = cosineUpper > one ? one : cosineUpper;
    sineLower = sineLower < -one ? -one : sineLower;
    sineUpper = sineUpper > one ? one : sineUpper;
  }
  return [
    {
      lower: floorDivide(cosineLower, 1n << BigInt(working - precision)),
      upper: ceilDivide(cosineUpper, 1n << BigInt(working - precision)),
    },
    {
      lower: floorDivide(sineLower, 1n << BigInt(working - precision)),
      upper: ceilDivide(sineUpper, 1n << BigInt(working - precision)),
    },
  ];
};

/**
 * The cosine and the sine of an angle in radians.
 *
 * @see https://dlmf.nist.gov/4.18#E1
 * @see https://dlmf.nist.gov/4.18#E3
 * @see https://dlmf.nist.gov/4.21#E27
 * @see https://dlmf.nist.gov/4.21#E28
 */
export const cosineSine = (angle: Real): readonly [Real, Real] => {
  const both = cosineAndSine(angle);
  return [
    make((precision) => both(precision)?.[0], undefined, false),
    make((precision) => both(precision)?.[1], undefined, false),
  ];
};

/** The bounds of a real number as rational numbers at a precision, or none where they cannot be given. */
export const boundsAt = (
  value: Real,
  precision: number,
): readonly [Rational.Rational, Rational.Rational] | undefined => {
  const bounds = value.bounds(precision);
  return (
    bounds && [
      Rational.makeUnsafe(bounds.lower, 1n << BigInt(precision)),
      Rational.makeUnsafe(bounds.upper, 1n << BigInt(precision)),
    ]
  );
};

/** The precision every decision starts at, coarse enough to be quick and fine enough to settle most decisions at once. */
export const startingPrecision = 32;

/** The precision a decision with a positive width starts at: the first at which the bounds, a few units of it apart, are narrower than the width, so that the width alone sets which numbers count alike. */
const precisionFor = (width: Rational.Rational): number =>
  bitLength(width.denominator / width.numerator) + 2;

/**
 * The sign of a real number. Given a width of 0, the sign is exact: known where the number is known to be rational, and otherwise found by narrowing its bounds, doubling the precision, until they exclude 0, which they do in the end for every number but 0. A number not known to be rational that is 0 is never settled, so a width of 0 is given only where that cannot happen, as for a number known to be rational or irrational. Given a positive width, the number counts as 0 when its bounds still hold 0 at the first precision at which they are narrower than the width, whatever is known of it, so that every number within about the width of 0 counts alike and the decision always ends: a rule of the caller, stated beside each call, not a proof.
 */
export const sign = (value: Real, indistinguishableBelow: Rational.Rational): -1 | 0 | 1 => {
  if (value.rational !== undefined && Rational.isZero(indistinguishableBelow)) {
    return Rational.isZero(value.rational) ? 0 : Rational.isNegative(value.rational) ? -1 : 1;
  }
  for (
    let precision = Rational.isZero(indistinguishableBelow)
      ? startingPrecision
      : precisionFor(indistinguishableBelow);
    ;
    precision *= 2
  ) {
    const bounds = value.bounds(precision);
    if (bounds && bounds.lower > 0n) {
      return 1;
    }
    if (bounds && bounds.upper < 0n) {
      return -1;
    }
    if (
      bounds &&
      Rational.isLessThan(
        Rational.makeUnsafe(bounds.upper - bounds.lower, 1n << BigInt(precision)),
        indistinguishableBelow,
      )
    ) {
      return 0;
    }
  }
};

/**
 * A real number rounded to the nearest whole number of a positive unit, a number exactly halfway rounded toward +∞, as CSS Color 4 rounds the values it serializes, given as that whole number. Given a width of 0, the rounding is exact: worked out where the number is known to be rational, and otherwise found by narrowing its bounds until both round alike, which they do in the end for every number that does not lie halfway, as a number known to be irrational never does, so a width of 0 is given only for a number known to be rational or irrational. Given a positive width, bounds that still round apart at the first precision at which they are narrower than the width count as lying halfway, which rounds toward +∞, whatever is known of the number: a rule of the caller, stated beside each call, not a proof.
 *
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#serializing-color-function-values
 */
export const round = (
  value: Real,
  unit: Rational.Rational,
  indistinguishableBelow: Rational.Rational,
): bigint => {
  // floor(v / u + 1/2) with u = a / b: floor((2 v b + a) / 2 a), the nearest with ties toward +∞.
  if (value.rational !== undefined && Rational.isZero(indistinguishableBelow)) {
    return floorDivide(
      2n * value.rational.numerator * unit.denominator +
        unit.numerator * value.rational.denominator,
      2n * unit.numerator * value.rational.denominator,
    );
  }
  for (
    let precision = Rational.isZero(indistinguishableBelow)
      ? startingPrecision
      : precisionFor(indistinguishableBelow);
    ;
    precision *= 2
  ) {
    const bounds = value.bounds(precision);
    if (bounds) {
      const lower = floorDivide(
        2n * bounds.lower * unit.denominator + (unit.numerator << BigInt(precision)),
        (2n * unit.numerator) << BigInt(precision),
      );
      const upper = floorDivide(
        2n * bounds.upper * unit.denominator + (unit.numerator << BigInt(precision)),
        (2n * unit.numerator) << BigInt(precision),
      );
      if (
        lower === upper ||
        Rational.isLessThan(
          Rational.makeUnsafe(bounds.upper - bounds.lower, 1n << BigInt(precision)),
          indistinguishableBelow,
        )
      ) {
        return upper;
      }
    }
  }
};

/** A real number rounded to a number of decimal places, as `round` rounds it to a unit of 10^−d. */
export const roundToDecimals = (
  value: Real,
  places: number,
  indistinguishableBelow: Rational.Rational,
): Rational.Rational =>
  Rational.makeUnsafe(
    round(value, Rational.makeUnsafe(1n, 10n ** BigInt(places)), indistinguishableBelow),
    10n ** BigInt(places),
  );

/**
 * The number JavaScript holds nearest to a real number, a tie going to the one whose last bit is 0, as IEEE 754 rounds: worked out where the number is known to be rational, and otherwise found by narrowing its bounds until both round to the same number. Bounds that still round apart once narrower than 2^−106 of their size, twice the 53 bits a number holds, or than 2^−1180, far below the smallest number above 0 it holds, count as lying halfway between the two: a rule, not a proof, as a number not known to be rational or irrational may lie halfway without its bounds ever proving it.
 *
 * @see https://262.ecma-international.org/17.0/#sec-ecmascript-language-types-number-type
 */
export const nearestNumber = (value: Real): number => {
  if (value.rational !== undefined) {
    return Rational.toNumberUnsafe(value.rational);
  }
  for (let precision = startingPrecision; ; precision *= 2) {
    const bounds = value.bounds(precision);
    if (bounds) {
      const lower = Rational.toNumberUnsafe(
        Rational.makeUnsafe(bounds.lower, 1n << BigInt(precision)),
      );
      const upper = Rational.toNumberUnsafe(
        Rational.makeUnsafe(bounds.upper, 1n << BigInt(precision)),
      );
      const size = bounds.upper < 0n ? -bounds.lower : bounds.upper;
      if (lower === upper) {
        return lower;
      }
      if (
        !value.irrational &&
        ((bounds.upper - bounds.lower) << 106n <= size ||
          (bounds.upper - bounds.lower) << 1180n <= 1n << BigInt(precision))
      ) {
        // Both numbers are finite, as bounds this narrow lie far within the range of a number, and the halfway point between them rounds to the one whose last bit is 0.
        return Rational.toNumberUnsafe(
          Rational.divideUnsafe(
            Rational.sum(Rational.fromNumberUnsafe(lower), Rational.fromNumberUnsafe(upper)),
            Rational.fromBigInt(2n),
          ),
        );
      }
    }
  }
};

/** The larger of two real numbers: the larger of their lower bounds and the larger of their upper bounds bound it, as the larger is increasing in each. Rational when both are; irrational when both are, as it is one of them. */
export const maximum = (first: Real, second: Real): Real =>
  make(
    (precision) => {
      const firstBounds = first.bounds(precision);
      const secondBounds = second.bounds(precision);
      return firstBounds && secondBounds
        ? {
            lower: firstBounds.lower > secondBounds.lower ? firstBounds.lower : secondBounds.lower,
            upper: firstBounds.upper > secondBounds.upper ? firstBounds.upper : secondBounds.upper,
          }
        : undefined;
    },
    first.rational && second.rational ? Rational.max(first.rational, second.rational) : undefined,
    first.irrational && second.irrational,
  );

/** The smaller of two real numbers, the negative of the larger of their negatives. */
export const minimum = (first: Real, second: Real): Real =>
  negate(maximum(negate(first), negate(second)));

/** The fewest decimal places that write a rational number exactly, when its decimal expansion ends: the larger of the powers of 2 and of 5 in its denominator, as 10^d is a multiple of the denominator exactly from there. When it does not end, its denominator has another prime factor, and the number is written rounded at those places. */
export const exactDecimalPlaces = (value: Rational.Rational): number => {
  let twos = 0;
  let fives = 0;
  let rest = value.denominator;
  while (rest % 2n === 0n) {
    rest /= 2n;
    twos++;
  }
  while (rest % 5n === 0n) {
    rest /= 5n;
    fives++;
  }
  return Math.max(twos, fives);
};

/**
 * A rational number written in decimal as CSS writes a number: rounded to a number of decimal places, to the nearest, a number exactly halfway toward +∞, as CSS Color 4 rounds the values it serializes, and without the zeros that end its fraction, as Effect's `BigDecimal` writes a number. From 16 decimal places on, which only a number written exactly reaches, it is written with an exponent, which CSS reads as well.
 *
 * @see https://www.w3.org/TR/2026/CRD-css-color-4-20261103/#serializing-color-function-values
 */
export const writeDecimals = (value: Rational.Rational, places: number): string =>
  BigDecimal.format(
    // Every number of places the library writes with is a small whole number, a safe integer, so the conversion cannot fail.
    Rational.toBigDecimal(value, { scale: places, mode: 'half-ceil' }),
  );
