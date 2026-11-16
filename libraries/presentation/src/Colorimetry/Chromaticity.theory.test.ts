// Written by the generator of Falkara Theory from `Presentation.Colorimetry.Chromaticity`, so every change by hand is lost when the generator runs.

import { describe, expect, it } from '@effect/vitest';
import { Equal, Rational, Schema } from 'effect';

import * as Tristimulus from '#src/Colorimetry/Tristimulus';
import * as Chromaticity from '#src/Colorimetry/Chromaticity';

describe('Colorimetry/Chromaticity', () => {
  /**
   * The chromaticity of a factor $c \neq 0$ of units of a color stimulus is the chromaticity of the stimulus, as the chromaticity coordinates are quotients of the tristimulus values and their sum, $c\,X / (c\,X + c\,Y + c\,Z) = X / (X + Y + Z)$ and likewise for $y$.
   *
   * @see https://cie.co.at/eilvterm/17-23-053
   */
  it.prop(
    'chromaticityOf_scale',
    { tristimulus: Tristimulus.Tristimulus, factor: Schema.Rational },
    ({ tristimulus, factor }) => {
      if (Equal.equals(factor, Rational.fromBigInt(0n))) {
        return;
      }
      const actual = Chromaticity.chromaticityOf(Tristimulus.tristimulusScale(tristimulus, factor));
      const expected = Chromaticity.chromaticityOf(tristimulus);
      expect(actual).toEqual(expected);
    },
  );
});
