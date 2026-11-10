import { describe, expect, expectTypeOf, it } from '@effect/vitest';
import { Effect, Equal, Exit, Option, Rational, Record, Schema, SchemaIssue } from 'effect';

import * as Colorimetry from '#src/Colorimetry';

/** Rows of the CIE 1931 2° observer as the CIE dataset publishes them, SHA-256 `fa663e3535a7e0763a745993a1f0a192eb0275ac46ad2d1befd7626841e713c1`. */
const rows = {
  518: {
    wavelength: 518,
    xBar: Rational.makeUnsafe(4798504n, 100000000n),
    yBar: Rational.makeUnsafe(6708752n, 10000000n),
    zBar: Rational.makeUnsafe(8998272n, 100000000n),
  },
  532: {
    wavelength: 532,
    xBar: Rational.makeUnsafe(18914n, 100000n),
    yBar: Rational.makeUnsafe(8849624n, 10000000n),
    zBar: Rational.makeUnsafe(3693564n, 100000000n),
  },
  630: {
    wavelength: 630,
    xBar: Rational.makeUnsafe(6424n, 10000n),
    yBar: Rational.makeUnsafe(265n, 1000n),
    zBar: Rational.makeUnsafe(4999999n, 100000000000n),
  },
} as const;

/** The cross product of two vectors in XYZ, colors or directions, 0 exactly when they are parallel. */
const cross = (
  first: Colorimetry.Tristimulus | Colorimetry.Direction,
  second: Colorimetry.Tristimulus | Colorimetry.Direction,
): {
  readonly X: Rational.Rational;
  readonly Y: Rational.Rational;
  readonly Z: Rational.Rational;
} => ({
  X: Rational.subtract(Rational.multiply(first.Y, second.Z), Rational.multiply(first.Z, second.Y)),
  Y: Rational.subtract(Rational.multiply(first.Z, second.X), Rational.multiply(first.X, second.Z)),
  Z: Rational.subtract(Rational.multiply(first.X, second.Y), Rational.multiply(first.Y, second.X)),
});

/** The linear channels of a color in a medium. */
const channelsOf = (
  medium: Colorimetry.Medium,
  color: Colorimetry.Tristimulus,
): ReadonlyArray<Rational.Rational> =>
  Colorimetry.transform(medium.xyzToLinear, Colorimetry.xyzOf(color));

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

describe('chromaticityOf', () => {
  it('gives the white the chromaticity of the library', () => {
    expect(Colorimetry.chromaticityOf(Colorimetry.whiteTristimulus)).toEqual(
      Option.some(Colorimetry.whiteChromaticity),
    );
  });

  it('gives a light the same chromaticity at any intensity', () => {
    const light = Colorimetry.tristimulus({
      X: rows[518].xBar,
      Y: rows[518].yBar,
      Z: rows[518].zBar,
    });

    for (const factor of [Rational.makeUnsafe(1n, 1000n), Rational.fromBigInt(3n)]) {
      expect(
        Colorimetry.chromaticityOf(
          Colorimetry.tristimulus({
            X: Rational.multiply(light.X, factor),
            Y: Rational.multiply(light.Y, factor),
            Z: Rational.multiply(light.Z, factor),
          }),
        ),
      ).toEqual(Colorimetry.chromaticityOf(light));
    }
  });

  it('gives black no chromaticity', () => {
    expect(
      Colorimetry.chromaticityOf(
        Colorimetry.tristimulus({
          X: Rational.fromBigInt(0n),
          Y: Rational.fromBigInt(0n),
          Z: Rational.fromBigInt(0n),
        }),
      ),
    ).toEqual(Option.none());
  });
});

