import { Option, Rational } from 'effect';

import * as Theory from '#src/Colorimetry/Chromaticity.theory';
import * as Tristimulus from '#src/Colorimetry/Tristimulus';

export { Chromaticity, make } from '#src/Colorimetry/Chromaticity.theory';

/**
 * Gives the chromaticity coordinate $z$ of the chromaticity, $z = 1 - x - y$.
 *
 * @see https://cie.co.at/eilvterm/17-23-053
 */
export const z: Theory.Z = (chromaticity) =>
  Rational.subtract(Rational.subtract(Rational.fromBigInt(1n), chromaticity.x), chromaticity.y);

/**
 * Gives `none` where $X + Y + Z = 0$ and otherwise the chromaticity of the tristimulus values, $x = X / (X + Y + Z)$ and $y = Y / (X + Y + Z)$.
 *
 * @see https://cie.co.at/eilvterm/17-23-053
 */
export const ofTristimulus: Theory.OfTristimulus = (color) =>
  Option.zipWith(
    Rational.divide(color.X, Rational.sumAll([color.X, color.Y, color.Z])),
    Rational.divide(color.Y, Rational.sumAll([color.X, color.Y, color.Z])),
    (x, y) => Theory.make({ x, y }),
  );

/** The chromaticity coordinates of the library's white. */
export const white: Theory.Chromaticity = Theory.make({
  x: Rational.divideUnsafe(
    Tristimulus.white.X,
    // The tristimulus values of the white are positive, so their sum is and the division cannot fail.
    Rational.sumAll([Tristimulus.white.X, Tristimulus.white.Y, Tristimulus.white.Z]),
  ),
  y: Rational.divideUnsafe(
    Tristimulus.white.Y,
    // The tristimulus values of the white are positive, so their sum is and the division cannot fail.
    Rational.sumAll([Tristimulus.white.X, Tristimulus.white.Y, Tristimulus.white.Z]),
  ),
});
