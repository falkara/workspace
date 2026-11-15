// Written by the generator of Falkara Theory from `Presentation.Colorimetry`, so every change by hand is lost when the generator runs.

import { type Option, type Rational, Schema } from 'effect';

export const Tristimulus = Schema.Struct({
  X: Schema.Rational,
  Y: Schema.Rational,
  Z: Schema.Rational,
}).pipe(Schema.brand('Tristimulus'));

export type Tristimulus = typeof Tristimulus.Type;

export type TristimulusOf = (
  colorStimulusFunction: (wavelength: Rational.Rational) => Rational.Rational,
) => Tristimulus;

export const Chromaticity = Schema.Struct({
  x: Schema.Rational,
  y: Schema.Rational,
}).pipe(Schema.brand('Chromaticity'));

export type Chromaticity = typeof Chromaticity.Type;

export type ChromaticityZ = (chromaticity: Chromaticity) => Rational.Rational;

export type ChromaticityOf = (tristimulus: Tristimulus) => Option.Option<Chromaticity>;
