# Worked examples

Every pair below is a real edit. Where a side was a deletion, or too long to quote whole, it is described rather than shown.

These pairs are not the construct the "no examples" rule bans. They record edits that already happened, and a past event cannot stop being true; an example inside a block asserts that the current API behaves that way, which is a live claim nothing checks.

**Vendor name → role.**

- Before: `gtag.js drops arrays, so we push the arguments object instead.`
- After: `Arrays take the consumer's legacy branch and get dropped.`

The fact survives a change of vendor, and reads as a property of the design rather than a note about a third party.

**Mechanism → nothing.**

- Before: `// Preserve an existing queue if one is already there.`
- After: deleted. The line was `(window.dataLayer ??= [])`, which says exactly that.

**Position → property.**

- Before: `// LAST, so everything above is queued first.`
- After: `// Fetching is asynchronous, so later emissions are queued well before the consumer reads them.`

The first breaks silently when a line moves. The second states why the ordering holds, which no edit can invalidate without also breaking the code.

**Stranded by a refactor.**

- Before: `a cache would have to be invalidated on changes to consent.ts AND analytics.ts`
- After: `a cache would have to be invalidated on changes to any module the inlined entry reaches`

Both files had been split into a directory before anyone noticed, and nothing failed when they moved. The replacement names the property the cache depends on rather than the files it happens to reach today, so no later move can strand it.

**Trailing clause that explained the type system.**

- Before: `…and callee is the single property enforcing that — widening this element type to accept anything else removes the guarantee.`
- After: `…and callee is the single property enforcing that.`

The reader considering a wider type already has the fact. Spelling out the inference is mechanics.

**A `@returns` tag.**

- Before: `@returns Those values as an arguments object`
- After: removed.

The type states what comes back, the summary states what it means, and a tag has nothing left to say. That holds for every function, which is why the rule is unconditional rather than a judgment about whether a particular tag duplicates.

**Described → enforced.**

- Before: a block asserting that a call is pushed "verbatim", with nothing checking it.
- After: the same summary, plus a test asserting the shape of what actually lands.

The comment states what the invariant is; the test is what fails when someone breaks it.
