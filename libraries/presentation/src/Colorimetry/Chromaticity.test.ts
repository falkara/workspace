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

describe('whiteChromaticity', () => {
  it('is the white the standards specify: x and y lie within the intervals that 0.3127 and 0.3290, the white point CSS Color 4 gives for D65, stand for', () => {
    expect(
      Rational.isGreaterThanOrEqualTo(
        Chromaticity.whiteChromaticity.x,
        Rational.makeUnsafe(31265n, 100000n),
      ),
      'x is at least 0.31265',
    ).toBe(true);
    expect(
      Rational.isLessThan(Chromaticity.whiteChromaticity.x, Rational.makeUnsafe(31275n, 100000n)),
      'x is below 0.31275',
    ).toBe(true);
    expect(
      Rational.isGreaterThanOrEqualTo(
        Chromaticity.whiteChromaticity.y,
        Rational.makeUnsafe(32895n, 100000n),
      ),
      'y is at least 0.32895',
    ).toBe(true);
    expect(
      Rational.isLessThan(Chromaticity.whiteChromaticity.y, Rational.makeUnsafe(32905n, 100000n)),
      'y is below 0.32905',
    ).toBe(true);
  });

  it('matches the chromaticity worked out independently from the CIE datasets, in lowest terms', () => {
    expect([
      Chromaticity.whiteChromaticity.x.numerator,
      Chromaticity.whiteChromaticity.x.denominator,
      Chromaticity.whiteChromaticity.y.numerator,
      Chromaticity.whiteChromaticity.y.denominator,
    ]).toEqual([
      71740714395483087745n,
      229403741865818214921n,
      75479154764200873016n,
      229403741865818214921n,
    ]);
  });
});

describe('chromaticityZ', () => {
  it('gives the white Z over X + Y + Z, as the CIE defines the chromaticity coordinate z', () => {
    expect(
      Rational.divide(
        Tristimulus.whiteTristimulus.Z,
        Rational.sumAll([
          Tristimulus.whiteTristimulus.X,
          Tristimulus.whiteTristimulus.Y,
          Tristimulus.whiteTristimulus.Z,
        ]),
      ),
    ).toEqual(Option.some(Chromaticity.chromaticityZ(Chromaticity.whiteChromaticity)));
  });
});

describe('chromaticityOf', () => {
  it('gives the white the chromaticity of the library', () => {
    expect(Chromaticity.chromaticityOf(Tristimulus.whiteTristimulus)).toEqual(
      Option.some(Chromaticity.whiteChromaticity),
    );
  });

  it('gives a light the same chromaticity at any intensity', () => {
    const light = Tristimulus.tristimulus({ X: row518.xBar, Y: row518.yBar, Z: row518.zBar });

    for (const factor of [Rational.makeUnsafe(1n, 1000n), Rational.fromBigInt(3n)]) {
      expect(
        Chromaticity.chromaticityOf(
          Tristimulus.tristimulus({
            X: Rational.multiply(light.X, factor),
            Y: Rational.multiply(light.Y, factor),
            Z: Rational.multiply(light.Z, factor),
          }),
        ),
      ).toEqual(Chromaticity.chromaticityOf(light));
    }
  });

  it('gives black no chromaticity', () => {
    expect(
      Chromaticity.chromaticityOf(
        Tristimulus.tristimulus({
          X: Rational.fromBigInt(0n),
          Y: Rational.fromBigInt(0n),
          Z: Rational.fromBigInt(0n),
        }),
      ),
    ).toEqual(Option.none());
  });
});
