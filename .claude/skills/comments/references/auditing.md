# Auditing

An audit is not a prose review. It looks for what has quietly stopped holding: a comment that is no longer true, a shape the convention does not allow.

Two passes, divided by who does the checking.

## What the linter reports

Run it and read what it reports. It checks form, and which rules it runs is a question for the lint config — the only place that stays current, and the reason this section does not list them.

What it cannot do is weigh a claim: whether a comment is true, whether it earns its place, whether it belongs somewhere else entirely.

## What you read yourself

Work through the file in order. For each comment:

1. **Check its shape against Scope, Forms and Content rules.** Whether a block may collapse, whether a statement may carry one, whether a re-export or a file has picked one up, whether a tag appears that the policy does not write — among others. Whatever the linter did not report is yours to read for, and how much that is depends on the config.
2. **Read what it claims**, separately from what the code does. If it is more than one fact, write them down separately — mixed claims hide the false one.
3. **Verify every claim that can be checked.** Paths, symbol names, ordering, counts, "only X does Y", references to other files. Read the code; do not reason from the comment's plausibility. Most rot is a path or a name that moved in a refactor, and it always reads fine. These are the categories the prohibitions ban outright, so an audit meets them only in inherited text — verify first anyway, because a false one is a defect to correct now, while a true one is a rewrite that the prohibitions will call for.
4. **Check it against the prohibitions.** A comment can be entirely true and still belong in the commit message.
5. **Check it is still attached to its subject.** A comment describing code that now lives elsewhere, or sitting above the statement that replaced the one it explained, is a defect even when every word is accurate.
6. **Decide: keep, rewrite, or delete.** Deleting is a normal outcome, and the most common one. A file with fewer load-bearing comments is better than one with a comment per statement.

## Output

Report findings; do not rewrite in place unless asked. The list is the deliverable, because the decision to delete someone's comment is theirs.

Group by severity: claims that are now false or stranded from their subject first, then breaches of scope or form, then prohibited categories, then style. Scope outranks craft here for the same reason it is settled first — a comment in the wrong place is not improved by being well written. For each, quote the comment, state what is wrong with it, and propose the replacement, or propose deletion and say what is lost.
