import { describe, expect, it } from '@effect/vitest';

import jsr from '#jsr.json' with { type: 'json' };
import manifest from '#package.json' with { type: 'json' };
import config from '#vite.config';

describe('exports', () => {
  it('point each module at the files Vite+ packs from it, in package.json and in jsr.json alike', () => {
    const modules = Object.keys(manifest.exports).map((path) => path.replace(/^\.\//, ''));

    expect(manifest.exports).toEqual(
      Object.fromEntries(
        modules.map((module) => [
          `./${module}`,
          { types: `./dist/${module}.d.mts`, default: `./dist/${module}.mjs` },
        ]),
      ),
    );
    expect(jsr.exports).toEqual(
      Object.fromEntries(modules.map((module) => [`./${module}`, `./dist/${module}.mjs`])),
    );
  });

  it('are the modules Vite+ packs', () => {
    const modules = Object.keys(manifest.exports).map((path) => path.replace(/^\.\//, ''));

    expect(config.pack).toMatchObject({ entry: modules.map((module) => `src/${module}.ts`) });
  });

  it('are modules of the library', async () => {
    const modules = Object.keys(manifest.exports).map((path) => path.replace(/^\.\//, ''));
    const imported = await Promise.all(modules.map((module) => import(`#src/${module}`)));

    expect(imported.every((namespace) => Object.keys(namespace).length > 0)).toBe(true);
  });
});
