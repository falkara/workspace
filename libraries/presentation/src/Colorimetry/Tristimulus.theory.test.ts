// Written by the translator from `Falkara.Presentation.Colorimetry.Tristimulus`, so every change by hand is lost when the translator runs.
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
      const actual = Tristimulus.add(first, second);
      const expected = Tristimulus.add(second, first);
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
      const actual = Tristimulus.add(Tristimulus.add(first, second), third);
      const expected = Tristimulus.add(first, Tristimulus.add(second, third));
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
      const actual = Tristimulus.scale(Tristimulus.add(first, second), factor);
      const expected = Tristimulus.add(
        Tristimulus.scale(first, factor),
        Tristimulus.scale(second, factor),
      );
      expect(actual).toEqual(expected);
    },
  );
});
