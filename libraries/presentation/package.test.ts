import { describe, expect, it } from '@effect/vitest';

import jsrJson from '#jsr.json' with { type: 'json' };
import packageJson from '#package.json' with { type: 'json' };
import * as Entrypoint from '#src/Entrypoint';

describe('exports', () => {
  it('point each module at the files Vite+ packs from it, in `package.json` and in `jsr.json` alike', () => {
    // The root of the package is the module `Entrypoint`, and every other subpath the module of its path.
    const modules = Object.keys(packageJson.exports).map(
      (subpath) => [subpath, subpath === '.' ? 'Entrypoint' : subpath.slice(2)] as const,
    );

    expect(packageJson.exports).toEqual(
      Object.fromEntries(
        modules.map(([subpath, module]) => [
          subpath,
          { types: `./dist/${module}.d.mts`, default: `./dist/${module}.mjs` },
        ]),
      ),
    );
    expect(jsrJson.exports).toEqual(
      Object.fromEntries(modules.map(([subpath, module]) => [subpath, `./dist/${module}.mjs`])),
    );
  });

  it('give at the root every other module as a namespace named after the module', () => {
    expect(Object.keys(Entrypoint).sort()).toEqual(
      Object.keys(packageJson.exports)
        .filter((subpath) => subpath !== '.')
        .map((subpath) => subpath.replace(/^.*\//, ''))
        .sort(),
    );
  });
});
