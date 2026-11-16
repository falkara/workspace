// Written by the generator of Falkara Theory from `Presentation.Colorimetry.Chromaticity`, so every change by hand is lost when the generator runs.

import { Brand, type Option, type Rational, Schema } from 'effect';

import type { Tristimulus } from '#src/Colorimetry/Tristimulus.theory';
import type * as Module from '#src/Colorimetry/Chromaticity';

/**
 * A schema of a property of a color stimulus that its chromaticity coordinates $x$ and $y$ define.
 *
 * @see https://cie.co.at/eilvterm/17-23-052
 */
export const Chromaticity = Schema.Struct({
  /**
   * The quotient of the tristimulus value $X$ and the sum $X + Y + Z$.
   *
   * @see https://cie.co.at/eilvterm/17-23-053
   */
  x: Schema.Rational,
  /**
   * The quotient of the tristimulus value $Y$ and the sum $X + Y + Z$.
   *
   * @see https://cie.co.at/eilvterm/17-23-053
   */
  y: Schema.Rational,
}).pipe(Schema.brand('Chromaticity'));

/**
 * A property of a color stimulus that its chromaticity coordinates $x$ and $y$ define.
 *
 * @see https://cie.co.at/eilvterm/17-23-052
 */
export type Chromaticity = typeof Chromaticity.Type;

/**
 * Brands without a check a property of a color stimulus that its chromaticity coordinates $x$ and $y$ define.
 *
 * @see https://cie.co.at/eilvterm/17-23-052
 */
export const chromaticity = Brand.nominal<Chromaticity>();

/**
 * Gives the chromaticity coordinate $z$ of the chromaticity, $z = 1 - x - y$.
 *
 * @see https://cie.co.at/eilvterm/17-23-053
 */
export type ChromaticityZ = (chromaticity: Chromaticity) => Rational.Rational;

/**
 * Gives `none` where $X + Y + Z = 0$ and otherwise the chromaticity of the tristimulus values, $x = X / (X + Y + Z)$ and $y = Y / (X + Y + Z)$.
 *
 * @see https://cie.co.at/eilvterm/17-23-053
 */
export type ChromaticityOf = (tristimulus: Tristimulus) => Option.Option<Chromaticity>;

/** The functions of the theory that the module `Colorimetry/Chromaticity` of the package implements. */
interface Contract {
  /**
   * Gives the chromaticity coordinate $z$ of the chromaticity, $z = 1 - x - y$.
   *
   * @see https://cie.co.at/eilvterm/17-23-053
   */
  readonly chromaticityZ: ChromaticityZ;
  /**
   * Gives `none` where $X + Y + Z = 0$ and otherwise the chromaticity of the tristimulus values, $x = X / (X + Y + Z)$ and $y = Y / (X + Y + Z)$.
   *
   * @see https://cie.co.at/eilvterm/17-23-053
   */
  readonly chromaticityOf: ChromaticityOf;
}

/** The module `Colorimetry/Chromaticity` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */
type _Implemented<Implementation extends Contract = typeof Module> = Implementation;
