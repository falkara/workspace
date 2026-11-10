import { describe, expect, it } from '@effect/vitest';
import { Equal, Exit, Option, Rational, Schema, SchemaIssue } from 'effect';

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

describe('media', () => {
  it('convert between linear channels and tristimulus values with the matrices CSS Color 4 writes, entry for entry', () => {
    expect([Colorimetry.srgb.linearToXyz, Colorimetry.srgb.xyzToLinear]).toEqual([
      [
        [
          Rational.makeUnsafe(506752n, 1228815n),
          Rational.makeUnsafe(87881n, 245763n),
          Rational.makeUnsafe(12673n, 70218n),
        ],
        [
          Rational.makeUnsafe(87098n, 409605n),
          Rational.makeUnsafe(175762n, 245763n),
          Rational.makeUnsafe(12673n, 175545n),
        ],
        [
          Rational.makeUnsafe(7918n, 409605n),
          Rational.makeUnsafe(87881n, 737289n),
          Rational.makeUnsafe(1001167n, 1053270n),
        ],
      ],
      [
        [
          Rational.makeUnsafe(12831n, 3959n),
          Rational.makeUnsafe(-329n, 214n),
          Rational.makeUnsafe(-1974n, 3959n),
        ],
        [
          Rational.makeUnsafe(-851781n, 878810n),
          Rational.makeUnsafe(1648619n, 878810n),
          Rational.makeUnsafe(36519n, 878810n),
        ],
        [
          Rational.makeUnsafe(705n, 12673n),
          Rational.makeUnsafe(-2585n, 12673n),
          Rational.makeUnsafe(705n, 667n),
        ],
      ],
    ]);
    expect([Colorimetry.displayP3.linearToXyz, Colorimetry.displayP3.xyzToLinear]).toEqual([
      [
        [
          Rational.makeUnsafe(608311n, 1250200n),
          Rational.makeUnsafe(189793n, 714400n),
          Rational.makeUnsafe(198249n, 1000160n),
        ],
        [
          Rational.makeUnsafe(35783n, 156275n),
          Rational.makeUnsafe(247089n, 357200n),
          Rational.makeUnsafe(198249n, 2500400n),
        ],
        [
          Rational.fromBigInt(0n),
          Rational.makeUnsafe(32229n, 714400n),
          Rational.makeUnsafe(5220557n, 5000800n),
        ],
      ],
      [
        [
          Rational.makeUnsafe(446124n, 178915n),
          Rational.makeUnsafe(-333277n, 357830n),
          Rational.makeUnsafe(-72051n, 178915n),
        ],
        [
          Rational.makeUnsafe(-14852n, 17905n),
          Rational.makeUnsafe(63121n, 35810n),
          Rational.makeUnsafe(423n, 17905n),
        ],
        [
          Rational.makeUnsafe(11844n, 330415n),
          Rational.makeUnsafe(-50337n, 660830n),
          Rational.makeUnsafe(316169n, 330415n),
        ],
      ],
    ]);
    expect([Colorimetry.rec2020.linearToXyz, Colorimetry.rec2020.xyzToLinear]).toEqual([
      [
        [
          Rational.makeUnsafe(63426534n, 99577255n),
          Rational.makeUnsafe(20160776n, 139408157n),
          Rational.makeUnsafe(47086771n, 278816314n),
        ],
        [
          Rational.makeUnsafe(26158966n, 99577255n),
          Rational.makeUnsafe(472592308n, 697040785n),
          Rational.makeUnsafe(8267143n, 139408157n),
        ],
        [
          Rational.fromBigInt(0n),
          Rational.makeUnsafe(19567812n, 697040785n),
          Rational.makeUnsafe(295819943n, 278816314n),
        ],
      ],
      [
        [
          Rational.makeUnsafe(30757411n, 17917100n),
          Rational.makeUnsafe(-6372589n, 17917100n),
          Rational.makeUnsafe(-4539589n, 17917100n),
        ],
        [
          Rational.makeUnsafe(-19765991n, 29648200n),
          Rational.makeUnsafe(47925759n, 29648200n),
          Rational.makeUnsafe(467509n, 29648200n),
        ],
        [
          Rational.makeUnsafe(792561n, 44930125n),
          Rational.makeUnsafe(-1921689n, 44930125n),
          Rational.makeUnsafe(42328811n, 44930125n),
        ],
      ],
    ]);
  });

  it('map full channels to the white of each medium, which the inverse maps back', () => {
    const media = [
      Colorimetry.srgb,
      Colorimetry.displayP3,
      Colorimetry.rec2020,
      Colorimetry.rec2100Pq,
      Colorimetry.rec2100Hlg,
    ].flatMap((medium) => [medium, Colorimetry.onExactWhite(medium)]);

    for (const medium of media) {
      const xyz = medium.linearToXyz.map((row) => Rational.sumAll(row));
      const back = medium.xyzToLinear.map((row) =>
        Rational.sumAll(
          row.map((entry, index) =>
            Rational.multiply(entry, xyz[index] ?? Rational.fromBigInt(0n)),
          ),
        ),
      );

      expect(
        [
          Rational.divideUnsafe(xyz[0] ?? Rational.fromBigInt(0n), Rational.sumAll(xyz)),
          Rational.divideUnsafe(xyz[1] ?? Rational.fromBigInt(0n), Rational.sumAll(xyz)),
        ],
        `${medium.colorSpace} maps full channels to its white`,
      ).toEqual([medium.white.x, medium.white.y]);
      expect(xyz[1], `${medium.colorSpace} gives its white a Y of 1`).toEqual(
        Rational.fromBigInt(1n),
      );
      expect(back, `${medium.colorSpace} maps it back with the inverse`).toEqual([
        Rational.fromBigInt(1n),
        Rational.fromBigInt(1n),
        Rational.fromBigInt(1n),
      ]);
    }
  });

  it("use the white the standards write, or, on request, the library's exact white", () => {
    for (const medium of [
      Colorimetry.srgb,
      Colorimetry.displayP3,
      Colorimetry.rec2020,
      Colorimetry.rec2100Pq,
      Colorimetry.rec2100Hlg,
    ]) {
      expect(medium.white, medium.colorSpace).toEqual({
        x: Rational.makeUnsafe(3127n, 10000n),
        y: Rational.makeUnsafe(3290n, 10000n),
      });
      expect(Colorimetry.onExactWhite(medium).white, medium.colorSpace).toEqual(
        Colorimetry.whiteChromaticity,
      );
    }
  });

  it('compare by value', () => {
    expect(
      Equal.equals(
        Colorimetry.onExactWhite(Colorimetry.srgb),
        Colorimetry.onExactWhite(Colorimetry.srgb),
      ),
    ).toBe(true);
    expect(Equal.equals(Colorimetry.srgb, Colorimetry.onExactWhite(Colorimetry.srgb))).toBe(false);
  });

  it('hold their primaries within their gamut and reject a color beyond it', () => {
    const red = {
      X: Colorimetry.srgb.linearToXyz[0][0],
      Y: Colorimetry.srgb.linearToXyz[1][0],
      Z: Colorimetry.srgb.linearToXyz[2][0],
    };
    const greenOfRec2020 = {
      X: Colorimetry.rec2020.linearToXyz[0][1],
      Y: Colorimetry.rec2020.linearToXyz[1][1],
      Z: Colorimetry.rec2020.linearToXyz[2][1],
    };

    expect(Colorimetry.isInGamut(Colorimetry.srgb, red), 'the red of sRGB').toBe(true);
    expect(
      Colorimetry.isInGamut(Colorimetry.rec2020, greenOfRec2020),
      'the green of Rec. 2020',
    ).toBe(true);
    expect(
      Colorimetry.isInGamut(Colorimetry.srgb, greenOfRec2020),
      'the green of Rec. 2020 lies beyond sRGB',
    ).toBe(false);
    expect(
      Colorimetry.isInGamut(Colorimetry.srgb, {
        X: Rational.multiply(red.X, Rational.fromBigInt(2n)),
        Y: Rational.multiply(red.Y, Rational.fromBigInt(2n)),
        Z: Rational.multiply(red.Z, Rational.fromBigInt(2n)),
      }),
      'twice the red of sRGB is brighter than the medium holds',
    ).toBe(false);
  });

  it('let BT.2100 with PQ reach above the white up to 10 000 cd/m², with the white at the 203 cd/m² of HDR Reference White', () => {
    const white = {
      X: Rational.sumAll(Colorimetry.rec2100Pq.linearToXyz[0]),
      Y: Rational.sumAll(Colorimetry.rec2100Pq.linearToXyz[1]),
      Z: Rational.sumAll(Colorimetry.rec2100Pq.linearToXyz[2]),
    };

    expect(Colorimetry.referenceWhiteLuminance).toEqual(Rational.fromBigInt(203n));
    expect(Colorimetry.rec2100Pq.peak).toEqual(Rational.makeUnsafe(10000n, 203n));
    expect(
      Colorimetry.isInGamut(Colorimetry.rec2100Pq, {
        X: Rational.multiply(white.X, Rational.makeUnsafe(10000n, 203n)),
        Y: Rational.multiply(white.Y, Rational.makeUnsafe(10000n, 203n)),
        Z: Rational.multiply(white.Z, Rational.makeUnsafe(10000n, 203n)),
      }),
      'the white at 10 000 cd/m²',
    ).toBe(true);
    expect(
      Colorimetry.isInGamut(Colorimetry.rec2100Pq, {
        X: Rational.multiply(white.X, Rational.makeUnsafe(10001n, 203n)),
        Y: Rational.multiply(white.Y, Rational.makeUnsafe(10001n, 203n)),
        Z: Rational.multiply(white.Z, Rational.makeUnsafe(10001n, 203n)),
      }),
      'the white above 10 000 cd/m²',
    ).toBe(false);
    expect(
      Colorimetry.isInGamut(Colorimetry.rec2100Hlg, {
        X: Rational.multiply(white.X, Rational.fromBigInt(2n)),
        Y: Rational.multiply(white.Y, Rational.fromBigInt(2n)),
        Z: Rational.multiply(white.Z, Rational.fromBigInt(2n)),
      }),
      'HLG holds nothing above the white until the rule for luminance decides it',
    ).toBe(false);
  });

  it('write black as 0 and full channels as 1, in the CSS syntax of each medium', () => {
    const channelsOf = (medium: Colorimetry.Medium, scale: Rational.Rational) =>
      /^color\((\S+) (\S+) (\S+) (\S+)\)$/
        .exec(
          Colorimetry.write(medium, {
            X: Rational.multiply(Rational.sumAll(medium.linearToXyz[0]), scale),
            Y: Rational.multiply(Rational.sumAll(medium.linearToXyz[1]), scale),
            Z: Rational.multiply(Rational.sumAll(medium.linearToXyz[2]), scale),
          }),
        )
        ?.slice(1);

    for (const medium of [Colorimetry.srgb, Colorimetry.displayP3, Colorimetry.rec2020]) {
      expect(channelsOf(medium, Rational.fromBigInt(0n)), `${medium.colorSpace} black`).toEqual([
        medium.colorSpace,
        '0',
        '0',
        '0',
      ]);
      for (const channel of channelsOf(medium, Rational.fromBigInt(1n))?.slice(1) ?? []) {
        expect(
          Math.abs(Number(channel) - 1),
          `${medium.colorSpace} full channel`,
        ).toBeLessThanOrEqual(Number.EPSILON);
      }
    }
    for (const channel of channelsOf(Colorimetry.rec2100Pq, Colorimetry.rec2100Pq.peak)?.slice(1) ??
      []) {
      expect(Math.abs(Number(channel) - 1), 'PQ at 10 000 cd/m²').toBeLessThanOrEqual(
        Number.EPSILON,
      );
    }
  });

  it('write the white of BT.2100 where CSS Color HDR and ITU-R BT.2408-9 place it: PQ at 0.58 and HLG at 0.75', () => {
    const write = (medium: Colorimetry.Medium) =>
      Colorimetry.write(medium, {
        X: Rational.sumAll(medium.linearToXyz[0]),
        Y: Rational.sumAll(medium.linearToXyz[1]),
        Z: Rational.sumAll(medium.linearToXyz[2]),
      })
        .slice(0, -1)
        .split(' ')
        .slice(1)
        .map(Number);

    expect(write(Colorimetry.rec2100Pq).map((channel) => Math.round(channel * 100) / 100)).toEqual([
      0.58, 0.58, 0.58,
    ]);
    expect(
      write(Colorimetry.rec2100Hlg).map((channel) => Math.round(channel * 10000) / 10000),
    ).toEqual([0.75, 0.75, 0.75]);
  });
});
