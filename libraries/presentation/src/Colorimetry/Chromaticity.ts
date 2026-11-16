import { Option, Rational } from 'effect';

import * as Theory from '#src/Colorimetry/Chromaticity.theory';
import { whiteTristimulus } from '#src/Colorimetry/Tristimulus';

/**
 * A schema of a property of a color stimulus that its chromaticity coordinates $x$ and $y$ define.
 *
 * @see https://cie.co.at/eilvterm/17-23-052
 */
export const Chromaticity = Theory.Chromaticity;

/**
 * A property of a color stimulus that its chromaticity coordinates $x$ and $y$ define.
 *
 * @see https://cie.co.at/eilvterm/17-23-052
 */
export type Chromaticity = Theory.Chromaticity;

/**
 * Brands without a check a property of a color stimulus that its chromaticity coordinates $x$ and $y$ define.
 *
 * @see https://cie.co.at/eilvterm/17-23-052
 */
export const chromaticity = Theory.chromaticity;

/**
 * Gives the chromaticity coordinate $z$ of the chromaticity, $z = 1 - x - y$.
 *
 * @see https://cie.co.at/eilvterm/17-23-053
 */
export const chromaticityZ: Theory.ChromaticityZ = (chromaticity) =>
  Rational.subtract(Rational.subtract(Rational.fromBigInt(1n), chromaticity.x), chromaticity.y);

/**
 * Gives `none` where $X + Y + Z = 0$ and otherwise the chromaticity of the tristimulus values, $x = X / (X + Y + Z)$ and $y = Y / (X + Y + Z)$.
 *
 * @see https://cie.co.at/eilvterm/17-23-053
 */
export const chromaticityOf: Theory.ChromaticityOf = (color) =>
  Option.zipWith(
    Rational.divide(color.X, Rational.sumAll([color.X, color.Y, color.Z])),
    Rational.divide(color.Y, Rational.sumAll([color.X, color.Y, color.Z])),
    (x, y) => chromaticity({ x, y }),
  );

/** The chromaticity coordinates of the library's white. */
export const whiteChromaticity: Chromaticity = chromaticity({
  x: Rational.divideUnsafe(
    whiteTristimulus.X,
    // The tristimulus values of the white are positive, so their sum is and the division cannot fail.
    Rational.sumAll([whiteTristimulus.X, whiteTristimulus.Y, whiteTristimulus.Z]),
  ),
  y: Rational.divideUnsafe(
    whiteTristimulus.Y,
    // The tristimulus values of the white are positive, so their sum is and the division cannot fail.
    Rational.sumAll([whiteTristimulus.X, whiteTristimulus.Y, whiteTristimulus.Z]),
  ),
});
