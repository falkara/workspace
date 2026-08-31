import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    // The vendored schemas are kept byte-identical to what they were published as, so re-vendoring one stays a clean diff.
    ignorePatterns: ['scripts/schemas/**'],
    singleQuote: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
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
