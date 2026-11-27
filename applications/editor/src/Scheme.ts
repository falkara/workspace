import { Command, Component, UiSchema } from '@effect/ui';
import { Toggle } from '@effect/ui-kit';
import { Html, HtmlHead } from '@effect/ui/html';
import * as stylex from '@stylexjs/stylex';
import { Effect, Layer, Schema } from 'effect';
import * as KeyValueStore from 'effect/persistence/KeyValueStore';

import { styled } from '#src/Styled';

/** A schema of the color schemes the editor is shown in: the one the system prefers, which the browser follows, or the light or the dark one, as the person chose. */
export const SchemeChoice = Schema.Literals(['system', 'light', 'dark']);

/** A color scheme the editor is shown in. */
export type SchemeChoice = typeof SchemeChoice.Type;

/** The key the browser keeps the chosen scheme under in its local storage. The inline script of `index.html` reads the same key, so that a prerendered document is drawn in the chosen scheme before the editor runs. */
export const schemeKey = 'falkara-editor/scheme';

/** A schema of what the switch of the color scheme holds. */
export const SchemeModel = Schema.Struct({
  /** The scheme the person chose, until the choice the browser remembers is read, which the document never learns from the server. */
  chosen: Schema.NullOr(SchemeChoice),
  /** Whether the browser refused to read or to keep the choice, as one does that blocks the storage of the site, so that the choice lasts only as long as the page, which the switch says. */
  forgotten: Schema.Boolean,
});

/** What the switch of the color scheme holds. */
export type SchemeModel = typeof SchemeModel.Type;

/** A schema of what happens to the switch of the color scheme, each a fact named for its cause. */
export const SchemeMessage = UiSchema.TaggedEnum({
  /** A scheme was chosen by its button. */
  ClickedScheme: { scheme: SchemeChoice },
  /** The browser gave the scheme it keeps under the key, as it was written, or nothing when it keeps none. */
  SucceededReadScheme: { stored: Schema.NullOr(Schema.String) },
  /** The browser refused to read its storage. */
  FailedReadScheme: {},
  /** The browser kept the chosen scheme. */
  SucceededWriteScheme: {},
  /** The browser refused to keep the chosen scheme. */
  FailedWriteScheme: {},
});

/** What happens to the switch of the color scheme. */
export type SchemeMessage = typeof SchemeMessage.Type;

/** The switch of the color scheme, as a component of its own: it keeps the choice in the browser and sets it on the document, apart from the design the editor holds. */
export const SchemeDef = Html.component({
  name: 'Scheme',
  model: SchemeModel,
  message: SchemeMessage,
});

/** The Command that reads the scheme the browser keeps, and says what it read or that the browser refused. It reaches the storage through the key-value store of Effect, so that a test gives it one of its own. */
export class ReadScheme extends Command.Service<ReadScheme>()('editor/ReadScheme', {
  args: {},
  success: SchemeMessage,
}) {
  static readonly layer = this.toLayer(
    Effect.gen(function* () {
      const store = yield* KeyValueStore.KeyValueStore;
      return () =>
        store.get(schemeKey).pipe(
          Effect.match({
            onSuccess: (stored) => SchemeMessage.SucceededReadScheme({ stored: stored ?? null }),
            onFailure: () => SchemeMessage.FailedReadScheme(),
          }),
        );
    }),
  );
}

/** The Command that has the browser keep the chosen scheme, and says whether it did. */
export class WriteScheme extends Command.Service<WriteScheme>()('editor/WriteScheme', {
  args: { scheme: SchemeChoice },
  success: SchemeMessage,
}) {
  static readonly layer = this.toLayer(
    Effect.gen(function* () {
      const store = yield* KeyValueStore.KeyValueStore;
      return ({ scheme }) =>
        store.set(schemeKey, scheme).pipe(
          Effect.match({
            onSuccess: () => SchemeMessage.SucceededWriteScheme(),
            onFailure: () => SchemeMessage.FailedWriteScheme(),
          }),
        );
    }),
  );
}

/** The local storage of the browser as the key-value store of Effect, reached afresh by every read and write. A browser that blocks the storage of the site throws as soon as the storage is asked for, which the store of Effect would do as it is built, failing the editor as it starts; asked for within each read and write, it fails that read or write alone, as the typed error of the store. */
const localStorage = KeyValueStore.layerStorage(() => ({
  get length() {
    return globalThis.localStorage.length;
  },
  clear: () => globalThis.localStorage.clear(),
  getItem: (key: string) => globalThis.localStorage.getItem(key),
  key: (index: number) => globalThis.localStorage.key(index),
  removeItem: (key: string) => globalThis.localStorage.removeItem(key),
  setItem: (key: string, value: string) => globalThis.localStorage.setItem(key, value),
}));

