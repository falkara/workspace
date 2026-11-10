import { describe, expect, it } from '@effect/vitest';
import { Exit, Option, Rational, Schema, SchemaIssue } from 'effect';

import * as Colorimetry from '#src/Colorimetry';

describe('whiteTristimulus', () => {
  it('has a Y of 1, just as the relative luminance of WCAG 2.2 takes white to be 1', () => {
    expect(Colorimetry.whiteTristimulus.Y).toEqual(Rational.fromBigInt(1n));
  });

  it('holds X and Z in the lowest terms in which they were worked out', () => {
    expect([
      Colorimetry.whiteTristimulus.X.numerator,
      Colorimetry.whiteTristimulus.X.denominator,
      Colorimetry.whiteTristimulus.Z.numerator,
      Colorimetry.whiteTristimulus.Z.denominator,
    ]).toEqual([
      71740714395483087745n,
      75479154764200873016n,
      10272984088266781770n,
      9434894345525109127n,
    ]);
  });
});

describe('whiteChromaticity', () => {
  it('is the white the standards specify: x and y lie within the intervals that 0.3127 and 0.3290, the white point CSS Color 4 gives for D65, stand for', () => {
    expect(
      Rational.isGreaterThanOrEqualTo(
        Colorimetry.whiteChromaticity.x,
        Rational.makeUnsafe(31265n, 100000n),
      ),
      'x is at least 0.31265',
    ).toBe(true);
    expect(
      Rational.isLessThan(Colorimetry.whiteChromaticity.x, Rational.makeUnsafe(31275n, 100000n)),
      'x is below 0.31275',
    ).toBe(true);
    expect(
      Rational.isGreaterThanOrEqualTo(
        Colorimetry.whiteChromaticity.y,
        Rational.makeUnsafe(32895n, 100000n),
      ),
      'y is at least 0.32895',
    ).toBe(true);
    expect(
      Rational.isLessThan(Colorimetry.whiteChromaticity.y, Rational.makeUnsafe(32905n, 100000n)),
      'y is below 0.32905',
    ).toBe(true);
  });

  it('matches the chromaticity worked out independently from the CIE datasets, in lowest terms', () => {
    expect([
      Colorimetry.whiteChromaticity.x.numerator,
      Colorimetry.whiteChromaticity.x.denominator,
      Colorimetry.whiteChromaticity.y.numerator,
      Colorimetry.whiteChromaticity.y.denominator,
    ]).toEqual([
      71740714395483087745n,
      229403741865818214921n,
      75479154764200873016n,
      229403741865818214921n,
    ]);
  });
});

