import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    // JSR reads the types of the JavaScript from the declarations it names, as it generates none for JavaScript.
    banner: { js: '/* @ts-self-types="./index.d.mts" */' },
  },
});
