// @vitest-environment happy-dom
import { ssr } from '@effect/ui/html/testing';
import { TestHost } from '@effect/ui/testing';
import { afterEach, describe, expect, it } from '@effect/vitest';
import { Effect } from 'effect';

import { Editor } from '#src/Editor';
import { schemeKey } from '#src/Scheme';

describe('prerendering', () => {
  it.effect('renders the three panels of the empty editor ahead of the browser', () =>
    Effect.gen(function* () {
      const rendered = yield* ssr(Editor, {}, { static: true });

      expect(rendered.html).toContain('aria-label="Palette"');
      expect(rendered.html).toContain('Mealy machine');
      expect(rendered.html).toContain('Boxes: 0. Wires: 0.');
      expect(rendered.html).toContain('aria-label="Inspector"');
    }).pipe(Effect.provide(TestHost.layer())),
  );

  it.effect(
    'hydrates what it rendered without a mismatch, the editor and its switch of the color scheme adopting their elements',
    () =>
      Effect.gen(function* () {
        const rendered = yield* ssr(Editor, {}, { static: true });

        expect(rendered.adopted).toStrictEqual(['/Editor', '/Editor/Scheme[scheme]']);
      }).pipe(Effect.provide(TestHost.layer())),
  );

  it.effect(
    'renders no color scheme, which no server knows, so that the root keeps what the inline script set',
    () =>
      Effect.gen(function* () {
        const rendered = yield* ssr(Editor, {}, { static: true });

        expect(rendered.html).not.toContain('data-scheme');
        expect(rendered.state['/Editor/Scheme[scheme]']).toStrictEqual({
          chosen: null,
          forgotten: false,
        });
      }).pipe(Effect.provide(TestHost.layer())),
  );
});

describe('color scheme', () => {
  // The key-value store of the browser starts empty in every test and is emptied after it, so that no test reads the choice of another.
  afterEach(() => {
    globalThis.localStorage.clear();
  });

  it.effect.each([
    { stored: 'light', scheme: 'light', label: 'Light' },
    { stored: 'dark', scheme: 'dark', label: 'Dark' },
    { stored: null, scheme: 'system', label: 'System' },
  ])(
    'sets the scheme the browser keeps, $scheme, on the root of the hydrated document and presses its button',
    ({ stored, scheme, label }) =>
      Effect.gen(function* () {
        if (stored !== null) globalThis.localStorage.setItem(schemeKey, stored);

        const rendered = yield* ssr(Editor, {}, { static: true });
        yield* TestHost.settle;

        expect(rendered.document.documentElement.getAttribute('data-scheme')).toBe(scheme);
        expect(
          [...rendered.container.querySelectorAll('button[aria-pressed="true"]')].map(
            (button) => button.textContent,
          ),
        ).toStrictEqual([label]);
      }).pipe(Effect.provide(TestHost.layer())),
  );
});
