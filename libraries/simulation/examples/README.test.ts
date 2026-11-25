import { NodeServices } from '@effect/platform-node';
import { describe, expect, it } from '@effect/vitest';
import { Effect, FileSystem, Path } from 'effect';

describe('README', () => {
  it.effect('shows every block of code that a module of the folder README type-checks', () =>
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const page = yield* fileSystem.readFileString(
        yield* path.fromFileUrl(new URL('../README.md', import.meta.url)),
      );
      const codes = yield* Effect.forEach(
        [
          'Spotlight',
          'InPlace',
          'SequenceCoalgebra',
          'MealyMachine',
          'DeterministicAutomaton',
          'ResumptionCoalgebra',
          'Effects',
          'Composition',
          'Coalgebra',
          'Failing',
        ],
        (module) =>
          Effect.flatMap(
            path.fromFileUrl(new URL(`README/${module}.ts`, import.meta.url)),
            (file) => fileSystem.readFileString(file),
          ),
      );

      // A block inside a list takes the indentation of the list, which the code leaves out.
      const blocks = [...page.matchAll(/^( *)```ts\n([\s\S]*?)^\1```$/gm)].map(
        ([, indentation = '', block = '']) =>
          block.replaceAll(new RegExp(`^${indentation}`, 'gm'), '').trimEnd(),
      );

      // A module ends with the names that the page defines in the blocks before its own, which the page leaves out.
      expect(
        codes.map(
          (code) =>
            code.split('\n// The names that the page defines in the blocks before this one.\n')[0],
        ),
      ).toStrictEqual(blocks.map((block) => `${block}\n`));
    }).pipe(Effect.provide(NodeServices.layer)),
  );
});
