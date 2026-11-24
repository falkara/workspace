import { describe, expect, it } from '@effect/vitest';
import { Option, Rational } from 'effect';

import * as Chromaticity from '#src/Colorimetry/Chromaticity';
import * as Tristimulus from '#src/Colorimetry/Tristimulus';

/** The row at 518 nm of the CIE 1931 2° observer as the CIE dataset publishes it, SHA-256 `fa663e3535a7e0763a745993a1f0a192eb0275ac46ad2d1befd7626841e713c1`. */
const row518 = {
  xBar: Rational.makeUnsafe(4798504n, 100000000n),
  yBar: Rational.makeUnsafe(6708752n, 10000000n),
  zBar: Rational.makeUnsafe(8998272n, 100000000n),
} as const;

describe('white', () => {
  it('is the white the standards specify: x and y lie within the intervals that 0.3127 and 0.3290, the white point CSS Color 4 gives for D65, stand for', () => {
    expect(
      Rational.isGreaterThanOrEqualTo(Chromaticity.white.x, Rational.makeUnsafe(31265n, 100000n)),
      'x is at least 0.31265',
    ).toBe(true);
    expect(
      Rational.isLessThan(Chromaticity.white.x, Rational.makeUnsafe(31275n, 100000n)),
      'x is below 0.31275',
    ).toBe(true);
    expect(
      Rational.isGreaterThanOrEqualTo(Chromaticity.white.y, Rational.makeUnsafe(32895n, 100000n)),
      'y is at least 0.32895',
    ).toBe(true);
    expect(
      Rational.isLessThan(Chromaticity.white.y, Rational.makeUnsafe(32905n, 100000n)),
      'y is below 0.32905',
    ).toBe(true);
  });

  it('matches the chromaticity worked out independently from the CIE datasets, in lowest terms', () => {
    expect([
      Chromaticity.white.x.numerator,
      Chromaticity.white.x.denominator,
      Chromaticity.white.y.numerator,
      Chromaticity.white.y.denominator,
    ]).toEqual([
      71740714395483087745n,
      229403741865818214921n,
      75479154764200873016n,
      229403741865818214921n,
    ]);
  });
});

describe('z', () => {
  it('gives the white Z over X + Y + Z, as the CIE defines the chromaticity coordinate z', () => {
    expect(
      Rational.divide(
        Tristimulus.white.Z,
        Rational.sumAll([Tristimulus.white.X, Tristimulus.white.Y, Tristimulus.white.Z]),
      ),
    ).toEqual(Option.some(Chromaticity.z(Chromaticity.white)));
  });
});

describe('ofTristimulus', () => {
  it('gives the white the chromaticity of the library', () => {
    expect(Chromaticity.ofTristimulus(Tristimulus.white)).toEqual(Option.some(Chromaticity.white));
  });

  it('gives a light the same chromaticity at any intensity', () => {
    const light = Tristimulus.make({ X: row518.xBar, Y: row518.yBar, Z: row518.zBar });

    for (const factor of [Rational.makeUnsafe(1n, 1000n), Rational.fromBigInt(3n)]) {
      expect(
        Chromaticity.ofTristimulus(
          Tristimulus.make({
            X: Rational.multiply(light.X, factor),
            Y: Rational.multiply(light.Y, factor),
            Z: Rational.multiply(light.Z, factor),
          }),
        ),
      ).toEqual(Chromaticity.ofTristimulus(light));
    }
  });

  it('gives black no chromaticity', () => {
    expect(
      Chromaticity.ofTristimulus(
        Tristimulus.make({
          X: Rational.fromBigInt(0n),
          Y: Rational.fromBigInt(0n),
          Z: Rational.fromBigInt(0n),
        }),
      ),
    ).toEqual(Option.none());
  });
});
