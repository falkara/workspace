import { describe, expect, it } from '@effect/vitest';
import { pipe, Rational } from 'effect';

import * as Tristimulus from '#src/Colorimetry/Tristimulus';

describe('add', () => {
  it('gives the sums of the amounts, so the white and its opposite mix to black', () => {
    expect(
      Tristimulus.add(
        Tristimulus.white,
        Tristimulus.scale(Tristimulus.white, Rational.fromBigInt(-1n)),
      ),
    ).toEqual(
      Tristimulus.make({
        X: Rational.fromBigInt(0n),
        Y: Rational.fromBigInt(0n),
        Z: Rational.fromBigInt(0n),
      }),
    );
  });

  it('gives the same mixture to a first color that pipes into it', () => {
    const twice = Tristimulus.scale(Tristimulus.white, Rational.fromBigInt(2n));

    expect(pipe(Tristimulus.white, Tristimulus.add(twice))).toEqual(
      Tristimulus.add(Tristimulus.white, twice),
    );
  });
});

describe('scale', () => {
  it('gives the products of the factor and the amounts, so twice the white has a Y of 2', () => {
    expect(Tristimulus.scale(Tristimulus.white, Rational.fromBigInt(2n)).Y).toEqual(
      Rational.fromBigInt(2n),
    );
  });

  it('gives the same products to a color that pipes into it', () => {
    expect(pipe(Tristimulus.white, Tristimulus.scale(Rational.fromBigInt(2n)))).toEqual(
      Tristimulus.scale(Tristimulus.white, Rational.fromBigInt(2n)),
    );
  });
});

describe('white', () => {
  it('has a Y of 1, just as the relative luminance of WCAG 2.2 takes white to be 1', () => {
    expect(Tristimulus.white.Y).toEqual(Rational.fromBigInt(1n));
  });

  it('holds X and Z in the lowest terms in which they were worked out', () => {
    expect([
      Tristimulus.white.X.numerator,
      Tristimulus.white.X.denominator,
      Tristimulus.white.Z.numerator,
      Tristimulus.white.Z.denominator,
    ]).toEqual([
      71740714395483087745n,
      75479154764200873016n,
      10272984088266781770n,
      9434894345525109127n,
    ]);
  });
});
