---
name: comments
description: The convention governing code comments and TSDoc blocks in this repository. Use it when writing, rewriting, shortening, or deleting any comment or doc block; when adding an export, since every export carries one; when the user calls a comment too long, too obvious, too explicit, or asks whether something needs a comment at all; when a refactor moves, splits, renames, or merges code that carries commentary; when asked to audit, sweep, review, or check the comments in a file or directory; when a comment's claim about paths, names, ordering, or "only X does Y" needs verifying rather than trusting; before declaring a file or module finished, since a comment stranded from its subject is the most common defect here; and when asked how comments work in this codebase, or which form applies where. Not for README files, the docs site, or commit messages.
---

## Principle

A comment carries what the code cannot: the constraint, the regulation, the protocol, or the measurement that produced this shape. Nothing checks whether one is true, so write only what a reader cannot recover from the code, and only in terms that stay true when the code around them moves.

## Scope and boundary

Two questions get argued repeatedly: which files the convention covers, and what in them must carry a comment. Both are settled here, before any question of how to write one.

### Files

TypeScript sources — all of them, including tests and config files.

### The requirement

Every export carries a TSDoc block, including those whose names already say everything, where the block will be one sentence that echoes the name. The carve-outs below are settled the same way — by looking at the file, not by judging who reads it.

### Where it stops

- **Non-exported declarations** take no TSDoc, ambient members aside. Their audience is the file they sit in, which is what `//` is for.
- **Re-exports** — `export * from`, `export { x } from` — carry nothing. The block belongs with the declaration.
- **Statements** take `//` or nothing, never TSDoc.
- **Files** take no header in either form. A contract spanning the file goes on the export that establishes it — the function that sets the order, the constant that fixes the format — never copied onto each export that depends on it. Where no export establishes it, it belongs in the commit message or in the project's own records.

### Exceptions

- **Ambient members** — `declare global` properties — take a TSDoc block despite not being exports.
- **Tests** (a `.test.` segment in the filename) are outside the requirement, including one that exports a fixture. The `//` rules apply in full.
- **Config files** are outside the requirement. The `//` rules apply, and these files often carry the heaviest rationale in a project.

## Deciding whether to write

The decision differs by form: on an export it is already made, on a statement it is yours every time.

### On an export

Already decided — scope requires a block. The only open question is whether anything follows the summary, and the second-paragraph rule under content rules answers it.

### On a statement

The default is nothing. Four questions, in order; the first "no" ends it.

1. **Can the reader recover this from the code in front of them?** If yes, write nothing. This eliminates most candidates.
2. **Can you name what they would lose?** Not "context" — the specific thing: a regulation, a protocol detail, a measured number, an ordering guarantee, an outside limit that ruled out the obvious approach. If you cannot name which, you do not have a comment yet.
3. **Will it still be true in a year with nobody maintaining it?** A fact about a law, a protocol, or a measurement will be. A claim about the code next to it will not.
4. **Is it already stated on the declaration above?** If so, the local copy is a second version that will disagree with the first.

### Before writing either

**If the comment exists to excuse the code, change the code.** A comment cannot fix a name that misleads or a function doing three things, and writing one converts a fixable defect into a permanent one.

**If the guarantee can be enforced, enforce it.** A test, a type, or a lint rule fails when someone breaks the invariant; a paragraph asking them not to does not. Where enforcement exists, the comment shrinks to stating what the invariant is, and stops arguing for it.

## Forms

Two shapes, and the choice between them is settled by what the comment sits on, not by how much there is to say.

### TSDoc block

`/** */`, on declarations. It is the only form that reaches a use site on hover and the only one a documentation generator can read, which is what makes it worth its space — and why it is reserved for things other code can refer to.

Blocks stay multi-line even when they would fit on one. A collapsed block turns every later edit into a rewrite of the whole line, which costs more in review than the two lines it saves.

### Line comment

`//`, on statements, on **one line however long**. The formatter reflows a block's prose to fit the print width; it does not touch line-comment breaks. A wrapped `//` therefore has to be rewrapped by hand after every edit that shifts it, and nothing reports it when someone doesn't. One long line has no such failure mode: in a block the formatter owns the breaks, so extra lines cost nothing to keep; in a line comment you own them, and every one is a line to maintain by hand.

### Placement

Directly above the subject, with no blank line between them. A comment separated from what it explains is the first step toward being stranded from it entirely.

Never trailing on the same line as code. A trailing comment is pushed around by every reformat of the line it shares, and it is the first thing lost when that line is edited.

### Inside a block

Prose in paragraphs, separated by a blank `*` line. Write it as prose and let the formatter wrap it — hand-broken lines are re-joined anyway, so the breaks are effort that does not survive.

