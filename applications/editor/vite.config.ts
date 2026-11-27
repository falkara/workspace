import { DevToolsVite } from '@effect/ui-devtools/node';
import * as HtmlServerVite from '@effect/ui/html/HtmlServerVite';
import stylex from '@stylexjs/unplugin';
import { Effect } from 'effect';
import { defineConfig } from 'vite-plus';

import { environment } from './Environment';

// The values of the design language, which the styles read at compile time through `stylex.env`. They are worked out here, at the edge of the build, which stops with the reason of Falkara Presentation when it refuses one.
const env = Effect.runSync(environment);

// What StyleX writes is kept as it is written, its colors the light-dark() of their two schemes. Left to itself, StyleX lowers its rules with Lightning CSS for the default browsers of browserslist, which turns every light-dark() into a pair of variables that only the lowering of a color-scheme declaration defines; the color-scheme of src/Styles.css is lowered by the build alone and never in development, so the variables went undefined and every color with them. Targets that name no browser lower nothing, so the colors and the color-scheme they follow meet as CSS writes them, in development and in the build alike, in every browser with light-dark().
const options = { env, lightningcssOptions: { targets: {} } };

export default defineConfig({
  plugins: [
    // StyleX compiles the styles of the editor. Tests take its Rolldown entry, which compiles them alike without the timer of the development server that would keep a test run from ending.
    process.env['VITEST'] === undefined ? stylex.vite(options) : stylex.rolldown(options),
    // The devtools of Effect UI beside the development server: their overlay in the page and their MCP server, on a port of its own so that it runs beside those of other projects.
    DevToolsVite.plugin({ port: 4778, dispatch: true }),
    // The document of the editor rendered ahead of the browser: on every request of the development server, and once by the build, which writes it as `index.html` for the browser entry to hydrate.
    HtmlServerVite.plugin({ entry: '/src/Prerender.ts' }),
  ],
  optimizeDeps: {
    entries: ['src/Entrypoint.ts'],
  },
  test: {
    name: 'editor',
    include: ['src/**/*.test.ts'],
  },
});
