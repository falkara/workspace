import { BrowserHost, HtmlHydrate } from '@effect/ui/html';
import { Effect, Layer, Option, Schema } from 'effect';

import { Editor } from '#src/Editor';

/** A schema of the state a prerendered document carries as JSON text, by the path of every instance, which Effect UI decodes further with the schemas of the components as it hydrates. */
const State = Schema.fromJsonString(Schema.Record(Schema.String, Schema.Unknown));

// The editor, live in the root of the document for as long as the document is open. A prerendered document carries the state it was rendered from, and the editor adopts its elements rather than build them again; a document without that state, or with state that is no JSON, is mounted fresh. The devtools come from the plugin of the development server, so nothing of them is mounted here. A document without the root is not the one the editor is built into, and mounts nothing.
Option.match(Option.fromNullishOr(document.getElementById('root')), {
  onNone: () => Effect.void,
  onSome: (root) =>
    Layer.launch(
      Option.match(
        Option.flatMap(
          Option.fromNullishOr(document.getElementById('state')?.textContent),
          Schema.decodeOption(State),
        ),
        {
          onNone: () => BrowserHost.mount(Editor, {}, root),
          onSome: (state) => HtmlHydrate.hydrate(Editor, {}, root, state),
        },
      ),
    ),
}).pipe(Effect.runFork);
