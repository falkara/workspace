---
'@falkara/presentation': patch
---

`Color.verify`, `Color.shade` and the schemas `Color.Pair` and `Color.Brand` say that text counts as bold from the weight CSS Fonts gives the bold keyword, 700, as WCAG 2.2 counts 14 point bold text as large-scale without saying which weight is bold, instead of attributing the whole rule to WCAG 2.2.
