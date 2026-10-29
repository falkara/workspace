import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    // Documentation comments ship once, in the type declarations an editor reads, not again in the JavaScript.
    outputOptions: { comments: { jsdoc: false } },
  },
});
