import { describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';

import { environment } from '../Environment';

describe('environment', () => {
  it.effect(
    'verifies every color of text and every boundary in the light and the dark scheme, and hands each color to StyleX in both',
    () =>
      Effect.gen(function* () {
        const env = yield* environment;

        expect(
          Object.values(env.color).every((color) =>
            /^light-dark\(oklch\(.*\), oklch\(.*\)\)$/.test(color),
          ),
        ).toBe(true);
      }),
  );
});