/** The schemes the switch offers, in its order, with the label of each. */
const schemes: ReadonlyArray<{ readonly scheme: SchemeChoice; readonly label: string }> = [
  { scheme: 'system', label: 'System' },
  { scheme: 'light', label: 'Light' },
  { scheme: 'dark', label: 'Dark' },
];

/** The styles of the switch, every length and color from `stylex.env`, as those of the editor. */
const styles = stylex.create({
  scheme: {
    marginBlockStart: stylex.env.space.three,
  },
  heading: {
    marginBlock: 0,
    fontSize: stylex.env.fontSize.body,
  },
  options: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: stylex.env.space.half,
    marginBlockStart: stylex.env.space.one,
  },
  // A scheme is a button as those of the editor are: raised, edged by the border, its edge in the color of text under the pointer, and a ring of the accent under the keyboard's focus.
  option: {
    paddingBlock: stylex.env.space.half,
    paddingInline: stylex.env.space.one,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: {
      default: stylex.env.color.border,
      ':hover': stylex.env.color.text,
    },
    borderRadius: stylex.env.space.half,
    backgroundColor: stylex.env.color.raised,
    color: stylex.env.color.text,
    fontFamily: 'inherit',
    fontSize: stylex.env.fontSize.small,
    lineHeight: 'inherit',
    cursor: 'pointer',
    outlineColor: stylex.env.color.accent,
    outlineOffset: 2,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: 2,
  },
  // The chosen scheme: in the accent, bold, and edged twice as thick, so that it is told apart by more than its color.
  chosen: {
    borderColor: stylex.env.color.accent,
    boxShadow: `inset 0 0 0 1px ${stylex.env.color.accent}`,
    color: stylex.env.color.accent,
    fontWeight: 700,
  },
  status: {
    marginBlockStart: stylex.env.space.half,
    marginBlockEnd: 0,
    color: stylex.env.color.mutedText,
    fontSize: stylex.env.fontSize.small,
  },
});

/**
 * The switch of the color scheme without the Layers it provides itself, for a test that provides its own. It starts by reading the scheme the browser keeps, which the server never knows, so that a document prerendered with no choice shows none until the browser has said; a choice made before the reading is not undone by it. A chosen scheme is set on the root of the document as `data-scheme`, which `src/Styles.css` turns into the `color-scheme` every color follows, and kept by the browser for the next visit. A scheme the browser keeps that the switch does not offer, as from a later editor, is the scheme of the system.
 */
export const SchemeNoDeps = SchemeDef.make({
  init: ($) => $.set({ chosen: null, forgotten: false }).run(ReadScheme.make()),
  update: {
    ClickedScheme: ($, { scheme }) =>
      $.evolve({ chosen: scheme }).run(WriteScheme.make({ scheme })),
    SucceededReadScheme: ($, { stored }) =>
      $.model.chosen !== null
        ? $.model
        : $.evolve({ chosen: Schema.is(SchemeChoice)(stored) ? stored : 'system' }),
    FailedReadScheme: ($) => $.evolve({ chosen: (chosen) => chosen ?? 'system', forgotten: true }),
    SucceededWriteScheme: ($) => $.evolve({ forgotten: false }),
    FailedWriteScheme: ($) => $.evolve({ forgotten: true }),
  },
  // The schemes as toggle buttons in a named group, the chosen one pressed, with a status that says when the browser keeps no choice.
  view: (h, model) =>
    styled(h.div, styles.scheme).children(
      styled(h.h2.attr('id', 'scheme-heading'), styles.heading).children('Color scheme'),
      styled(
        h.div.attrs({ role: 'group', 'aria-labelledby': 'scheme-heading' }),
        styles.options,
      ).children(
        schemes.map(({ scheme, label }) =>
          styled(
            Toggle(h, {
              element: h.button.key(scheme),
              props: { pressed: model.chosen === scheme },
              onToggle: () => SchemeMessage.ClickedScheme({ scheme }),
            }),
            styles.option,
            model.chosen === scheme && styles.chosen,
          ).children(label),
        ),
      ),
      styled(h.p.attr('role', 'status'), styles.status).children(
        model.forgotten
          ? 'The browser keeps no choice here, so this one lasts until the page is left.'
          : '',
      ),
    ),
  // The chosen scheme on the root of the document, once it is known; until then the root keeps what the inline script of `index.html` set.
  head: ({ model }) =>
    model.chosen === null ? [] : [HtmlHead.htmlData('data-scheme', model.chosen)],
});

/** The switch of the color scheme with what it provides itself: the Commands that read and keep the choice, over the local storage of the browser. */
export const Scheme = SchemeNoDeps.pipe(
  Component.provide(
    Layer.mergeAll(ReadScheme.layer, WriteScheme.layer).pipe(Layer.provide(localStorage)),
  ),
);