describe('complementaryWavelength', () => {
  it('gives the chromaticity of the spectral light, which sums to 1 with its z', () => {
    const exit = Colorimetry.complementaryWavelength({
      wavelength: 518,
      xBar: Rational.makeUnsafe(4798504n, 100000000n),
      yBar: Rational.makeUnsafe(6708752n, 10000000n),
      zBar: Rational.makeUnsafe(8998272n, 100000000n),
    });
    const z = Rational.divideUnsafe(
      Rational.makeUnsafe(8998272n, 100000000n),
      Rational.sumAll([
        Rational.makeUnsafe(4798504n, 100000000n),
        Rational.makeUnsafe(6708752n, 10000000n),
        Rational.makeUnsafe(8998272n, 100000000n),
      ]),
    );

    expect(
      Exit.isSuccess(exit)
        ? Rational.sumAll([exit.value.spectralChromaticity.x, exit.value.spectralChromaticity.y, z])
        : undefined,
    ).toEqual(Rational.fromBigInt(1n));
  });

  it('places the white strictly between the spectral light and every color of the hue', () => {
    const exit = Colorimetry.complementaryWavelength({
      wavelength: 518,
      xBar: Rational.makeUnsafe(4798504n, 100000000n),
      yBar: Rational.makeUnsafe(6708752n, 10000000n),
      zBar: Rational.makeUnsafe(8998272n, 100000000n),
    });
    const hue = Exit.isSuccess(exit) ? exit.value : undefined;
    const towardsLight = hue && {
      x: Rational.subtract(hue.spectralChromaticity.x, Colorimetry.whiteChromaticity.x),
      y: Rational.subtract(hue.spectralChromaticity.y, Colorimetry.whiteChromaticity.y),
    };
    const towardsColors = [
      Rational.makeUnsafe(1n, 1000n),
      Rational.makeUnsafe(1n, 2n),
      Rational.fromBigInt(1n),
      Rational.fromBigInt(3n),
    ].map(
      (distance) =>
        hue && {
          x: Rational.multiply(hue.direction.x, distance),
          y: Rational.multiply(hue.direction.y, distance),
        },
    );

    for (const towardsColor of towardsColors) {
      expect(
        towardsLight &&
          towardsColor &&
          Rational.subtract(
            Rational.multiply(towardsLight.x, towardsColor.y),
            Rational.multiply(towardsLight.y, towardsColor.x),
          ),
        'the white, the spectral light and the color lie on one line',
      ).toEqual(Rational.fromBigInt(0n));
      expect(
        towardsLight &&
          towardsColor &&
          Rational.isNegative(
            Rational.sum(
              Rational.multiply(towardsLight.x, towardsColor.x),
              Rational.multiply(towardsLight.y, towardsColor.y),
            ),
          ),
        'the spectral light and the color lie on opposite sides of the white',
      ).toBe(true);
    }
  });

  it('decodes from JSON, with each value of the observer given as a fraction', () => {
    const exit = Schema.decodeUnknownExit(
      Schema.toCodecJson(Colorimetry.ComplementaryWavelengthOptions),
    )(
      JSON.parse(
        '{ "wavelength": 518, "xBar": "4798504/100000000", "yBar": "6708752/10000000", "zBar": "8998272/100000000" }',
      ),
    );

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual({
      wavelength: 518,
      xBar: Rational.makeUnsafe(4798504n, 100000000n),
      yBar: Rational.makeUnsafe(6708752n, 10000000n),
      zBar: Rational.makeUnsafe(8998272n, 100000000n),
    });
  });

  it('refuses a wavelength out of range, with the reason', () => {
    const below = Colorimetry.complementaryWavelength({
      wavelength: 359,
      xBar: Rational.makeUnsafe(4798504n, 100000000n),
      yBar: Rational.makeUnsafe(6708752n, 10000000n),
      zBar: Rational.makeUnsafe(8998272n, 100000000n),
    });
    const above = Colorimetry.complementaryWavelength({
      wavelength: 831,
      xBar: Rational.makeUnsafe(4798504n, 100000000n),
      yBar: Rational.makeUnsafe(6708752n, 10000000n),
      zBar: Rational.makeUnsafe(8998272n, 100000000n),
    });

    for (const exit of [below, above]) {
      expect(
        SchemaIssue.makeFormatterStandardSchemaV1()(
          Option.getOrThrow(Exit.findErrorOption(exit)).issue,
        ).issues,
      ).toEqual([
        {
          path: ['wavelength'],
          message:
            "Expected a complementary wavelength from 360 nm to 830 nm, the range over which ISO/CIE 11664-1 tabulates the CIE 1931 2° observer, so that the observer's color-matching functions are known there",
        },
      ]);
    }
  });

  it('refuses a row of zeros, with the reason', () => {
    const exit = Colorimetry.complementaryWavelength({
      wavelength: 518,
      xBar: Rational.fromBigInt(0n),
      yBar: Rational.fromBigInt(0n),
      zBar: Rational.fromBigInt(0n),
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: [],
        message:
          'Expected x̄, ȳ and z̄ not to be all 0, so that the spectral light has a chromaticity, as its chromaticity divides each of them by their sum',
      },
    ]);
  });

  it('refuses a negative value of the observer, with the reason', () => {
    const exit = Colorimetry.complementaryWavelength({
      wavelength: 518,
      xBar: Rational.makeUnsafe(-4798504n, 100000000n),
      yBar: Rational.makeUnsafe(6708752n, 10000000n),
      zBar: Rational.makeUnsafe(8998272n, 100000000n),
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['xBar'],
        message:
          'Expected an x̄ of at least 0, as no color-matching function of the CIE 1931 2° observer is negative',
      },
    ]);
  });

  it('refuses a row whose spectral light has the chromaticity of the white, with the reason', () => {
    const exit = Colorimetry.complementaryWavelength({
      wavelength: 518,
      xBar: Colorimetry.whiteChromaticity.x,
      yBar: Colorimetry.whiteChromaticity.y,
      zBar: Rational.subtract(
        Rational.fromBigInt(1n),
        Rational.sum(Colorimetry.whiteChromaticity.x, Colorimetry.whiteChromaticity.y),
      ),
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: [],
        message:
          'Expected spectral light whose chromaticity differs from that of the white, so that the hue has a direction, as no spectral light of the observer has the chromaticity of the white',
      },
    ]);
  });
});

