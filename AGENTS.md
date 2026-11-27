# Falkara Workspace

## Foundations

**Every package builds on its foundation in full: the theory on Mathlib, the TypeScript on Effect.**

- The theory takes every notion that Mathlib or the standard library of Lean states from there and never declares it again, as the skill `formalize` and rule LEAN-DEC-5 set out. Mathlib is the source of truth of the theory and is cited wherever it states an item, and a textbook supplements it only with the items Mathlib lacks.
- Every package written in TypeScript is built on Effect and serves Effect alone. It takes every notion that Effect provides from Effect, such as `Schema`, `Rational`, `Stream`, `Layer`, and `Context`, and offers no interface for TypeScript without Effect.

## TypeScript Configuration

TypeScript 7 checks types and nothing else. Every other job has a tool of its own: Rolldown emits JavaScript and lowers syntax, Oxlint checks rules, Oxfmt formats, and Node.js runs only what it can run as-is. `vp check` type-checks every file against the nearest `tsconfig.json`.

**One rule splits the configuration: the base says how TypeScript checks, each project says where its code runs.**

- `tsconfig.base.json` holds only what is the same everywhere: strictness, the lint-like options switched off because Oxlint checks them, `noEmit`, `target: "esnext"`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, and the Effect language service plugin. Nothing in it describes a runtime.
- Each project's `tsconfig.json` extends the base and describes its environment, and nothing else: `lib` for the built-in API its runtime has, `types` for its host API, `module` for who resolves its imports, `include` for its files, as `["**/*.ts"]`, and `paths` for a library whose examples import its public paths, resolved to its source.
- Every project runs in Node.js: development on the active LTS line that `devEngines.runtime` names, and the published binaries on every LTS line that `engines.node` names. The applications in `applications/` are bundled by `vp pack` and run as Node.js binaries, together with their Vite configs, save the web applications set out below. The libraries in `libraries/` are bundled into them. `libraries/presentation` is the one exception: a published library for web applications, whose values run at build time and in the browser. `scripts/` holds the `vp pack` build hooks, loaded through the applications' Vite configs. The root `tsconfig.json` covers the root's own files alone, `["*.ts"]`, never another project's.
- A project whose files run in two environments gets one config per environment, each including only the files that run there, and its `tsconfig.json` only references them: `tsconfig.app.json` for its `src` and `tsconfig.node.json` for its configs. Only the web applications need this today.
- A web application runs in the browser and is built by `vp build`, never packed by `vp pack`; `applications/editor` is the one today. Its files run in three environments, so it gets three configs: `tsconfig.app.json` for its `src`, with `lib` as `["es2022", "dom"]`, `types` for the host API its source reads, such as `vite/client`, and `module: "preserve"`; `tsconfig.node.json` for its configs and the files they load, which run in Node.js as every Vite config does; and `tsconfig.test.json` for its tests, which Vitest runs in Node.js against the source of the browser, so its `lib` joins the two. Their comments take the same form: `Built-in API checked against the default build target of Vite and the DOM.`

**Decisions behind the values:**

- `lib` matches the runtime, checked rather than assumed: `es2024` for Node.js 22, the oldest LTS line in `engines.node`, and `es2022` for Vite's default build target where code also runs in the browser. TypeScript checks the API; nothing else can, as Rolldown lowers syntax but never adds API.
- `target` stays `esnext` in the base. Syntax is lowered by Rolldown, which bundles everything that ships, and Node.js rejects what it cannot parse. TypeScript does not police syntax.
- `module` is `preserve` wherever a bundler or a loader resolves imports, which is every project today, and `nodenext` only where Node.js resolves them itself.
- `allowImportingTsExtensions` and `.ts` import specifiers belong only to scripts that Node.js runs as-is. Everything bundled imports without an extension, and each package's `#src/*` import maps to `./src/*.ts`.
- Node.js follows its release lines. `devEngines.runtime` names the active LTS line alone, from its first LTS release, so that every developer and every workflow runs the same version, and no package overrides it. `engines.node` in the packages names every LTS line while it is LTS, each from its first LTS release, and Rolldown lowers syntax to the oldest of them. `@types/node`, the `lib` of every Node.js project and the comments that name the version follow that oldest line. When a line enters LTS or reaches its end, move `devEngines.runtime`, `engines.node`, `node-version` in the workflows, `@types/node`, `lib`, and the comments that name the version together.
- Options keep their TypeScript 7 defaults unless a reason is written beside them: `strict`, `types: []`, `moduleResolution` follow from what is set.

**Comments.** Every compiler option that is set carries a one-line comment in one form, stating who takes the job or what the value is checked against, without explaining why: ``Rule checked by Oxlint `eslint/no-unreachable` instead.``, `Rule checked by TypeScript, as Oxlint has no equivalent.`, `Imports resolved by Rolldown instead.`, `Built-in API checked against Node.js 22.`

## Color Schemes

**Every view of a web application is developed and checked in the light and the dark color scheme alike.**

- A web application follows `prefers-color-scheme` until the reader chooses a scheme, which the browser remembers, and its prerendered document is drawn in the chosen scheme from the first paint.
- Every color has a light and a dark value, and every color of text is verified with `Color.verify` of `@falkara/presentation` against every background it is set on, in both schemes, as the build works out the values, so that a scheme that falls short of WCAG 2.2 Contrast (Enhanced) stops the build.
- A view is done when it has been looked at, and its tests pass, in both schemes.

## Infrastructure

**Every Cloudflare resource of the workspace is declared in one Alchemy stack, `alchemy.run.ts` at the root, named `FalkaraWorkspace`.**

- All stacks of the account share one state store, which tells them apart by name alone, so the stack is named after the project. It is to hold the whole platform, so that its Workers, Durable Objects and Containers bind to each other within one stack; today it holds the editor alone.
- The editor is the Worker `Editor`, which serves what `vp build` writes to `applications/editor/dist`, the prerendered document and its assets, with no script of its own, on its custom domain alone.
- `alchemy` and `@alchemy.run/cloudflare` sit in the root `devDependencies` at one version.
- The stack runs from the root: `vp exec alchemy deploy --stage <stage>` deploys it, and `vp exec alchemy dev` runs it locally, with the editor on its own `vp dev`.
- Every value that depends on the environment is read from `.env` at the root, one explicitly named variable each, never written in code: `EDITOR_DOMAIN`, the hostname the editor is served on, in a zone of the account, read for a deploy alone, as `alchemy dev` serves the editor on its own development server. `.env.example` lists the variables without values.
- Every pinned setting carries a one-line comment in one form, stating who takes the job: `Every other path answered with 404 by Cloudflare, as the editor is one document.`