describe('complementaryWavelength', () => {
  it('takes the opposite of the spectral light, as published, as its direction', () => {
    expect(Colorimetry.complementaryWavelength(rows[518])).toEqual(
      Exit.succeed({
        spectralLight: { X: rows[518].xBar, Y: rows[518].yBar, Z: rows[518].zBar },
        direction: {
          X: Rational.negate(rows[518].xBar),
          Y: Rational.negate(rows[518].yBar),
          Z: Rational.negate(rows[518].zBar),
        },
      }),
    );
  });

  it('gives white when any color of the hue is mixed with as much of its spectral light as the hue took from it', () => {
    const exit = Colorimetry.complementaryWavelength(rows[518]);
    const direction = Exit.isSuccess(exit) ? exit.value.direction : undefined;

    for (const amount of [
      Rational.makeUnsafe(1n, 1000n),
      Rational.makeUnsafe(1n, 2n),
      Rational.fromBigInt(3n),
    ]) {
      // The spectral light added back is the opposite of the direction of a complementary wavelength.
      expect(
        direction &&
          Colorimetry.add(
            Colorimetry.add(Colorimetry.whiteTristimulus, Colorimetry.scale(direction, amount)),
            Colorimetry.scale(direction, Rational.negate(amount)),
          ),
      ).toEqual(Colorimetry.whiteTristimulus);
    }
  });

  it('places the white strictly between the spectral light and every color of the hue in the chromaticity plane', () => {
    const exit = Colorimetry.complementaryWavelength(rows[518]);
    const direction = Exit.isSuccess(exit) ? exit.value.direction : undefined;
    const light = Exit.isSuccess(exit)
      ? Colorimetry.chromaticityOf(exit.value.spectralLight).pipe(Option.getOrUndefined)
      : undefined;

    for (const amount of [
      Rational.makeUnsafe(1n, 1000n),
      Rational.makeUnsafe(1n, 2n),
      Rational.fromBigInt(1n),
    ]) {
      const color =
        direction &&
        Colorimetry.chromaticityOf(
          Colorimetry.add(Colorimetry.whiteTristimulus, Colorimetry.scale(direction, amount)),
        ).pipe(Option.getOrUndefined);
      const towardsLight = light && {
        x: Rational.subtract(light.x, Colorimetry.whiteChromaticity.x),
        y: Rational.subtract(light.y, Colorimetry.whiteChromaticity.y),
      };
      const towardsColor = color && {
        x: Rational.subtract(color.x, Colorimetry.whiteChromaticity.x),
        y: Rational.subtract(color.y, Colorimetry.whiteChromaticity.y),
      };

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

    expect(Exit.isSuccess(exit) ? exit.value : undefined).toEqual(rows[518]);
  });

  it('refuses a wavelength out of range, with the reason', () => {
    for (const wavelength of [359, 831]) {
      expect(
        SchemaIssue.makeFormatterStandardSchemaV1()(
          Option.getOrThrow(
            Exit.findErrorOption(Colorimetry.complementaryWavelength({ ...rows[518], wavelength })),
          ).issue,
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
          'Expected x̄, ȳ and z̄ not to be all 0, so that there is a spectral light to mix with the white',
      },
    ]);
  });

  it('refuses a negative value of the observer, with the reason', () => {
    const exit = Colorimetry.complementaryWavelength({
      ...rows[518],
      xBar: Rational.negate(rows[518].xBar),
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

  it('refuses a spectral light parallel to the white, at any intensity, with the reason', () => {
    for (const factor of [Rational.makeUnsafe(1n, 7n), Rational.fromBigInt(2n)]) {
      const exit = Colorimetry.complementaryWavelength({
        wavelength: 518,
        xBar: Rational.multiply(Colorimetry.whiteTristimulus.X, factor),
        yBar: Rational.multiply(Colorimetry.whiteTristimulus.Y, factor),
        zBar: Rational.multiply(Colorimetry.whiteTristimulus.Z, factor),
      });

      expect(
        SchemaIssue.makeFormatterStandardSchemaV1()(
          Option.getOrThrow(Exit.findErrorOption(exit)).issue,
        ).issues,
      ).toEqual([
        {
          path: [],
          message:
            'Expected a spectral light not parallel to the white, so that mixing it with the white changes the hue, as no spectral light of the observer has the chromaticity of the white',
        },
      ]);
    }
  });
});

describe('dominantWavelength', () => {
  it('takes the spectral light, as published, as its direction', () => {
    expect(Colorimetry.dominantWavelength(rows[518])).toEqual(
      Exit.succeed({
        spectralLight: { X: rows[518].xBar, Y: rows[518].yBar, Z: rows[518].zBar },
        direction: { X: rows[518].xBar, Y: rows[518].yBar, Z: rows[518].zBar },
      }),
    );
  });

  it('points opposite to the complementary wavelength of the same row', () => {
    const dominant = Colorimetry.dominantWavelength(rows[518]);
    const complementary = Colorimetry.complementaryWavelength(rows[518]);

    expect(
      Exit.isSuccess(dominant) && Exit.isSuccess(complementary)
        ? [
            Rational.sum(dominant.value.direction.X, complementary.value.direction.X),
            Rational.sum(dominant.value.direction.Y, complementary.value.direction.Y),
            Rational.sum(dominant.value.direction.Z, complementary.value.direction.Z),
          ]
        : undefined,
    ).toEqual([Rational.fromBigInt(0n), Rational.fromBigInt(0n), Rational.fromBigInt(0n)]);
  });

  it('refuses a wavelength out of range, with the reason', () => {
    const exit = Colorimetry.dominantWavelength({ ...rows[518], wavelength: 831 });

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

  it('refuses a spectral light parallel to the white, with the reason', () => {
    const exit = Colorimetry.dominantWavelength({
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
          'Expected a spectral light not parallel to the white, so that mixing it with the white changes the hue, as no spectral light of the observer has the chromaticity of the white',
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
    const red = Colorimetry.tristimulus({
      X: Colorimetry.srgb.linearToXyz[0][0],
      Y: Colorimetry.srgb.linearToXyz[1][0],
      Z: Colorimetry.srgb.linearToXyz[2][0],
    });
    const greenOfRec2020 = Colorimetry.tristimulus({
      X: Colorimetry.rec2020.linearToXyz[0][1],
      Y: Colorimetry.rec2020.linearToXyz[1][1],
      Z: Colorimetry.rec2020.linearToXyz[2][1],
    });

    expect(Exit.isSuccess(Colorimetry.inGamut(Colorimetry.srgb, red)), 'the red of sRGB').toBe(
      true,
    );
    expect(
      Exit.isSuccess(Colorimetry.inGamut(Colorimetry.rec2020, greenOfRec2020)),
      'the green of Rec. 2020',
    ).toBe(true);
    expect(
      Exit.isSuccess(Colorimetry.inGamut(Colorimetry.srgb, greenOfRec2020)),
      'the green of Rec. 2020 lies beyond sRGB',
    ).toBe(false);
    expect(
      Exit.isSuccess(
        Colorimetry.inGamut(
          Colorimetry.srgb,
          Colorimetry.tristimulus({
            X: Rational.multiply(red.X, Rational.fromBigInt(2n)),
            Y: Rational.multiply(red.Y, Rational.fromBigInt(2n)),
            Z: Rational.multiply(red.Z, Rational.fromBigInt(2n)),
          }),
        ),
      ),
      'twice the red of sRGB is brighter than the medium holds',
    ).toBe(false);
  });

  it('let BT.2100 with PQ reach above the white up to 10 000 cd/m², with the white at the 203 cd/m² of HDR Reference White', () => {
    const white = Colorimetry.tristimulus({
      X: Rational.sumAll(Colorimetry.rec2100Pq.linearToXyz[0]),
      Y: Rational.sumAll(Colorimetry.rec2100Pq.linearToXyz[1]),
      Z: Rational.sumAll(Colorimetry.rec2100Pq.linearToXyz[2]),
    });

    expect(Colorimetry.referenceWhiteLuminance).toEqual(Rational.fromBigInt(203n));
    expect(Colorimetry.rec2100Pq.peak).toEqual(Rational.makeUnsafe(10000n, 203n));
    expect(
      Exit.isSuccess(
        Colorimetry.inGamut(
          Colorimetry.rec2100Pq,
          Colorimetry.tristimulus({
            X: Rational.multiply(white.X, Rational.makeUnsafe(10000n, 203n)),
            Y: Rational.multiply(white.Y, Rational.makeUnsafe(10000n, 203n)),
            Z: Rational.multiply(white.Z, Rational.makeUnsafe(10000n, 203n)),
          }),
        ),
      ),
      'the white at 10 000 cd/m²',
    ).toBe(true);
    expect(
      Exit.isSuccess(
        Colorimetry.inGamut(
          Colorimetry.rec2100Pq,
          Colorimetry.tristimulus({
            X: Rational.multiply(white.X, Rational.makeUnsafe(10001n, 203n)),
            Y: Rational.multiply(white.Y, Rational.makeUnsafe(10001n, 203n)),
            Z: Rational.multiply(white.Z, Rational.makeUnsafe(10001n, 203n)),
          }),
        ),
      ),
      'the white above 10 000 cd/m²',
    ).toBe(false);
    expect(
      Exit.isSuccess(
        Colorimetry.inGamut(
          Colorimetry.rec2100Hlg,
          Colorimetry.tristimulus({
            X: Rational.multiply(white.X, Rational.fromBigInt(2n)),
            Y: Rational.multiply(white.Y, Rational.fromBigInt(2n)),
            Z: Rational.multiply(white.Z, Rational.fromBigInt(2n)),
          }),
        ),
      ),
      'HLG holds nothing above the white until the rule for luminance decides it',
    ).toBe(false);
  });

  it('write black as 0 and full channels as 1, in the CSS syntax of each medium', () => {
    const channelsOf = (medium: Colorimetry.Medium, scale: Rational.Rational) =>
      /^color\((\S+) (\S+) (\S+) (\S+)\)$/
        .exec(
          Colorimetry.write(
            medium,
            Option.getOrThrow(
              Exit.getSuccess(
                Colorimetry.inGamut(
                  medium,
                  Colorimetry.tristimulus({
                    X: Rational.multiply(Rational.sumAll(medium.linearToXyz[0]), scale),
                    Y: Rational.multiply(Rational.sumAll(medium.linearToXyz[1]), scale),
                    Z: Rational.multiply(Rational.sumAll(medium.linearToXyz[2]), scale),
                  }),
                ),
              ),
            ),
          ),
        )
        ?.slice(1);

    for (const medium of [Colorimetry.srgb, Colorimetry.displayP3, Colorimetry.rec2020]) {
      expect(channelsOf(medium, Rational.fromBigInt(0n)), `${medium.colorSpace} black`).toEqual([
        medium.colorSpace,
        '0',
        '0',
        '0',
      ]);
      expect(channelsOf(medium, Rational.fromBigInt(1n)), `${medium.colorSpace} full`).toEqual([
        medium.colorSpace,
        '1',
        '1',
        '1',
      ]);
    }
    expect(
      channelsOf(Colorimetry.rec2100Pq, Colorimetry.rec2100Pq.peak),
      'PQ at 10 000 cd/m²',
    ).toEqual(['rec2100-pq', '1', '1', '1']);
  });

  it('write the white of BT.2100 where CSS Color HDR and ITU-R BT.2408-9 place it: PQ at 0.58 and HLG at 0.75', () => {
    const write = (medium: Colorimetry.Medium) =>
      Colorimetry.write(
        medium,
        Option.getOrThrow(
          Exit.getSuccess(
            Colorimetry.inGamut(
              medium,
              Colorimetry.tristimulus({
                X: Rational.sumAll(medium.linearToXyz[0]),
                Y: Rational.sumAll(medium.linearToXyz[1]),
                Z: Rational.sumAll(medium.linearToXyz[2]),
              }),
            ),
          ),
        ),
      )
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

describe('purest', () => {
  it('gives every medium the purest color of a complementary and a dominant wavelength: a mixture of the white and the direction, on the side it points to, at the edge of the gamut and at the headroom, with nothing purer in the gamut', () => {
    const media = [
      Colorimetry.srgb,
      Colorimetry.displayP3,
      Colorimetry.rec2020,
      Colorimetry.rec2100Pq,
      Colorimetry.rec2100Hlg,
    ].flatMap((medium) => [medium, Colorimetry.onExactWhite(medium)]);
    const light = Colorimetry.tristimulus({
      X: rows[518].xBar,
      Y: rows[518].yBar,
      Z: rows[518].zBar,
    });

    for (const hue of [
      Colorimetry.complementaryWavelength(rows[518]),
      Colorimetry.dominantWavelength(rows[518]),
    ]) {
      for (const medium of media) {
        const label = `${medium.colorSpace} ${medium.white === Colorimetry.whiteChromaticity ? 'on the exact white' : ''}`;
        const direction = Exit.isSuccess(hue) ? hue.value.direction : undefined;
        const exit = Exit.isSuccess(hue)
          ? Colorimetry.inMedium(Colorimetry.purest({ hue: hue.value }), medium)
          : undefined;
        const color = exit && Exit.isSuccess(exit) ? exit.value : undefined;
        // The color is α·W + β·D exactly when it lies in the plane of the two, and then its cross product with D is α·(W × D) and with W is β·(D × W).
        const alongWhite = color && direction && cross(color, direction);
        const alongDirection = color && direction && cross(color, Colorimetry.whiteTristimulus);
        const whiteByDirection = direction && cross(Colorimetry.whiteTristimulus, direction);

        expect(
          color &&
            Rational.sumAll([
              Rational.multiply(color.X, cross(Colorimetry.whiteTristimulus, light).X),
              Rational.multiply(color.Y, cross(Colorimetry.whiteTristimulus, light).Y),
              Rational.multiply(color.Z, cross(Colorimetry.whiteTristimulus, light).Z),
            ]),
          `${label}: the determinant of the white, the spectral light and the color is 0`,
        ).toEqual(Rational.fromBigInt(0n));
        expect(
          alongWhite &&
            whiteByDirection &&
            Rational.isPositive(
              Rational.sumAll([
                Rational.multiply(alongWhite.X, whiteByDirection.X),
                Rational.multiply(alongWhite.Y, whiteByDirection.Y),
                Rational.multiply(alongWhite.Z, whiteByDirection.Z),
              ]),
            ),
          `${label}: α is positive`,
        ).toBe(true);
        expect(
          alongDirection &&
            whiteByDirection &&
            Rational.isNegative(
              Rational.sumAll([
                Rational.multiply(alongDirection.X, whiteByDirection.X),
                Rational.multiply(alongDirection.Y, whiteByDirection.Y),
                Rational.multiply(alongDirection.Z, whiteByDirection.Z),
              ]),
            ),
          `${label}: β is positive, as D × W is −(W × D)`,
        ).toBe(true);

        const view = color && Colorimetry.chromaticityOf(color).pipe(Option.getOrUndefined);
        const lightView = Colorimetry.chromaticityOf(light).pipe(Option.getOrUndefined);
        const towardsColor = view && {
          x: Rational.subtract(view.x, Colorimetry.whiteChromaticity.x),
          y: Rational.subtract(view.y, Colorimetry.whiteChromaticity.y),
        };
        const towardsLight = lightView && {
          x: Rational.subtract(lightView.x, Colorimetry.whiteChromaticity.x),
          y: Rational.subtract(lightView.y, Colorimetry.whiteChromaticity.y),
        };

        expect(
          towardsColor &&
            towardsLight &&
            Rational.subtract(
              Rational.multiply(towardsColor.x, towardsLight.y),
              Rational.multiply(towardsColor.y, towardsLight.x),
            ),
          `${label}: its chromaticity lies on the line of the white and the spectral light`,
        ).toEqual(Rational.fromBigInt(0n));
        expect(
          towardsColor &&
            towardsLight &&
            direction &&
            Rational.isPositive(
              Rational.sum(
                Rational.multiply(towardsColor.x, towardsLight.x),
                Rational.multiply(towardsColor.y, towardsLight.y),
              ),
            ) === Rational.isPositive(direction.Y),
          `${label}: its chromaticity lies on the side of the white the hue points to`,
        ).toBe(true);

        const channels = color && channelsOf(medium, color);

        expect(
          color && Exit.isSuccess(Colorimetry.inGamut(medium, color)),
          `${label}: in gamut`,
        ).toBe(true);
        expect(
          channels?.some((channel) => Rational.isZero(channel)),
          `${label}: a channel at exactly 0`,
        ).toBe(true);
        expect(
          channels?.reduce((largest, channel) => Rational.max(largest, channel)),
          `${label}: the largest channel at exactly the headroom`,
        ).toEqual(Rational.fromBigInt(1n));
        for (const more of [
          Rational.makeUnsafe(1n, 1000000000000n),
          Rational.makeUnsafe(1n, 2n),
          Rational.fromBigInt(10n),
        ]) {
          expect(
            color &&
              direction &&
              Exit.isSuccess(
                Colorimetry.inGamut(
                  medium,
                  Colorimetry.add(color, Colorimetry.scale(direction, more)),
                ),
              ),
            `${label}: more of the direction leaves the gamut`,
          ).toBe(false);
        }
      }
    }
  });

  it('gives the spectral light itself where the gamut holds it, as Rec. 2020 and BT.2100 hold 532 nm and 630 nm, rather than a color purer than any light', () => {
    for (const row of [rows[532], rows[630]]) {
      const hue = Colorimetry.dominantWavelength(row);
      const light = Colorimetry.tristimulus({ X: row.xBar, Y: row.yBar, Z: row.zBar });

      for (const medium of [
        Colorimetry.rec2020,
        Colorimetry.rec2100Pq,
        Colorimetry.rec2100Hlg,
      ].flatMap((medium) => [medium, Colorimetry.onExactWhite(medium)])) {
        const exit = Exit.isSuccess(hue)
          ? Colorimetry.inMedium(Colorimetry.purest({ hue: hue.value }), medium)
          : undefined;
        const color = exit && Exit.isSuccess(exit) ? exit.value : undefined;
        const channels = color && channelsOf(medium, color);

        expect(
          color && cross(color, light),
          `${medium.colorSpace} at ${row.wavelength} nm: the spectral light alone, α = 0`,
        ).toEqual(
          Colorimetry.tristimulus({
            X: Rational.fromBigInt(0n),
            Y: Rational.fromBigInt(0n),
            Z: Rational.fromBigInt(0n),
          }),
        );
        expect(
          channels?.every((channel) => Rational.isPositive(channel)),
          `${medium.colorSpace} at ${row.wavelength} nm: within the gamut, no channel at 0`,
        ).toBe(true);
        expect(
          channels?.reduce((largest, channel) => Rational.max(largest, channel)),
          `${medium.colorSpace} at ${row.wavelength} nm: the largest channel at the headroom`,
        ).toEqual(Rational.fromBigInt(1n));
      }

      const srgb = Exit.isSuccess(hue)
        ? Colorimetry.inMedium(Colorimetry.purest({ hue: hue.value }), Colorimetry.srgb)
        : undefined;

      expect(
        srgb &&
          Exit.isSuccess(srgb) &&
          channelsOf(Colorimetry.srgb, srgb.value).some((channel) => Rational.isZero(channel)),
        `sRGB at ${row.wavelength} nm, which does not hold it, mixes it with the white up to the edge`,
      ).toBe(true);
    }
  });

  it('gives 518 nm in sRGB a red of 1, a green of 0 and a blue between them, written correctly rounded', () => {
    const hue = Colorimetry.complementaryWavelength({
      wavelength: 518,
      xBar: Rational.makeUnsafe(4798504n, 100000000n),
      yBar: Rational.makeUnsafe(6708752n, 10000000n),
      zBar: Rational.makeUnsafe(8998272n, 100000000n),
    });
    const exit = Exit.isSuccess(hue)
      ? Colorimetry.inMedium(Colorimetry.purest({ hue: hue.value }), Colorimetry.srgb)
      : undefined;
    const color = exit && Exit.isSuccess(exit) ? exit.value : undefined;
    const [red, green, blue] = Colorimetry.srgb.xyzToLinear.map((row) =>
      color
        ? Rational.sumAll([
            Rational.multiply(row[0], color.X),
            Rational.multiply(row[1], color.Y),
            Rational.multiply(row[2], color.Z),
          ])
        : Rational.fromBigInt(-1n),
    );
    const written = color
      ? /^color\(srgb \S+ \S+ (\S+)\)$/.exec(Colorimetry.write(Colorimetry.srgb, color))?.[1]
      : undefined;
    const digits = written === undefined ? undefined : /^0\.(\d{1,5})$/.exec(written)?.[1];
    // The written blue w as an exact fraction, read digit by digit.
    const w =
      digits === undefined
        ? undefined
        : Rational.makeUnsafe(BigInt(digits), 10n ** BigInt(digits.length));
    // Half of the fifth decimal place: rounding to the nearest moves a number by at most it.
    const half = Rational.makeUnsafe(1n, 200000n);
    // The linear channel B a written number e reads back as is ((e + 0.055) / 1.055)^(12/5), so w − h ≤ 1.055 B^(5/12) − 0.055 < w + h, ties rounding up, holds exactly when ((w − h + 0.055) / 1.055)^12 ≤ B^5 < ((w + h + 0.055) / 1.055)^12.
    const readBack = (encoded: Rational.Rational) => {
      const base = Rational.divideUnsafe(
        Rational.sum(encoded, Rational.makeUnsafe(55n, 1000n)),
        Rational.makeUnsafe(1055n, 1000n),
      );
      return Rational.makeUnsafe(base.numerator ** 12n, base.denominator ** 12n);
    };

    expect(red).toEqual(Rational.fromBigInt(1n));
    expect(green).toEqual(Rational.fromBigInt(0n));
    expect(
      blue && Rational.isPositive(blue) && Rational.isLessThan(blue, Rational.fromBigInt(1n)),
    ).toBe(true);
    expect(
      w !== undefined &&
        blue !== undefined &&
        Rational.isLessThanOrEqualTo(
          readBack(Rational.subtract(w, half)),
          Rational.makeUnsafe(blue.numerator ** 5n, blue.denominator ** 5n),
        ) &&
        Rational.isLessThan(
          Rational.makeUnsafe(blue.numerator ** 5n, blue.denominator ** 5n),
          readBack(Rational.sum(w, half)),
        ),
      'the written blue is the exact blue rounded to the nearest fifth decimal place',
    ).toBe(true);
  });

  it('brings the largest channel to a headroom above the white in PQ', () => {
    const hue = Colorimetry.complementaryWavelength({
      wavelength: 518,
      xBar: Rational.makeUnsafe(4798504n, 100000000n),
      yBar: Rational.makeUnsafe(6708752n, 10000000n),
      zBar: Rational.makeUnsafe(8998272n, 100000000n),
    });
    const exit = Exit.isSuccess(hue)
      ? Colorimetry.inMedium(
          Colorimetry.purest({
            hue: hue.value,
            headroom: Colorimetry.relativeToWhite(Rational.fromBigInt(2n)),
          }),
          Colorimetry.rec2100Pq,
        )
      : undefined;
    const color = exit && Exit.isSuccess(exit) ? exit.value : undefined;

    expect(
      color &&
        Colorimetry.rec2100Pq.xyzToLinear
          .map((row) =>
            Rational.sumAll([
              Rational.multiply(row[0], color.X),
              Rational.multiply(row[1], color.Y),
              Rational.multiply(row[2], color.Z),
            ]),
          )
          .reduce((largest, channel) => Rational.max(largest, channel)),
    ).toEqual(Rational.fromBigInt(2n));
  });

  it('refuses a headroom above the peak of the medium or not positive, with the reason', () => {
    const hue = Colorimetry.complementaryWavelength({
      wavelength: 518,
      xBar: Rational.makeUnsafe(4798504n, 100000000n),
      yBar: Rational.makeUnsafe(6708752n, 10000000n),
      zBar: Rational.makeUnsafe(8998272n, 100000000n),
    });
    const issues = (medium: Colorimetry.Medium, headroom: Colorimetry.RelativeToWhite) => {
      const exit = Exit.isSuccess(hue)
        ? Colorimetry.inMedium(Colorimetry.purest({ hue: hue.value, headroom }), medium)
        : undefined;

      return exit && Exit.isFailure(exit)
        ? SchemaIssue.makeFormatterStandardSchemaV1()(
            Option.getOrThrow(Exit.findErrorOption(exit)).issue,
          ).issues
        : undefined;
    };

    expect(issues(Colorimetry.srgb, Colorimetry.relativeToWhite(Rational.fromBigInt(2n)))).toEqual([
      {
        path: ['headroom'],
        message:
          'Expected a headroom of at most 1 for srgb, so that the color stays within the medium, as its channels reach no further than its white',
      },
    ]);
    expect(
      issues(Colorimetry.rec2100Pq, Colorimetry.relativeToWhite(Rational.fromBigInt(50n))),
    ).toEqual([
      {
        path: ['headroom'],
        message:
          'Expected a headroom of at most 10000/203 for rec2100-pq, so that the color stays within the medium, as BT.2100 encodes no luminance above 10 000 cd/m²',
      },
    ]);
    expect(
      issues(Colorimetry.rec2100Hlg, Colorimetry.relativeToWhite(Rational.fromBigInt(2n))),
    ).toEqual([
      {
        path: ['headroom'],
        message:
          'Expected a headroom of at most 1 for rec2100-hlg, so that the color stays within the medium, as how far HLG reaches above the white is not decided yet',
      },
    ]);
    expect(issues(Colorimetry.srgb, Colorimetry.relativeToWhite(Rational.fromBigInt(0n)))).toEqual([
      {
        path: ['headroom'],
        message:
          'Expected a positive headroom, so that the color gives off light, as the purest color of a hue is not black',
      },
    ]);
  });
});

describe('build time', () => {
  it('finds the purest color of a hue and writes it in every medium within a second each, the budget of a build that works every value out once', () => {
    const hue = Colorimetry.complementaryWavelength({
      wavelength: 518,
      xBar: Rational.makeUnsafe(4798504n, 100000000n),
      yBar: Rational.makeUnsafe(6708752n, 10000000n),
      zBar: Rational.makeUnsafe(8998272n, 100000000n),
    });

    for (const medium of [
      Colorimetry.srgb,
      Colorimetry.displayP3,
      Colorimetry.rec2020,
      Colorimetry.rec2100Pq,
      Colorimetry.rec2100Hlg,
    ]) {
      for (const headroom of [Colorimetry.relativeToWhite(Rational.fromBigInt(1n)), medium.peak]) {
        const start = performance.now();
        const exit = Exit.isSuccess(hue)
          ? Colorimetry.inMedium(Colorimetry.purest({ hue: hue.value, headroom }), medium)
          : undefined;
        const written = exit && Exit.isSuccess(exit) ? Colorimetry.write(medium, exit.value) : '';

        expect(written, medium.colorSpace).toMatch(/^color\(/);
        expect(performance.now() - start, medium.colorSpace).toBeLessThan(1000);
      }
    }
  });
});

describe('types', () => {
  const hue = Option.getOrThrow(Exit.getSuccess(Colorimetry.complementaryWavelength(rows[518])));

  it('keep a direction apart from a color, so that it is never written, tested for a gamut or given a chromaticity', () => {
    expectTypeOf(hue.direction).not.toExtend<Colorimetry.Tristimulus>();
    expectTypeOf(hue.spectralLight).not.toExtend<Colorimetry.Direction>();
    expectTypeOf(Colorimetry.chromaticityOf(hue.spectralLight)).toEqualTypeOf<
      Option.Option<Colorimetry.Chromaticity>
    >();
    // @ts-expect-error A direction is a change of a color, not a light, so it is not written.
    Colorimetry.write(Colorimetry.srgb, hue.direction);
    // @ts-expect-error A direction lies in no gamut.
    Colorimetry.inGamut(Colorimetry.srgb, hue.direction);
    // @ts-expect-error A direction has no chromaticity; its spectral light has.
    Colorimetry.chromaticityOf(hue.direction);
  });

  it('add a direction to a color and scale a direction, and nothing else', () => {
    expectTypeOf(
      Colorimetry.add(Colorimetry.whiteTristimulus, hue.direction),
    ).toEqualTypeOf<Colorimetry.Tristimulus>();
    expectTypeOf(
      Colorimetry.scale(hue.direction, Rational.fromBigInt(2n)),
    ).toEqualTypeOf<Colorimetry.Direction>();
    // @ts-expect-error A color is a light, not a change of one.
    Colorimetry.add(Colorimetry.whiteTristimulus, Colorimetry.whiteTristimulus);
    // @ts-expect-error Only a direction is scaled.
    Colorimetry.scale(Colorimetry.whiteTristimulus, Rational.fromBigInt(2n));
  });

  it('apply a matrix only to a vector of the space it converts from, and give a vector of the space it converts to', () => {
    const xyz = Colorimetry.xyzOf(hue.spectralLight);
    const channels = Colorimetry.transform(Colorimetry.srgb.xyzToLinear, xyz);

    expectTypeOf(channels).toEqualTypeOf<
      Colorimetry.Vector<Colorimetry.LinearSpace<'srgb', 'standard'>>
    >();
    expectTypeOf(Colorimetry.transform(Colorimetry.srgb.linearToXyz, channels)).toEqualTypeOf<
      Colorimetry.Vector<'XYZ'>
    >();
    expectTypeOf(
      Colorimetry.transform(Colorimetry.srgb.linearToXyz, [
        Rational.fromBigInt(1n),
        Rational.fromBigInt(0n),
        Rational.fromBigInt(0n),
      ]),
    ).toEqualTypeOf<Colorimetry.Vector<'XYZ'>>();
    // @ts-expect-error The matrix to XYZ converts from linear channels, not from XYZ.
    Colorimetry.transform(Colorimetry.srgb.linearToXyz, xyz);
    // @ts-expect-error The linear channels of sRGB are not those of Display P3.
    Colorimetry.transform(Colorimetry.displayP3.linearToXyz, channels);
    // @ts-expect-error Channels worked out on the white of the standard are not those on the exact white.
    Colorimetry.transform(Colorimetry.onExactWhite(Colorimetry.srgb).linearToXyz, channels);
  });

  it('give a medium on the exact white a type of its own, which still fits where any medium is expected', () => {
    expectTypeOf(Colorimetry.onExactWhite(Colorimetry.srgb)).toEqualTypeOf<
      Colorimetry.Medium<'srgb', 'exact'>
    >();
    expectTypeOf(Colorimetry.onExactWhite(Colorimetry.srgb)).not.toExtend<
      Colorimetry.Medium<'srgb', 'standard'>
    >();
    expectTypeOf(Colorimetry.srgb).toExtend<Colorimetry.Medium>();
    expectTypeOf(Colorimetry.onExactWhite(Colorimetry.rec2100Pq)).toExtend<Colorimetry.Medium>();
  });

  it('keep a luminance in cd/m² apart from a value relative to the white', () => {
    expectTypeOf(Colorimetry.pqPeakLuminance).not.toExtend<Colorimetry.RelativeToWhite>();
    expectTypeOf(Colorimetry.rec2100Pq.peak).not.toExtend<Colorimetry.Luminance>();
    expectTypeOf(Colorimetry.purest).toBeCallableWith({
      hue,
      headroom: Colorimetry.rec2100Pq.peak,
    });
    expectTypeOf(Colorimetry.purest).toBeCallableWith({
      hue,
      headroom: Colorimetry.relativeToWhite(Rational.fromBigInt(1n)),
    });
    Colorimetry.purest({
      hue,
      // @ts-expect-error A luminance in cd/m² is not a headroom relative to the white.
      headroom: Colorimetry.pqPeakLuminance,
    });
    Colorimetry.purest({
      hue,
      // @ts-expect-error A number with no unit is not a headroom until it says it is relative to the white.
      headroom: Rational.fromBigInt(1n),
    });
  });
});

describe('definitions', () => {
  const hue = Option.getOrThrow(Exit.getSuccess(Colorimetry.complementaryWavelength(rows[518])));
  const brand = Colorimetry.purest({ hue });
  const half = Colorimetry.purest({
    hue,
    headroom: Colorimetry.relativeToWhite(Rational.makeUnsafe(1n, 2n)),
  });

  it('hold the five media of the library in media, by name', () => {
    expect(Colorimetry.media).toEqual({
      srgb: Colorimetry.srgb,
      displayP3: Colorimetry.displayP3,
      rec2020: Colorimetry.rec2020,
      rec2100Pq: Colorimetry.rec2100Pq,
      rec2100Hlg: Colorimetry.rec2100Hlg,
    });
  });

  it('take the white level, 1, as the default headroom', () => {
    expect(Colorimetry.whiteLevel).toEqual(Rational.fromBigInt(1n));
    for (const medium of Object.values(Colorimetry.media)) {
      expect(Colorimetry.inMedium(brand, medium), medium.colorSpace).toEqual(
        Colorimetry.inMedium(Colorimetry.purest({ hue, headroom: Colorimetry.whiteLevel }), medium),
      );
    }
  });

  it('write in every medium what write gives for the color of the definition in that medium', () => {
    const written = Option.getOrThrow(Exit.getSuccess(Colorimetry.writeMedia(brand)));

    for (const name of Record.keys(Colorimetry.media)) {
      const medium = Colorimetry.media[name];

      expect(written[name], name).toBe(
        Colorimetry.write(
          medium,
          Option.getOrThrow(Exit.getSuccess(Colorimetry.inMedium(brand, medium))),
        ),
      );
    }
  });

  it('keep the names of the media they are written in, such as the media on the exact white', () => {
    const onExactWhite = Record.map(Colorimetry.media, Colorimetry.onExactWhite);
    const written = Option.getOrThrow(Exit.getSuccess(Colorimetry.writeMedia(brand, onExactWhite)));

    expect(Record.keys(written)).toEqual(Record.keys(Colorimetry.media));
    expect(written.srgb).toBe(
      Colorimetry.write(
        onExactWhite.srgb,
        Option.getOrThrow(Exit.getSuccess(Colorimetry.inMedium(brand, onExactWhite.srgb))),
      ),
    );
  });

  it('change by an exception of byMedium its medium alone, on either white', () => {
    const excepted = Colorimetry.byMedium(brand, { displayP3: half });
    const written = Option.getOrThrow(Exit.getSuccess(Colorimetry.writeMedia(excepted)));
    const plain = Option.getOrThrow(Exit.getSuccess(Colorimetry.writeMedia(brand)));
    const halved = Option.getOrThrow(Exit.getSuccess(Colorimetry.writeMedia(half)));

    expect(written).toEqual({ ...plain, displayP3: halved.displayP3 });
    expect(Colorimetry.inMedium(excepted, Colorimetry.onExactWhite(Colorimetry.displayP3))).toEqual(
      Colorimetry.inMedium(half, Colorimetry.onExactWhite(Colorimetry.displayP3)),
    );
  });

  it('fail with the reason of a rule of define that leaves the gamut', () => {
    const leaving = Colorimetry.define((medium) =>
      Effect.gen(function* () {
        const color = yield* Colorimetry.inMedium(brand, medium);

        return yield* Colorimetry.inGamut(
          medium,
          Colorimetry.add(color, Colorimetry.scale(hue.direction, Rational.fromBigInt(1n))),
        );
      }),
    );

    expect(
      Option.getOrThrow(Exit.findErrorOption(Colorimetry.inMedium(leaving, Colorimetry.srgb))),
    ).toMatchObject({
      _tag: 'OutOfGamut',
      medium: 'srgb',
      message:
        'Expected a color within the gamut of srgb, each linear channel from 0 to 1; its red channel is 1.92074',
    });
  });

  it('name every medium a definition fails in, with the reason it gives there', () => {
    const exit = Colorimetry.writeMedia(
      Colorimetry.purest({ hue, headroom: Colorimetry.relativeToWhite(Rational.fromBigInt(2n)) }),
    );
    const failures = Exit.isFailure(exit)
      ? exit.cause.reasons.flatMap((reason) => (reason._tag === 'Fail' ? [reason.error] : []))
      : [];

    expect(failures.map((failure) => failure.medium)).toEqual([
      'srgb',
      'displayP3',
      'rec2020',
      'rec2100Hlg',
    ]);
    expect(failures[0]?.message).toBe(
      'In srgb: Expected a headroom of at most 1 for srgb, so that the color stays within the medium, as its channels reach no further than its white\n  at ["headroom"]',
    );
    expect(failures[0]?.error._tag).toBe('SchemaError');
  });

  it('decide exactly whether a color lies in a gamut, naming the channel that leaves it', () => {
    expect(
      Exit.isSuccess(Colorimetry.inGamut(Colorimetry.srgb, Colorimetry.whiteTristimulus)),
    ).toBe(false);
    expect(
      Exit.isSuccess(
        Colorimetry.inGamut(
          Colorimetry.onExactWhite(Colorimetry.srgb),
          Colorimetry.whiteTristimulus,
        ),
      ),
    ).toBe(true);
  });
});

describe('types of definitions', () => {
  const hue = Option.getOrThrow(Exit.getSuccess(Colorimetry.complementaryWavelength(rows[518])));
  const brand = Colorimetry.purest({ hue });
  const color = Option.getOrThrow(Exit.getSuccess(Colorimetry.inMedium(brand, Colorimetry.srgb)));

  it('give a color proven to lie in the gamut of the medium it was worked out in', () => {
    expectTypeOf(color).toEqualTypeOf<Colorimetry.InGamut<typeof Colorimetry.srgb>>();
    expectTypeOf(color).toExtend<Colorimetry.Tristimulus>();
    expectTypeOf(Colorimetry.write(Colorimetry.srgb, color)).toBeString();
    expectTypeOf(Colorimetry.writeMedia(brand)).toEqualTypeOf<
      Exit.Exit<
        {
          readonly srgb: string;
          readonly displayP3: string;
          readonly rec2020: string;
          readonly rec2100Pq: string;
          readonly rec2100Hlg: string;
        },
        Colorimetry.FailedInMedium<Schema.SchemaError>
      >
    >();
  });

  it('write a color only in the medium it was proven in, on the same white', () => {
    // @ts-expect-error A color in the gamut of sRGB is not proven to lie in that of Display P3.
    Colorimetry.write(Colorimetry.displayP3, color);
    // @ts-expect-error A color on the white of the standard is not proven on the exact white.
    Colorimetry.write(Colorimetry.onExactWhite(Colorimetry.srgb), color);
    // @ts-expect-error A color not proven to lie in any gamut is not written.
    Colorimetry.write(Colorimetry.srgb, Colorimetry.whiteTristimulus);
  });

  it('take in byMedium only the names of media', () => {
    expectTypeOf(Colorimetry.byMedium).toBeCallableWith(brand, { displayP3: brand });
    // @ts-expect-error No medium of the library is named displayp3.
    Colorimetry.byMedium(brand, { displayp3: brand });
    const exceptions = { displayP3: brand, cmyk: brand };
    // @ts-expect-error A name of no medium is refused even when the exceptions come from a variable.
    Colorimetry.byMedium(brand, exceptions);
  });

  it('take in define only a rule that gives a color of the medium it is given', () => {
    expectTypeOf(Colorimetry.define((medium) => Colorimetry.inMedium(brand, medium))).toEqualTypeOf<
      Colorimetry.Definition<Schema.SchemaError>
    >();
    // @ts-expect-error A color proven in sRGB is not one of whichever medium the rule is given.
    Colorimetry.define(() => Colorimetry.inGamut(Colorimetry.srgb, Colorimetry.whiteTristimulus));
  });
});
