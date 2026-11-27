import * as Cloudflare from '@alchemy.run/cloudflare';
import * as Alchemy from 'alchemy';
import { Config, Effect } from 'effect';

export default Alchemy.Stack(
  'FalkaraWorkspace',
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
    secrets: Alchemy.Secrets.DotEnv(),
  },
  Effect.gen(function* () {
    // The custom domain of the editor, read for a deploy alone, as `alchemy dev` serves the editor on its own development server.
    const editorDomain = (yield* Alchemy.ALCHEMY_DEV)
      ? undefined
      : yield* Config.String('EDITOR_DOMAIN');

    // The editor is the document `vp build` prerenders and its assets, deployed as they are built. `Website.Vite` would build it with Cloudflare's Vite plugin injected, which takes the `ssr` environment Effect UI prerenders the document in for the entry of a Worker, so the editor is built by its own command instead.
    const editor = yield* Cloudflare.Website.StaticSite('Editor', {
      cwd: 'applications/editor',
      command: 'vp build',
      outdir: 'dist',
      // The build is run again when the editor, the source of the presentation library it imports, or the lockfile changes.
      memo: {
        include: [
          '**/*',
          '../../libraries/presentation/src/**',
          '../../libraries/presentation/package.json',
        ],
        lockfile: true,
      },
      dev: { command: 'vp dev' },
      workersDev: false, // Worker served on no workers.dev URL and no version preview URL by Cloudflare.
      ...(editorDomain === undefined ? {} : { domain: editorDomain }), // Worker served on its custom domain alone, with a certificate of its own from Cloudflare.
      assets: {
        htmlHandling: 'auto-trailing-slash', // Document served at `/` from `index.html` by Cloudflare, which redirects `/index.html` to `/`.
        notFoundHandling: 'none', // Every other path answered with 404 by Cloudflare, as the editor is one document.
        headers: '/*\n  X-Content-Type-Options: nosniff\n', // Every file held to its declared Content-Type by the browser.
      },
    });

    return {
      editor: editor.urls,
    };
  }),
);
