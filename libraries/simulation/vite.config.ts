import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    // The modules of the library, each of which Vite+ packs as an entry with its declarations.
    entry: [
      'src/BinaryProductFunctor.ts',
      'src/Coalgebra.ts',
      'src/Coyoneda.ts',
      'src/DeterministicAutomaton.ts',
      'src/Functor.ts',
      'src/FunctorComp.ts',
      'src/FunctorConst.ts',
      'src/MealyMachine.ts',
      'src/SequenceCoalgebra.ts',
      'src/StreamCoalgebra.ts',
    ],
    // Every module ships as a file of its own, so that a consumer's bundler leaves out the modules it never imports.
    unbundle: true,
  },
  test: {
    // Type tests checked by TypeScript beside the tests Vitest runs.
    typecheck: { enabled: true, include: ['src/**/*.test.ts'] },
  },
});
