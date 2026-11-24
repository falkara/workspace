import { describe, expect, it } from '@effect/vitest';

import jsrJson from '#jsr.json' with { type: 'json' };
import packageJson from '#package.json' with { type: 'json' };

describe('exports', () => {
  it('point each module at the files Vite+ packs from it, in `package.json` and in `jsr.json` alike', () => {
    const modules = Object.keys(packageJson.exports).map((subpath) => subpath.replace(/^\.\//, ''));

    expect(packageJson.exports).toEqual(
      Object.fromEntries(
        modules.map((module) => [
          `./${module}`,
          { types: `./dist/${module}.d.mts`, default: `./dist/${module}.mjs` },
        ]),
      ),
    );
    expect(jsrJson.exports).toEqual(
      Object.fromEntries(modules.map((module) => [`./${module}`, `./dist/${module}.mjs`])),
    );
  });
});
