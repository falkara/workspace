import { Rational } from 'effect';

import * as Theory from '#src/Colorimetry/Tristimulus.theory';

/**
 * A schema of a triple of the amounts $X$, $Y$, and $Z$ that match the color of a color stimulus by the reference color stimuli $[X]$, $[Y]$, and $[Z]$ of the CIE 1931 standard colorimetric system.
 *
 * @see https://cie.co.at/eilvterm/17-23-045
 */
export const Tristimulus = Theory.Tristimulus;

/**
 * A triple of the amounts $X$, $Y$, and $Z$ that match the color of a color stimulus by the reference color stimuli $[X]$, $[Y]$, and $[Z]$ of the CIE 1931 standard colorimetric system.
 *
 * @see https://cie.co.at/eilvterm/17-23-045
 */
export type Tristimulus = Theory.Tristimulus;

/**
 * Brands without a check a triple of the amounts $X$, $Y$, and $Z$ that match the color of a color stimulus by the reference color stimuli $[X]$, $[Y]$, and $[Z]$ of the CIE 1931 standard colorimetric system.
 *
 * @see https://cie.co.at/eilvterm/17-23-045
 */
export const tristimulus = Theory.tristimulus;

/**
 * Gives the tristimulus values of the additive mixture of two color stimuli as the sums of their amounts, $X_1 + X_2$, $Y_1 + Y_2$, and $Z_1 + Z_2$.
 *
 * @see https://cie.co.at/eilvterm/17-23-040
 */
export const tristimulusAdd: Theory.TristimulusAdd = (first, second) =>
  tristimulus({
    X: Rational.sum(first.X, second.X),
    Y: Rational.sum(first.Y, second.Y),
    Z: Rational.sum(first.Z, second.Z),
  });

/**
 * Gives the tristimulus values of a factor $c$ of units of a color stimulus as the products of the factor and its amounts, $cX$, $cY$, and $cZ$.
 *
 * @see https://cie.co.at/eilvterm/17-23-040
 */
export const tristimulusScale: Theory.TristimulusScale = (color, factor) =>
  tristimulus({
    X: Rational.multiply(factor, color.X),
    Y: Rational.multiply(factor, color.Y),
    Z: Rational.multiply(factor, color.Z),
  });

/**
 * The tristimulus values of CIE standard illuminant D65 under the CIE 1931 2° observer, worked out once from the CIE datasets (SHA-256 `fa663e3535a7e0763a745993a1f0a192eb0275ac46ad2d1befd7626841e713c1` and `e76f210bffff3d552ef7113025da5f325d5dfec200dd4b878b1a2f3a507032cb`) by summing every 1 nm from 360 nm to 830 nm, as CIE 015 prescribes.
 *
 * @see https://cie.co.at/publications/colorimetry-part-2-cie-standard-illuminants-0
 * @see https://cie.co.at/publications/colorimetry-part-1-cie-standard-colorimetric-observers-0
 * @see https://doi.org/10.25039/CIE.DS.xvudnb9b
 * @see https://doi.org/10.25039/CIE.DS.hjfjmt59
 * @see https://doi.org/10.25039/TR.015.2018
 */
export const whiteTristimulus: Tristimulus = tristimulus({
  X: Rational.makeUnsafe(71740714395483087745n, 75479154764200873016n),
  Y: Rational.fromBigInt(1n),
  Z: Rational.makeUnsafe(10272984088266781770n, 9434894345525109127n),
});
