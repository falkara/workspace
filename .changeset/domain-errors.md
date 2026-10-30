---
'@falkara/presentation': minor
---

`Color.verify` fails with a `ContrastShortfall`, which holds the contrast of the colors and the contrast required, when a pair falls short of the contrast its text needs, and `Color.shade` fails with a `NoLegibleShade` when no shade within sRGB reaches it. Both are tagged errors apart from the `SchemaError` of an input that is not valid, so that a caller tells a result from a typo by its `_tag`, or catches it with `Effect.catchTag`, instead of reading the message.
