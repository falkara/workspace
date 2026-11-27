import { HtmlServer } from '@effect/ui/html';
import { Effect } from 'effect';
import { HttpRouter, HttpServerResponse } from 'effect/http';
import { document } from 'virtual:@effect/ui/document';

import { Editor } from '#src/Editor';

/**
 * The document of the editor as it is before anything is done in it: the palette, an empty canvas and the inspector, with the state the browser entry hydrates from. The Vite plugin of Effect UI asks for it once as it builds and writes the answer as `index.html`, so that the editor shows before its JavaScript loads; the development server asks for it on every request. The render is static, as one document serves every visitor.
 */
export default HttpRouter.add('GET', '/', () =>
  HtmlServer.renderToHtml(Editor, {}, { static: true }).pipe(
    Effect.map((page) => HttpServerResponse.html(document(page))),
  ),
);

/** The paths the build prerenders: the one document the editor is. */
export const prerender = ['/'];
