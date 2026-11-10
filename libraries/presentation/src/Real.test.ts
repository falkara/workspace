import { describe, expect, it } from '@effect/vitest';
import { Rational } from 'effect';

import * as Real from '#src/Real';

describe('power', () => {
  it('bounds every power so that the lower bound to the q-th is at most x^p and the upper bound to the q-th at least it, exactly', () => {
    const cases: ReadonlyArray<readonly [Rational.Rational, Rational.Rational, number]> = [
      [Rational.makeUnsafe(1n, 2n), Rational.makeUnsafe(5n, 12n), 64],
      [Rational.makeUnsafe(3n, 7n), Rational.makeUnsafe(12n, 5n), 64],
      [Rational.makeUnsafe(203n, 10000n), Rational.makeUnsafe(1305n, 8192n), 24],
      [Rational.makeUnsafe(53n, 64n), Rational.makeUnsafe(1n, 32n), 64],
      [Rational.makeUnsafe(9n, 10n), Rational.makeUnsafe(2523n, 32n), 24],
    ];

    for (const [base, exponent, precision] of cases) {
      const bounds = Real.power(Real.fromRational(base), exponent).bounds(precision);
      const p = exponent.numerator;
      const q = exponent.denominator;
      // lower^q ≤ x^p ≤ upper^q, with lower = L / 2^precision and x = n / d: L^q · d^p ≤ n^p · 2^(precision · q).
      const scale = 1n << (BigInt(precision) * q);

      expect(
        bounds !== undefined &&
          bounds.lower ** q * base.denominator ** p <= base.numerator ** p * scale &&
          base.numerator ** p * scale <= bounds.upper ** q * base.denominator ** p,
        `${Rational.format(base)}^(${Rational.format(exponent)})`,
      ).toBe(true);
    }
  });

  it('knows a power is rational exactly when the base is a power of a rational number, and irrational otherwise', () => {
    const four = Real.root(Real.fromRational(Rational.fromBigInt(4n)), 2);
    const two = Real.root(Real.fromRational(Rational.fromBigInt(2n)), 2);

    expect(four.rational).toEqual(Rational.fromBigInt(2n));
    expect(two.rational).toBeUndefined();
    expect(two.irrational).toBe(true);
  });
});

describe('ln', () => {
  it('bounds ln 2 around its published digits', () => {
    const bounds = Real.boundsAt(Real.ln(Real.fromRational(Rational.fromBigInt(2n))), 80);

    // 0.69314718055994530941… from OEIS A002162.
    expect(
      bounds !== undefined &&
        Rational.isLessThanOrEqualTo(
          bounds[0],
          Rational.makeUnsafe(69314718055994530942n, 10n ** 20n),
        ) &&
        Rational.isGreaterThanOrEqualTo(
          bounds[1],
          Rational.makeUnsafe(69314718055994530941n, 10n ** 20n),
        ),
    ).toBe(true);
  });

  it('is exactly 0 at 1 and irrational at every other rational number', () => {
    expect(Real.ln(Real.fromRational(Rational.fromBigInt(1n))).rational).toEqual(
      Rational.fromBigInt(0n),
    );
    expect(Real.ln(Real.fromRational(Rational.makeUnsafe(3n, 2n))).irrational).toBe(true);
  });
});

describe('exp', () => {
  it('bounds e around its published digits', () => {
    const bounds = Real.boundsAt(Real.exp(Real.fromRational(Rational.fromBigInt(1n))), 80);

    // 2.71828 18284 59045 23536… from DLMF 4.2.11.
    expect(
      bounds !== undefined &&
        Rational.isLessThanOrEqualTo(
          bounds[0],
          Rational.makeUnsafe(271828182845904523537n, 10n ** 20n),
        ) &&
        Rational.isGreaterThanOrEqualTo(
          bounds[1],
          Rational.makeUnsafe(271828182845904523536n, 10n ** 20n),
        ),
    ).toBe(true);
  });

  it('undoes the logarithm', () => {
    const bounds = Real.boundsAt(Real.exp(Real.ln(Real.fromRational(Rational.fromBigInt(3n)))), 64);

    expect(
      bounds !== undefined &&
        Rational.isLessThanOrEqualTo(bounds[0], Rational.fromBigInt(3n)) &&
        Rational.isGreaterThanOrEqualTo(bounds[1], Rational.fromBigInt(3n)),
    ).toBe(true);
  });
});

describe('pi', () => {
  it('bounds π around its published digits', () => {
    const bounds = Real.boundsAt(Real.pi, 80);

    // 3.14159 26535 89793 23846… from DLMF 3.12.1.
    expect(
      bounds !== undefined &&
        Rational.isLessThanOrEqualTo(
          bounds[0],
          Rational.makeUnsafe(314159265358979323847n, 10n ** 20n),
        ) &&
        Rational.isGreaterThanOrEqualTo(
          bounds[1],
          Rational.makeUnsafe(314159265358979323846n, 10n ** 20n),
        ),
    ).toBe(true);
  });
});

