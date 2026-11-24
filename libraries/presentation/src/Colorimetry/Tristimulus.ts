import { Function, Rational } from 'effect';

import * as Theory from '#src/Colorimetry/Tristimulus.theory';

export { make, Tristimulus, white } from '#src/Colorimetry/Tristimulus.theory';

/**
 * Gives the tristimulus values of the additive mixture of two color stimuli as the sums of their amounts, $X_1 + X_2$, $Y_1 + Y_2$, and $Z_1 + Z_2$.
 *
 * @see https://cie.co.at/eilvterm/17-23-040
 */
export const add: Theory.Add = Function.dual(
  2,
  (first: Theory.Tristimulus, second: Theory.Tristimulus): Theory.Tristimulus =>
    Theory.make({
      X: Rational.sum(first.X, second.X),
      Y: Rational.sum(first.Y, second.Y),
      Z: Rational.sum(first.Z, second.Z),
    }),
);

/**
 * Gives the tristimulus values of a factor $c$ of units of a color stimulus as the products of the factor and its amounts, $cX$, $cY$, and $cZ$.
 *
 * @see https://cie.co.at/eilvterm/17-23-040
 */
export const scale: Theory.Scale = Function.dual(
  2,
  (color: Theory.Tristimulus, factor: Rational.Rational): Theory.Tristimulus =>
    Theory.make({
      X: Rational.multiply(factor, color.X),
      Y: Rational.multiply(factor, color.Y),
      Z: Rational.multiply(factor, color.Z),
    }),
);