No examples. An example is a claim about behavior that nothing compiles, and it is the highest-rot construct available — rename an export and every example still names the old one, with nothing reporting it. The call sites are the examples: compiled, current, in context, and one reference lookup away. Inline code spans naming an identifier or a value are prose, and stay.

## Content rules

Scope settles that a block exists; this settles what goes in it. The pressure runs one way: a block that must exist invites filling, and every rule below is there to resist that.

### Language

American English, in both forms — _behavior_, _normalize_, _canceled_. Identifiers keep whatever spelling the code or the vendor gave them, and proper nouns keep their own; a comment naming a `colour` property spells it the way the property is spelled.

### Ordering

Summary first, always: one sentence naming what the thing is or is for. Then rationale, if there is any. Then tags, last.

Within a sentence, subject before constraint: "The queue takes only arguments objects, because the consumer branches on the runtime shape of each entry" rather than "Because the consumer branches on the runtime shape of each entry, the queue takes only arguments objects." Opening with the reason leaves the reader holding it with nothing to attach it to.

### What earns more than a summary

A second paragraph earns its place when it carries a constraint the code cannot show — the same categories question 2 of the statement test names. Nothing else does.

It is a paragraph, not a labeled section. A heading announcing that rationale follows is one more thing to write, to keep accurate, and to feel obliged to fill; the paragraph break already says everything the label would.

Most blocks are a summary line and nothing more. That is the expected shape, not a sign of an unfinished one.

### Tag policy

`@param` for every parameter, on every block that documents a function. The signature settles it, and no parameter is exempt for being self-evident — deciding which ones are costs a judgment call at every one of them. The tag describes the value's role, never its type: the signature owns the type, and where that role is already evident from the name, a short restatement is the accepted cost.

- **`@returns`** — omit. The summary and the return type already state it, and where a generator runs it builds the returns section from the type regardless.
- **Types and defaults** are never repeated in a tag. No `{braces}`, no `[name=default]`: both create a second source of truth that nothing checks against the first, while the signature holds the one that is checked.
- **No other tags.** Each one is a claim nothing verifies, and the tempting ones duplicate a record that already exists elsewhere — version history in the repository, grouping in the file layout.

## Prohibitions

A fixed list. Each entry is here because it cost a real edit — a comment that had to be rewritten or deleted, not a style someone dislikes. Nothing joins the list without that provenance, or it stops being a list of defects and becomes a list of preferences.

- **Mechanics of the language or type system.** "Arrows have no `arguments`", "a zero-parameter function is assignable to a rest-parameter type". A competent reader knows, and it ages badly as the language moves.
- **A restatement of the name, past the summary.** The summary may echo the name — that is the cost of a mandatory block. A rationale paragraph that echoes it at greater length is padding wearing the shape of content.
- **The architectural decision.** Why a thing was split rather than merged, injected rather than declared, tested rather than typed. That belongs in the commit message: it is a preference about structure, and someone who organizes it differently gets code that still works. A constraint from outside the code is not this — violate one of those and the code is wrong, not merely different — and it stays on the declaration.
- **Imperatives.** "Must be set before…" becomes "…is set before the first request fires." Describe the property; instructing the reader dates the comment to the moment someone got it wrong.
- **Provenance.** "Verified against the shipped source", "confirmed by testing". It is a boast, it rots the first time someone doubts it, and it invites trusting the comment instead of checking. A measurement is not an exception: give the number and what it measures, never the act of measuring. If a reader cannot repeat it from what you wrote, what is missing is the subject, not the provenance.
- **Vendor names where a role works.** "The consumer" outlives the vendor's name, and reads as a property of the design rather than a note about a third party. Keep the literal name only where it is the identifier under discussion.
- **Positions and counts.** "The two below", "LAST", "the block above". These break silently when a line moves and nothing checks them. State the property instead — what makes the ordering true, not where the code currently sits.
- **Claims about neighboring code.** "Matches what the banner promises", "same list as the router uses". The moment that other code changes, the comment is false and nothing fails. Cite the thing both of them derive from — the regulation, the protocol, the measurement — or say nothing.

  One exception, and it is the one the Files rule relies on: a contract the export itself establishes. There the dependency runs the other way, so a change that would falsify the comment has to pass through the code the comment sits on, where it is visible.

- **Markers and asides.** TODOs, FIXMEs, review notes, questions to a future reader. A tracker holds work; a comment holds why the code is the way it is.

## References

The rest lives in two files; read each when its moment arrives, not before.

- `references/worked-examples.md` — the real before-and-after edits behind these rules. Read it before a sweep, or when a rule's application to a concrete comment is unclear.
- `references/auditing.md` — the audit procedure and its output format. Read it before any audit, sweep, review, or check of existing comments.
