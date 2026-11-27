import { HtmlHead } from '@effect/ui/html';
import { HtmlLocator, HtmlScene } from '@effect/ui/html/testing';
import { Locator, Story } from '@effect/ui/testing';
import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer } from 'effect';
import * as KeyValueStore from 'effect/persistence/KeyValueStore';

import { ReadScheme, Scheme, SchemeMessage, WriteScheme, schemeKey } from '#src/Scheme';

describe('update', () => {
  it.effect.each([
    { stored: 'dark', chosen: 'dark' },
    { stored: 'light', chosen: 'light' },
    { stored: 'system', chosen: 'system' },
    { stored: null, chosen: 'system' },
    { stored: 'sepia', chosen: 'system' },
  ] as const)(
    'starts from the scheme the browser keeps, $stored, as $chosen, and sets it on the root',
    ({ stored, chosen }) =>
      Effect.gen(function* () {
        const story = yield* Story.make(Scheme, {});
        expect(story.model.chosen).toBe(null);
        expect(Story.head(story.current)).toStrictEqual([]);

        story
          .expectExact(ReadScheme)
          .resolve(ReadScheme, SchemeMessage.SucceededReadScheme({ stored }));

        expect(story.model).toStrictEqual({ chosen, forgotten: false });
        expect(Story.head(story.current)).toStrictEqual([HtmlHead.htmlData('data-scheme', chosen)]);
      }),
  );

  it.effect('takes the scheme of the system and says so when the browser refuses its storage', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Scheme, {});

      story.resolve(ReadScheme, SchemeMessage.FailedReadScheme());

      expect(story.model).toStrictEqual({ chosen: 'system', forgotten: true });
    }),
  );

  it.effect(
    'keeps a chosen scheme in the browser and sets it on the root, and says when the browser refuses it',
    () =>
      Effect.gen(function* () {
        const story = yield* Story.make(Scheme, {});
        story.resolve(ReadScheme, SchemeMessage.SucceededReadScheme({ stored: null }));

        story
          .send(SchemeMessage.ClickedScheme({ scheme: 'dark' }))
          .expectExact(WriteScheme)
          .resolve(WriteScheme, SchemeMessage.FailedWriteScheme());
        expect(story.model).toStrictEqual({ chosen: 'dark', forgotten: true });
        expect(Story.head(story.current)).toStrictEqual([HtmlHead.htmlData('data-scheme', 'dark')]);

        story
          .send(SchemeMessage.ClickedScheme({ scheme: 'light' }))
          .resolve(WriteScheme, SchemeMessage.SucceededWriteScheme());
        expect(story.model).toStrictEqual({ chosen: 'light', forgotten: false });
      }),
  );

  it.effect('keeps a choice made before the browser has said what it keeps', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Scheme, {});

      story
        .keepPending(ReadScheme)
        .send(SchemeMessage.ClickedScheme({ scheme: 'dark' }))
        .resolve(WriteScheme, SchemeMessage.SucceededWriteScheme())
        .resolve(ReadScheme, SchemeMessage.SucceededReadScheme({ stored: 'light' }));

      expect(story.model.chosen).toBe('dark');
    }),
  );
});

describe('view', () => {
  it.effect('offers the schemes as toggle buttons in a named group, the chosen one pressed', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Scheme, {});
      const group = HtmlLocator.role('group', { name: 'Color scheme' });

      scene
        .expect(Locator.inside(group, Locator.attr('aria-pressed', 'true')))
        .toHaveCount(0)
        .resolve(ReadScheme, SchemeMessage.SucceededReadScheme({ stored: 'dark' }))
        .expect(Locator.inside(group, HtmlLocator.role('button', { name: 'Dark' })))
        .toHaveAttribute('aria-pressed', 'true')
        .click(HtmlLocator.role('button', { name: 'Light' }))
        .resolve(WriteScheme, SchemeMessage.FailedWriteScheme())
        .expect(HtmlLocator.role('button', { name: 'Light' }))
        .toHaveAttribute('aria-pressed', 'true')
        .expect(HtmlLocator.role('button', { name: 'Dark' }))
        .toHaveAttribute('aria-pressed', 'false')
        .expect(Locator.attr('role', 'status'))
        .toHaveText('The browser keeps no choice here, so this one lasts until the page is left.');
    }),
  );
});

describe('ReadScheme and WriteScheme', () => {
  it.effect('keep the scheme under its key and read it back', () =>
    Effect.gen(function* () {
      const written = yield* WriteScheme.make({ scheme: 'dark' }).effect;
      const read = yield* ReadScheme.make().effect;
      const store = yield* KeyValueStore.KeyValueStore;

      expect(written).toStrictEqual(SchemeMessage.SucceededWriteScheme());
      expect(read).toStrictEqual(SchemeMessage.SucceededReadScheme({ stored: 'dark' }));
      expect(yield* store.get(schemeKey)).toBe('dark');
    }).pipe(
      Effect.provide(
        Layer.mergeAll(ReadScheme.layer, WriteScheme.layer).pipe(
          Layer.provideMerge(KeyValueStore.layerMemory),
        ),
      ),
    ),
  );

  it.effect('say the browser refused, rather than fail, when its storage refuses', () =>
    Effect.gen(function* () {
      const written = yield* WriteScheme.make({ scheme: 'dark' }).effect;
      const read = yield* ReadScheme.make().effect;

      expect(written).toStrictEqual(SchemeMessage.FailedWriteScheme());
      expect(read).toStrictEqual(SchemeMessage.FailedReadScheme());
    }).pipe(
      Effect.provide(
        Layer.mergeAll(ReadScheme.layer, WriteScheme.layer).pipe(
          Layer.provide(
            Layer.succeed(
              KeyValueStore.KeyValueStore,
              KeyValueStore.makeStringOnly({
                get: (key) =>
                  Effect.fail(
                    new KeyValueStore.KeyValueStoreError({
                      method: 'get',
                      key,
                      message: 'refused',
                    }),
                  ),
                set: (key) =>
                  Effect.fail(
                    new KeyValueStore.KeyValueStoreError({
                      method: 'set',
                      key,
                      message: 'refused',
                    }),
                  ),
                remove: () => Effect.void,
                clear: Effect.void,
                size: Effect.succeed(0),
                keys: Effect.succeed([]),
              }),
            ),
          ),
        ),
      ),
    ),
  );
});
