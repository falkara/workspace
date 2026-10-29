import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: [
      'src/Color.ts',
      'src/Fluid.ts',
      'src/Fraction.ts',
      'src/Layout.ts',
      'src/Length.ts',
      'src/Space.ts',
      'src/Typography.ts',
      'src/Viewport.ts',
    ],
    // Every module ships as a file of its own, so that a consumer's bundler leaves out the modules it never imports.
    unbundle: true,
    // JSR reads the types of each JavaScript module from the declarations it names, as it generates none for JavaScript.
    banner: ({ fileName }) => ({
      js: `/* @ts-self-types="./${fileName.replace(/\.mjs$/, '.d.mts')}" */`,
    }),
  },
});