describe('cosineSine', () => {
  it('bounds the cosine and the sine of a third of a half turn around 1/2 and the square root of 3/4', () => {
    const [cosine, sine] = Real.cosineSine(
      Real.multiply(Real.pi, Real.fromRational(Rational.makeUnsafe(1n, 3n))),
    );
    const cosineBounds = Real.boundsAt(cosine, 64);
    const sineSquared = Real.boundsAt(Real.square(sine), 64);

    expect(
      cosineBounds !== undefined &&
        Rational.isLessThanOrEqualTo(cosineBounds[0], Rational.makeUnsafe(1n, 2n)) &&
        Rational.isGreaterThanOrEqualTo(cosineBounds[1], Rational.makeUnsafe(1n, 2n)),
    ).toBe(true);
    expect(
      sineSquared !== undefined &&
        Rational.isLessThanOrEqualTo(sineSquared[0], Rational.makeUnsafe(3n, 4n)) &&
        Rational.isGreaterThanOrEqualTo(sineSquared[1], Rational.makeUnsafe(3n, 4n)),
    ).toBe(true);
  });

  it('gives every angle a cosine and a sine whose squares add up to 1, large and negative angles included', () => {
    for (const angle of [
      Rational.fromBigInt(1n),
      Rational.fromBigInt(-100n),
      Rational.makeUnsafe(12345n, 7n),
    ]) {
      const [cosine, sine] = Real.cosineSine(Real.fromRational(angle));
      const sum = Real.boundsAt(Real.add(Real.square(cosine), Real.square(sine)), 48);

      expect(
        sum !== undefined &&
          Rational.isLessThanOrEqualTo(sum[0], Rational.fromBigInt(1n)) &&
          Rational.isGreaterThanOrEqualTo(sum[1], Rational.fromBigInt(1n)),
        Rational.format(angle),
      ).toBe(true);
    }
  });
});

describe('bounds', () => {
  it('never widen as the precision grows', () => {
    for (const value of [
      Real.pi,
      Real.ln(Real.fromRational(Rational.makeUnsafe(7n, 3n))),
      Real.power(Real.fromRational(Rational.makeUnsafe(2n, 3n)), Rational.makeUnsafe(5n, 12n)),
      Real.cosineSine(Real.fromRational(Rational.fromBigInt(2n)))[0],
    ]) {
      const widths = [32, 64, 128].map((precision) => {
        const bounds = Real.boundsAt(value, precision);

        return bounds === undefined ? undefined : Rational.subtract(bounds[1], bounds[0]);
      });

      expect(
        widths.every(
          (width, index) =>
            index === 0 ||
            (width !== undefined &&
              widths[index - 1] !== undefined &&
              Rational.isLessThanOrEqualTo(width, widths[index - 1] ?? width)),
        ),
      ).toBe(true);
    }
  });
});

describe('sign', () => {
  it('is exact for a rational number and settles for an irrational one', () => {
    expect(Real.sign(Real.fromRational(Rational.fromBigInt(0n)), Rational.fromBigInt(0n))).toBe(0);
    expect(
      Real.sign(
        Real.subtract(
          Real.pi,
          Real.fromRational(Rational.makeUnsafe(314159265358979n, 10n ** 14n)),
        ),
        Rational.fromBigInt(0n),
      ),
    ).toBe(1);
  });

  it('counts as 0 a number neither known to be rational nor irrational whose bounds hold 0 within the width given, by the rule of the caller', () => {
    const [cosine] = Real.cosineSine(Real.fromRational(Rational.fromBigInt(1n)));

    expect(Real.sign(Real.subtract(cosine, cosine), Rational.makeUnsafe(1n, 1n << 40n))).toBe(0);
  });
});

describe('roundToDecimals', () => {
  it('rounds to the nearest, a number exactly halfway toward +∞, as CSS Color 4 rounds', () => {
    expect(
      Real.roundToDecimals(
        Real.fromRational(Rational.makeUnsafe(15n, 1000000n)),
        5,
        Rational.fromBigInt(0n),
      ),
    ).toEqual(Rational.makeUnsafe(2n, 100000n));
    expect(
      Real.roundToDecimals(
        Real.fromRational(Rational.makeUnsafe(-15n, 1000000n)),
        5,
        Rational.fromBigInt(0n),
      ),
    ).toEqual(Rational.makeUnsafe(-1n, 100000n));
    expect(Real.roundToDecimals(Real.pi, 5, Rational.fromBigInt(0n))).toEqual(
      Rational.makeUnsafe(314159n, 100000n),
    );
  });
});

describe('writeDecimals', () => {
  it('writes a number rounded as CSS rounds, without the zeros that end its fraction, and 0 without a sign', () => {
    expect(Real.writeDecimals(Rational.makeUnsafe(1n, 2n), 5)).toBe('0.5');
    expect(Real.writeDecimals(Rational.fromBigInt(3n), 5)).toBe('3');
    expect(Real.writeDecimals(Rational.makeUnsafe(-125n, 10n), 0)).toBe('-12');
    expect(Real.writeDecimals(Rational.makeUnsafe(-4n, 1000000n), 5)).toBe('0');
    expect(Real.writeDecimals(Rational.makeUnsafe(2n, 3n), 5)).toBe('0.66667');
  });
});

describe('irrational', () => {
  it('is carried through a power and through a root taken as roots in turn', () => {
    expect(
      Real.power(Real.fromRational(Rational.makeUnsafe(1n, 2n)), Rational.makeUnsafe(12n, 5n))
        .irrational,
    ).toBe(true);
    expect(Real.root(Real.fromRational(Rational.makeUnsafe(203n, 10000n)), 8192).irrational).toBe(
      true,
    );
    expect(Real.root(Real.fromRational(Rational.fromBigInt(64n)), 12).irrational).toBe(true);
    expect(Real.root(Real.fromRational(Rational.fromBigInt(4096n)), 12).rational).toEqual(
      Rational.fromBigInt(2n),
    );
  });
});
