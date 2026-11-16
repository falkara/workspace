// Written by the generator of Falkara Theory from `Presentation.Colorimetry.Tristimulus`, so every change by hand is lost when the generator runs.

import { Brand, Schema } from 'effect';

/**
 * A schema of a triple of the amounts $X$, $Y$, and $Z$ that match the color of a color stimulus by the reference color stimuli $[X]$, $[Y]$, and $[Z]$ of the CIE 1931 standard colorimetric system.
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
 * Brands without a check a triple of the amounts $X$, $Y$, and $Z$ that match the color of a color stimulus by the reference color stimuli $[X]$, $[Y]$, and $[Z]$ of the CIE 1931 standard colorimetric system.
 *
 * @see https://cie.co.at/eilvterm/17-23-045
 */
export const tristimulus = Brand.nominal<Tristimulus>();
