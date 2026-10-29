---
'@falkara/presentation': minor
---

`Fluid.clamp` takes its sizes as fractions and returns an `Exit` that fails with a `SchemaError` when the value would shrink or grow by more than the maximum text growth factor, so that no fluid value the library writes breaks the guarantees it makes for text. The steps of `Typography.scale` and `Space.scale` hold their sizes as fractions to match.
