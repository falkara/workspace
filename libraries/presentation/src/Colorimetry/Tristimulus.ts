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
 * The tristimulus values of the white, those of CIE standard illuminant D65 scaled so that their luminance factor $Y$ is 1, $X = \sum_{\lambda} S(\lambda)\,\bar{x}(\lambda) / \sum_{\lambda} S(\lambda)\,\bar{y}(\lambda)$, $Y = 1$, and $Z = \sum_{\lambda} S(\lambda)\,\bar{z}(\lambda) / \sum_{\lambda} S(\lambda)\,\bar{y}(\lambda)$.
 *
 * @see https://cie.co.at/eilvterm/17-23-081
 */
export const whiteTristimulus = Theory.whiteTristimulus;
