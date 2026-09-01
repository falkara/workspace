import { recommended } from '@effect/tsgo/oxlint-presets';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    // The vendored schemas are kept byte-identical to what they were published as, so re-vendoring one stays a clean diff.
    ignorePatterns: ['scripts/schemas/**'],
    singleQuote: true,
  },
  lint: {
    extends: [recommended],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      {
        // The scripts are `vp pack` build hooks and their tooling: they run synchronously inside Vite Plus's build pipeline, not inside an Effect runtime, so Node's own modules and console are their native vocabulary rather than a detour around Effect's.
        files: ['scripts/**'],
        rules: {
          'effecttsgo/global-console': 'off',
          'effecttsgo/node-builtin-import': 'off',
        },
      },
    ],
  },
  staged: {
    '*': 'vp check --fix',
  },
  test: {
    projects: [
      'applications/*',
      'libraries/*',
      // Tooling, and the repository's own configuration: not a workspace member, so it needs a project of its own.
      { test: { name: 'scripts', root: './scripts', include: ['**/*.test.ts'] } },
    ],
  },
});
