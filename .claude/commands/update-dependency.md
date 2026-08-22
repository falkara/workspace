---
description: Adopt a dependency update fully across the repository
---

A dependency bump is not a version string change. Every release exists for a
reason — a fix, a new capability, a better ergonomic, a faster path — and the
value of the bump is only realised once the repository uses the package the way
its current version intends. Treat the version change as the starting point of
the work, not the work itself.

## Establish the update

Identify the package and both versions from the branch. The lockfile diff and
the pull request title both carry this; prefer the lockfile, as it reflects what
actually resolved.

## Read what actually changed

Do not infer the contents of a release from its version number, its changelog,
or prior knowledge of the package. Read the diff:

```
bun pm diff <package>@<from> <to>
```

Start with `--stat` to see the shape of the release, then read the files that
matter in full. Scope to a path when a package is large:

```
bun pm diff <package>@<from> <to> --stat
bun pm diff <package>@<from> <to> src/
```

Pay attention to what the summary flags — changed entry points, new or removed
exports, dependency movement, install scripts. A deprecation is as informative
as an addition: it names the construct the release wants replaced.

## Understand the intent

From the diff, determine what the release is for. A bug fix implies code written
to work around that bug is now dead weight. A new export implies hand-rolled
equivalents elsewhere are now redundant. A relaxed type or widened signature
implies casts placed to satisfy the old one can go. A performance change implies
a call pattern the package now prefers.

Name the intent explicitly before touching anything. Every edit that follows
should trace back to it.

## Adopt it everywhere

Search the whole repository for every place the affected construct appears — not
only the files the pull request touched, which is usually just the lockfile.
Bring each one to the form the current version intends.

Scope is not a reason to stop. If honouring the release means a wide refactor,
do the wide refactor. A partial adoption leaves the repository in two idioms at
once, which is worse than either.

Use the solution the package documents and intends. Never reach for a workaround
where a supported API exists, and never leave a shim in place once the thing it
compensated for is fixed.

## Verify

Run the checks and report their real output:

```
bun run check
bun run test
```

Extend tests to cover behaviour that changed. If a test only passed because of a
bug that this release fixes, correct the test rather than preserving it.

## Report

Structure the summary under these headings.

**Changelog** — what changed and why, grouped by the domain it touches rather
than by file. One or two lines per group. State the intent of the release at the
top, so the reasoning behind the edits is visible.

**Upstream opportunities** — every place the package's API forced something
awkward: a limitation worked around, an ergonomic gap, a type that could be
tighter, a capability that would have made the integration cleaner. These are
candidates to raise with the maintainers, so describe each concretely enough to
open an issue from.

**Open questions** — anything non-trivial where the right direction is genuinely
unclear, or where the change would reach further than the evidence supports. Ask
rather than guess. Leave that work undone, state plainly what is blocked and
why, and complete everything that does not depend on the answer.
