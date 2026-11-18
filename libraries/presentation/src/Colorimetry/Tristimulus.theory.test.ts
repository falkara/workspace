// Written by the generator of the theory from `Falkara.Presentation.Colorimetry.Tristimulus`, so every change by hand is lost when the generator runs.

import { describe, expect, it } from '@effect/vitest';
import { Schema } from 'effect';

import * as Tristimulus from '#src/Colorimetry/Tristimulus';

describe('Colorimetry/Tristimulus', () => {
  /**
   * The additive mixture of two color stimuli is the same in either order, $X_1 + X_2 = X_2 + X_1$ and likewise for $Y$ and $Z$.
   *
   * @see https://cie.co.at/eilvterm/17-23-040
   */
  it.prop(
    'Tristimulus.add_comm',
    { first: Tristimulus.Tristimulus, second: Tristimulus.Tristimulus },
    ({ first, second }) => {
      const actual = Tristimulus.tristimulusAdd(first, second);
      const expected = Tristimulus.tristimulusAdd(second, first);
      expect(actual).toEqual(expected);
    },
  );

  /**
   * The additive mixture of three color stimuli is the same in either grouping, $(X_1 + X_2) + X_3 = X_1 + (X_2 + X_3)$ and likewise for $Y$ and $Z$.
   *
   * @see https://cie.co.at/eilvterm/17-23-040
   */
  it.prop(
    'Tristimulus.add_assoc',
    {
      first: Tristimulus.Tristimulus,
      second: Tristimulus.Tristimulus,
      third: Tristimulus.Tristimulus,
    },
    ({ first, second, third }) => {
      const actual = Tristimulus.tristimulusAdd(Tristimulus.tristimulusAdd(first, second), third);
      const expected = Tristimulus.tristimulusAdd(first, Tristimulus.tristimulusAdd(second, third));
      expect(actual).toEqual(expected);
    },
  );

  /**
   * A factor of units of the additive mixture of two color stimuli is the mixture of that factor of units of each, $c\,(X_1 + X_2) = c\,X_1 + c\,X_2$ and likewise for $Y$ and $Z$.
   *
   * @see https://cie.co.at/eilvterm/17-23-040
   */
  it.prop(
    'Tristimulus.scale_add',
    { first: Tristimulus.Tristimulus, second: Tristimulus.Tristimulus, factor: Schema.Rational },
    ({ first, second, factor }) => {
      const actual = Tristimulus.tristimulusScale(
        Tristimulus.tristimulusAdd(first, second),
        factor,
      );
      const expected = Tristimulus.tristimulusAdd(
        Tristimulus.tristimulusScale(first, factor),
        Tristimulus.tristimulusScale(second, factor),
      );
      expect(actual).toEqual(expected);
    },
  );
});
