import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    // The modules of the library, each packed by Vite+ as an entry with its declarations so that a module that holds types alone still exists as JavaScript for the declarations of another module to name.
    entry: ['src/**/*.ts', '!src/**/*.test.ts'],
    // Every module ships as a file of its own, so that the bundler of a consumer leaves out the modules the consumer never imports.
    unbundle: true,
    // JSR generates no types for JavaScript and reads the types of every JavaScript module from the declarations that the module names beside it. Every module of the library has declarations, whereas the runtime that Rolldown adds under `_virtual` for a namespace that a module exports, such as those of the entry point, has none.
    banner: ({ fileName }) =>
      fileName.startsWith('_virtual/')
        ? {}
        : {
            js: `/* @ts-self-types="./${fileName.replace(/^.*\//, '').replace(/\.mjs$/, '.d.mts')}" */`,
          },
  },
  test: {
    // Type tests checked by TypeScript beside the tests Vitest runs.
    typecheck: { enabled: true, include: ['**/*.test.ts'] },
  },
});
