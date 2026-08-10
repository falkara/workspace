---
name: standards
description: The coding standards governing every TypeScript source in this repository — how Effect is used, how modules and packages are structured, how things are named, how imports and package manifests are written, and how any claim about behaviour must be verified. Use it before writing or changing any code here; when choosing between two designs; when naming an export, a parameter, a module, or a file; when adding or reordering an import; when editing `package.json`, its `exports`, or its `imports`; when asked to review, audit, sweep, or check code for correctness or consistency; when asked whether something is "done", "correct", "idiomatic", or "up to standard"; when tempted to write a cast, a workaround, or a second copy of a fact the code already states; and when an Effect API appears to be missing something.
---

## Principle

One fact lives in one place, and every claim is checked. Most defects here are not broken code — they are a truth restated somewhere it can drift, or an assertion nobody measured.

## Effect

Effect is the default, not a preference. Reach for plain TypeScript only when a construction is _extremely_ unsuited, and say so rather than doing it quietly.

- Prefer the primitive over the hand-roll: `Schema` over manual validation, `Option` over `undefined`, `Context.Service` over ambient state, `Effect.fromOption` over an `=== undefined` branch.
- No workarounds. If the correct design costs more, pay it. A workaround that typechecks is still a workaround.
- A cast is a claim you stopped checking. `as T` on a value that genuinely might be missing moves the failure somewhere it can't be traced.
- When Effect itself is the blocker — a missing combinator, an inexpressible type, a behaviour you cannot reach — report it with the module, the symbol, and what is missing. **Never open an issue, PR, or discussion upstream, and never offer to.**

## Verifying

Nothing is true because it reads plausibly.

- Check APIs against the **installed `.d.ts`** or the local Effect clone. Never from memory — this is a beta and symbols get renamed between releases.
- Read the implementation before claiming a behaviour is missing. A type that looks imprecise is often a wrapper around code that already does the right thing.
- Measure what can be measured: bundle sizes, exit codes, what a binary actually prints. Run the failing case before and after.
- Probes belong inside the workspace. Outside it, module resolution silently finds a different version.

## Structure

**Execution only at entrypoints.** Libraries and application modules _describe_ programs and return effects. Only `applications/*/src/Entrypoint.ts` and `.test.ts` files may run one. A function name has to reflect this: something that only builds a value is `make`, never `run`.

**One fact, one place.** Derive rather than restate:

- `typeof Manifest.Encoded` types a parameter — do not hand-write the shape.
- `Layer.Success<ReturnType<typeof layerFor>>` names what a stack provides — do not list the services.
- `Consenting['Service']` types an options object — do not repeat its fields.

If two places state the same fact, one of them will be wrong later and nothing will fail.

**Ownership.** The module that defines a service also exports how its layer is built (`layerOf`, `layerWith`, `layer`). Applications compose layers; they do not construct other packages' services.

**Identity comes from the manifest.** Nothing in source asserts what a binary is called — that is the `bin` key, decoded once. A root command _is_ the binary, so it takes the binary's name and description; a subcommand takes its own.

## Naming

- `X.run(y)` means X is the thing being run. If it only builds a value, it is `make`.
- Qualify a name only when the bare word collides with something already present, or its own context cannot disambiguate it. `manifest`, not `packageManifest` — unless a `Manifest` is already in scope.
- Name what a value **is**, not where it came from. `binary.name` is the name of the binary; `manifest.name` would suggest the manifest has one.
- A name that asserts a fact owned elsewhere will drift. Prefer `surface` to a name that repeats the binary's.

## Imports

- Named from the barrel wherever a package publishes one (`effect`, `effect/unstable/cli`, `@effect/platform-node`, `@falkara/*`). This matches Effect's own documented usage and costs nothing — `sideEffects: []` plus a deep-scope-analysing bundler eliminates the rest.
- `import * as` only for direct module paths — `#src/Paths.ts`, or a package submodule with no barrel.
- On a direct path, take an export **by name when the name stands on its own**, and **through the namespace when it does not**. `toSlug`, `centre`, `Capabilities`, `ConfigDirectory` mean something alone; `layer`, `report`, `optional`, `Machine` are named relative to their module, and `Paths.layer` or `Decision.report` is what makes them a sentence. The same module is imported both ways in different files where both kinds of export exist — that is correct, not an inconsistency.
- `import type` when nothing is used at runtime. `verbatimModuleSyntax` is on, so a value import emits a real runtime import.
- Internal paths use `#src/*`. Never `#/src/*` — Node accepts it, Bun does not, and Bun is what runs the source.

## Package manifests

`exports` states what other packages may reach. `imports` states what a package may reach inside itself. Both are narrow by intent:

- One entry point per library, so the barrel is the only door and its curation is enforceable.
- List the subpaths actually used rather than a `#*` wildcard.
- A module absent from the barrel is internal. Do not add exports "in case".

## Auditing

Reviewing code here means checking what it claims, not whether it reads well.

1. **Run the enforced pass first** — `vp check`, then `vp test`. Whatever those catch is not your job.
2. **Separate every claim.** A sentence asserting four things hides the false one. "Its failures carry X and Y" was true of one failure and stated of all.
3. **Verify each claim against the thing it names**, not against plausibility. Read the other module's type. Run the binary. Most rot is a name or a path that moved.
4. **Check for the second copy.** A hand-written type restating a schema, a service list restating a layer stack, a literal restating a value the manifest already holds. Delete the copy that can drift, keep the one that cannot.
5. **Check what survived an edit.** The most common defect is something that outlived the change around it — a narrowed type left by a reverted commit, an import left by a deleted call, a name that no longer matches what it returns.
6. **Report before rewriting.** Group by severity: false or stranded claims first, then structure, then style. The decision to delete is the author's.

## Running the binaries

Manual runs need an **absolute** scratch `XDG_CONFIG_HOME`:

```bash
XDG_CONFIG_HOME=/tmp/falkara-scratch bun applications/cli/src/Entrypoint.ts --help
```

Without it, a run that reaches the telemetry prompt writes a real consent decision to the user's config directory. A _relative_ path is silently ignored per the XDG specification and falls back to the real one — which is the exact failure this prevents. Scaffold runs need a throwaway working directory too; the scaffolder writes where it is invoked.

Prefer a test to a manual run wherever the seams allow it. `Paths.layerOf`, `Capabilities.layerOf`, `Host.Machine` and a supplied `ConfigProvider` make every branch reachable without touching real state.
