import { describe, expect, it } from '@effect/vitest';
import { Rational } from 'effect';

import * as Tristimulus from '#src/Colorimetry/Tristimulus';

describe('tristimulusAdd', () => {
  it('gives the sums of the amounts, so the white and its opposite mix to black', () => {
    expect(
      Tristimulus.tristimulusAdd(
        Tristimulus.whiteTristimulus,
        Tristimulus.tristimulusScale(Tristimulus.whiteTristimulus, Rational.fromBigInt(-1n)),
      ),
    ).toEqual(
      Tristimulus.tristimulus({
        X: Rational.fromBigInt(0n),
        Y: Rational.fromBigInt(0n),
        Z: Rational.fromBigInt(0n),
      }),
    );
  });
});

describe('tristimulusScale', () => {
  it('gives the products of the factor and the amounts, so twice the white has a Y of 2', () => {
    expect(
      Tristimulus.tristimulusScale(Tristimulus.whiteTristimulus, Rational.fromBigInt(2n)).Y,
    ).toEqual(Rational.fromBigInt(2n));
  });
});

describe('whiteTristimulus', () => {
  it('has a Y of 1, just as the relative luminance of WCAG 2.2 takes white to be 1', () => {
    expect(Tristimulus.whiteTristimulus.Y).toEqual(Rational.fromBigInt(1n));
  });

  it('holds X and Z in the lowest terms in which they were worked out', () => {
    expect([
      Tristimulus.whiteTristimulus.X.numerator,
      Tristimulus.whiteTristimulus.X.denominator,
      Tristimulus.whiteTristimulus.Z.numerator,
      Tristimulus.whiteTristimulus.Z.denominator,
    ]).toEqual([
      71740714395483087745n,
      75479154764200873016n,
      10272984088266781770n,
      9434894345525109127n,
    ]);
  });
});