describe('dominantWavelength', () => {
  it('points the hue from the white toward the spectral light', () => {
    const exit = Colorimetry.dominantWavelength({
      wavelength: 518,
      xBar: Rational.makeUnsafe(4798504n, 100000000n),
      yBar: Rational.makeUnsafe(6708752n, 10000000n),
      zBar: Rational.makeUnsafe(8998272n, 100000000n),
    });
    const hue = Exit.isSuccess(exit) ? exit.value : undefined;
    const towardsLight = hue && {
      x: Rational.subtract(hue.spectralChromaticity.x, Colorimetry.whiteChromaticity.x),
      y: Rational.subtract(hue.spectralChromaticity.y, Colorimetry.whiteChromaticity.y),
    };

    expect(
      towardsLight &&
        hue &&
        Rational.subtract(
          Rational.multiply(towardsLight.x, hue.direction.y),
          Rational.multiply(towardsLight.y, hue.direction.x),
        ),
      'the white, the spectral light and the hue lie on one line',
    ).toEqual(Rational.fromBigInt(0n));
    expect(
      towardsLight &&
        hue &&
        Rational.isPositive(
          Rational.sum(
            Rational.multiply(towardsLight.x, hue.direction.x),
            Rational.multiply(towardsLight.y, hue.direction.y),
          ),
        ),
      'the hue points toward the spectral light',
    ).toBe(true);
  });

  it('gives the same spectral light as the complementary wavelength of the same row', () => {
    const dominant = Colorimetry.dominantWavelength({
      wavelength: 518,
      xBar: Rational.makeUnsafe(4798504n, 100000000n),
      yBar: Rational.makeUnsafe(6708752n, 10000000n),
      zBar: Rational.makeUnsafe(8998272n, 100000000n),
    });
    const complementary = Colorimetry.complementaryWavelength({
      wavelength: 518,
      xBar: Rational.makeUnsafe(4798504n, 100000000n),
      yBar: Rational.makeUnsafe(6708752n, 10000000n),
      zBar: Rational.makeUnsafe(8998272n, 100000000n),
    });

    expect(Exit.isSuccess(dominant) ? dominant.value.spectralChromaticity : undefined).toEqual(
      Exit.isSuccess(complementary) ? complementary.value.spectralChromaticity : undefined,
    );
  });

  it('refuses a wavelength out of range, with the reason', () => {
    const exit = Colorimetry.dominantWavelength({
      wavelength: 831,
      xBar: Rational.makeUnsafe(4798504n, 100000000n),
      yBar: Rational.makeUnsafe(6708752n, 10000000n),
      zBar: Rational.makeUnsafe(8998272n, 100000000n),
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['wavelength'],
        message:
          "Expected a dominant wavelength from 360 nm to 830 nm, the range over which ISO/CIE 11664-1 tabulates the CIE 1931 2° observer, so that the observer's color-matching functions are known there",
      },
    ]);
  });
});
