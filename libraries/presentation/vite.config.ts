import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    outputOptions: {
      // Documentation comments ship once, in the type declarations an editor reads, not again in the JavaScript.
      comments: { jsdoc: false },
      // JSR reads the types of the JavaScript entry from the declarations it names, as it generates none for JavaScript.
      banner: (chunk) =>
        chunk.isEntry && chunk.fileName === 'index.mjs'
          ? '/* @ts-self-types="./index.d.mts" */'
          : '',
    },
  },
});
