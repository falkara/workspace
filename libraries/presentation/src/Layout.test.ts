import { describe, expect, it } from '@effect/vitest';

import * as Layout from '#src/Layout';

describe('measures', () => {
  it('are the line lengths of the USWDS measure tokens', () => {
    expect(Layout.measures).toEqual([44, 60, 64, 68, 72, 88]);
  });

  it('run from the shortest to the longest', () => {
    expect([...Layout.measures].sort((a, b) => a - b)).toEqual(Layout.measures);
  });
});
