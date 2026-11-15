import { defineConfig } from 'vite-plus';

/** The modules of the library, each of which Vite+ packs as an entry with its declarations. */
const entry = [
  'src/Color.ts',
  'src/Colorimetry.ts',
  'src/Fluid.ts',
  'src/Layout.ts',
  'src/Length.ts',
  'src/Space.ts',
  'src/Typography.ts',
  'src/Viewport.ts',
];

export default defineConfig({
  pack: {
    entry,
    // Every module ships as a file of its own, so that a consumer's bundler leaves out the modules it never imports.
    unbundle: true,
    // JSR reads the types of each JavaScript module from the declarations it names, beside the module, as it generates none for JavaScript. An entry has declarations, and so does every module in the directory of an entry, such as `Colorimetry/Tristimulus`, whose types the entry exports; any other internal module packed beside them, such as Real, has none to name, and no public type reaches it.
    banner: ({ fileName }) =>
      entry.includes(`src/${fileName.replace(/\.mjs$/, '.ts')}`) || fileName.includes('/')
        ? {
            js: `/* @ts-self-types="./${fileName.replace(/^.*\//, '').replace(/\.mjs$/, '.d.mts')}" */`,
          }
        : undefined,
  },
  test: {
    // Type tests checked by TypeScript beside the tests Vitest runs.
    typecheck: { enabled: true, include: ['src/**/*.test.ts'] },
  },
});
