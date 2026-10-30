---
'@falkara/presentation': minor
---

`Color.maximumContrastRatio` is 21, the largest contrast ratio WCAG 2.2 defines, of black against white, derived from the flare. `Color.verify` and `Color.shade` refuse a `minimumContrast` above it with that reason, instead of a contrast no colors can reach or, in `shade`, a failure that blamed the background.
