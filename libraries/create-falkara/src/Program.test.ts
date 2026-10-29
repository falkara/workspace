import { describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';
import { TestConsole } from 'effect/testing';

import manifest from '#package.json' with { type: 'json' };
import { program } from '#src/Program';

describe('Program', () => {
  it.effect('names create-falkara at the version published and what it is for', () =>
    Effect.gen(function* () {
      yield* program;
      const written = (yield* TestConsole.logLines).join('\n');

      expect(written).toContain(`create-falkara ${manifest.version}`);
      expect(written).toContain('The starting point for new projects on Falkara products.');
    }),
  );

  it.effect('lists every channel on a line of its own, its label beside its address', () =>
    Effect.gen(function* () {
      yield* program;
      const lines = (yield* TestConsole.logLines).join('\n').split('\n');

      for (const [label, url] of [
        ['Website', 'https://falkara.com'],
        ['Source', 'https://github.com/falkara/workspace'],
        ['Packages', 'https://npmjs.com/org/falkara'],
      ]) {
        expect(
          lines
            .find((line) => line.endsWith(url ?? ''))
            ?.trim()
            .startsWith(label ?? ''),
        ).toBe(true);
      }
    }),
  );

  it.effect('lines up every address in one column', () =>
    Effect.gen(function* () {
      yield* program;
      const lines = (yield* TestConsole.logLines).join('\n').split('\n');
      const columns = [
        'https://falkara.com',
        'https://github.com/falkara/workspace',
        'https://npmjs.com/org/falkara',
      ].map((url) => lines.find((line) => line.endsWith(url))?.indexOf(url));

      expect(new Set(columns).size).toBe(1);
    }),
  );
});
