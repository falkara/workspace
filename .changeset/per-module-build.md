---
'@falkara/presentation': minor
---

Every module is imported on its own path, such as `import * as Typography from '@falkara/presentation/Typography'`, on npm and on JSR, and the package root no longer exports anything. Every module ships as a file of its own and the package declares itself free of side effects, so that a bundler leaves out the modules a project never imports: a project that reads only the line lengths of `Layout` takes 0.2 kB instead of 6 kB with `Color` inside.
