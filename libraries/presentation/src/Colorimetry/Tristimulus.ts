import { Rational } from 'effect';

import * as Theory from '#src/Colorimetry/Tristimulus.theory';

export { Tristimulus, tristimulus, whiteTristimulus } from '#src/Colorimetry/Tristimulus.theory';

/**
 * Gives the tristimulus values of the additive mixture of two color stimuli as the sums of their amounts, $X_1 + X_2$, $Y_1 + Y_2$, and $Z_1 + Z_2$.
 *
 * @see https://cie.co.at/eilvterm/17-23-040
 */
export const tristimulusAdd: Theory.TristimulusAdd = (first, second) =>
  Theory.tristimulus({
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
  Theory.tristimulus({
    X: Rational.multiply(factor, color.X),
    Y: Rational.multiply(factor, color.Y),
    Z: Rational.multiply(factor, color.Z),
  });
