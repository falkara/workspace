---
'@falkara/presentation': minor
---

`Color.reaches(colors, ratio)` decides whether text over its background reaches a contrast ratio from 1:1 to 21:1 as `Color.verify` decides it, refusing only a shortfall that rounding cannot account for, and takes the ratio alone too, as `pipe` calls it. `Color.Colors` is the schema of the text and background it takes. `Color.contrast` says that its ratio is the one JavaScript computes, so that black against white gives 20.999999999999986, and that `reaches` or `verify` decides whether it meets a ratio.
