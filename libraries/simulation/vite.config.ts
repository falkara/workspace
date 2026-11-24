import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    // The modules of the library, each of which Vite+ packs as an entry with its declarations.
    entry: [
      'src/Coalgebra.ts',
      'src/Coalgebra/DeterministicAutomaton.ts',
      'src/Coalgebra/MealyMachine.ts',
      'src/Coalgebra/SequenceCoalgebra.ts',
      'src/Coalgebra/StreamCoalgebra.ts',
      'src/Functor.ts',
      'src/Functor/BinaryProductFunctor.ts',
      'src/Functor/Coyoneda.ts',
    ],
    // Every module ships as a file of its own, so that a consumer's bundler leaves out the modules it never imports.
    unbundle: true,
  },
  test: {
    // Type tests checked by TypeScript beside the tests Vitest runs.
    typecheck: { enabled: true, include: ['src/**/*.test.ts'] },
  },
});
