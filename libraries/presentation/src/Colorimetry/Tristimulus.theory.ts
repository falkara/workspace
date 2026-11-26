// Written by the generator of the theory from `Falkara.Presentation.Colorimetry.Tristimulus`, so every change by hand is lost when the generator runs.
import { Brand, Rational, Schema } from 'effect';

import type * as Module from '#src/Colorimetry/Tristimulus';

/**
 * A schema that decodes tristimulus values from their amounts $X$, $Y$, and $Z$.
 *
 * @see https://cie.co.at/eilvterm/17-23-045
 */
export const Tristimulus = Schema.Struct({
  /**
   * The amount of the reference color stimulus $[X]$.
   *
   * @see https://cie.co.at/eilvterm/17-23-038
   */
  X: Schema.Rational,
  /**
   * The amount of the reference color stimulus $[Y]$.
   *
   * @see https://cie.co.at/eilvterm/17-23-038
   */
  Y: Schema.Rational,
  /**
   * The amount of the reference color stimulus $[Z]$.
   *
   * @see https://cie.co.at/eilvterm/17-23-038
   */
  Z: Schema.Rational,
}).pipe(Schema.brand('Tristimulus'));

/**
 * A triple of the amounts $X$, $Y$, and $Z$ that match the color of a color stimulus by the reference color stimuli $[X]$, $[Y]$, and $[Z]$ of the CIE 1931 standard colorimetric system.
 *
 * @see https://cie.co.at/eilvterm/17-23-045
 */
export type Tristimulus = typeof Tristimulus.Type;

/**
 * Creates tristimulus values from their amounts $X$, $Y$, and $Z$ without checking them.
 *
 * @see https://cie.co.at/eilvterm/17-23-045
 */
export const make = Brand.nominal<Tristimulus>();

/**
 * Gives the tristimulus values of the additive mixture of two color stimuli as the sums of their amounts, $X_1 + X_2$, $Y_1 + Y_2$, and $Z_1 + Z_2$.
 *
 * @see https://cie.co.at/eilvterm/17-23-040
 */
export interface Add {
  (first: Tristimulus, second: Tristimulus): Tristimulus;
  (second: Tristimulus): (first: Tristimulus) => Tristimulus;
}

/**
 * Gives the tristimulus values of a factor $c$ of units of a color stimulus as the products of the factor and its amounts, $cX$, $cY$, and $cZ$.
 *
 * @see https://cie.co.at/eilvterm/17-23-040
 */
export interface Scale {
  (tristimulus: Tristimulus, factor: Rational.Rational): Tristimulus;
  (factor: Rational.Rational): (tristimulus: Tristimulus) => Tristimulus;
}

/**
 * The tristimulus values of the white, those of CIE standard illuminant D65 scaled so that their luminance factor $Y$ is 1, $X = \sum_{\lambda} S(\lambda)\,\bar{x}(\lambda) / \sum_{\lambda} S(\lambda)\,\bar{y}(\lambda)$, $Y = 1$, and $Z = \sum_{\lambda} S(\lambda)\,\bar{z}(\lambda) / \sum_{\lambda} S(\lambda)\,\bar{y}(\lambda)$.
 *
 * @see https://cie.co.at/eilvterm/17-23-081
 */
export const white: Tristimulus = make({
  X: Rational.makeUnsafe(71740714395483087745n, 75479154764200873016n),
  Y: Rational.fromBigInt(1n),
  Z: Rational.makeUnsafe(10272984088266781770n, 9434894345525109127n),
});

/** A contract of the functions of the theory that the module `Colorimetry/Tristimulus` of the package implements. */
interface Contract {
  /**
   * Gives the tristimulus values of the additive mixture of two color stimuli as the sums of their amounts, $X_1 + X_2$, $Y_1 + Y_2$, and $Z_1 + Z_2$.
   *
   * @see https://cie.co.at/eilvterm/17-23-040
   */
  readonly add: Add;
  /**
   * Gives the tristimulus values of a factor $c$ of units of a color stimulus as the products of the factor and its amounts, $cX$, $cY$, and $cZ$.
   *
   * @see https://cie.co.at/eilvterm/17-23-040
   */
  readonly scale: Scale;
}

/** A check of the module `Colorimetry/Tristimulus` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
