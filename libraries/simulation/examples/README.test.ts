import { NodeServices } from '@effect/platform-node';
import { describe, expect, it } from '@effect/vitest';
import { Effect, FileSystem, Path } from 'effect';

describe('README', () => {
  it.effect('shows the code that README.ts type-checks, block after block', () =>
    Effect.gen(function* () {
      const fileSystem = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const page = yield* fileSystem.readFileString(
        yield* path.fromFileUrl(new URL('../README.md', import.meta.url)),
      );
      const code = yield* fileSystem.readFileString(
        yield* path.fromFileUrl(new URL('README.ts', import.meta.url)),
      );

      // A block inside a list takes the indentation of the list, which the code leaves out.
      const blocks = [...page.matchAll(/^( *)```ts\n([\s\S]*?)^\1```$/gm)].map(
        ([, indentation = '', block = '']) =>
          block.replaceAll(new RegExp(`^${indentation}`, 'gm'), '').trimEnd(),
      );

      // The code opens with a comment of its own, which the page leaves out.
      expect(code.slice(code.indexOf('\n\n') + 2)).toBe(`${blocks.join('\n\n')}\n`);
    }).pipe(Effect.provide(NodeServices.layer)),
  );
});
